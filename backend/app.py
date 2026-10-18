"""
Flask REST API for Fuel Consumption Analysis System.
Provides modular endpoints for Vehicle CRUD, Fuel Records CRUD,
Mileage Engine validations, Pandas/NumPy analytics, reports, CSV export,
and database status/configuration.
"""

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import io
import csv
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from config import Config
from database import db_manager
from services.mileage_engine import MileageEngine
from services.analytics_service import AnalyticsService

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ================= Database & Status Endpoints =================

@app.route('/api/db-status', methods=['GET'])
def get_db_status():
    """Return database connection status and operational mode."""
    return jsonify(db_manager.get_status())

@app.route('/api/db-connect', methods=['POST'])
def test_and_connect_mysql():
    """Attempt connecting to MySQL with user-provided credentials."""
    data = request.json or {}
    host = data.get('host', 'localhost')
    port = int(data.get('port', 3306))
    user = data.get('user', 'root')
    password = data.get('password', '')
    database = data.get('database', 'fuel_db')

    success, msg = db_manager.test_mysql_connection(host, port, user, password, database)
    if success:
        db_manager.mysql_config.update({
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'database': database
        })
        db_manager.active_engine = 'mysql'
        db_manager.mysql_connected = True
        db_manager.connection_error = None
        db_manager._init_mysql_schema()
        return jsonify({
            "success": True,
            "message": f"Successfully connected to MySQL database '{database}' on {host}:{port}",
            "status": db_manager.get_status()
        })
    else:
        return jsonify({
            "success": False,
            "message": f"Failed to connect to MySQL: {msg}",
            "status": db_manager.get_status()
        }), 400

@app.route('/api/db-reset-demo', methods=['POST'])
def reset_demo_data():
    """Reset the database to clean realistic sample data."""
    try:
        db_manager.reset_to_sample_data()
        return jsonify({
            "success": True,
            "message": "Database successfully reset to demonstration sample data (5 vehicles, realistic logs, test invalid readings)."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ================= Vehicle CRUD Endpoints =================

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Retrieve all vehicles with aggregated stats."""
    vehicles = db_manager.query("SELECT * FROM vehicles ORDER BY vehicle_id ASC")
    
    # Calculate vehicle record counts and latest odometer
    records = db_manager.query("SELECT vehicle_id, odometer_km, fill_date FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC")
    rec_counts = {}
    latest_odo = {}
    for r in records:
        vid = r['vehicle_id']
        rec_counts[vid] = rec_counts.get(vid, 0) + 1
        latest_odo[vid] = r['odometer_km']

    result = []
    for v in vehicles:
        vid = v['vehicle_id']
        result.append({
            "vehicle_id": vid,
            "vehicle_code": v['vehicle_code'],
            "vehicle_type": v['vehicle_type'],
            "fuel_type": v['fuel_type'],
            "record_count": rec_counts.get(vid, 0),
            "latest_odometer_km": latest_odo.get(vid, 0.0),
            "created_at": str(v.get('created_at', ''))
        })
    return jsonify(result)

@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    """Create a new vehicle."""
    data = request.json or {}
    vehicle_code = data.get('vehicle_code', '').strip().upper()
    vehicle_type = data.get('vehicle_type', 'Car').strip()
    fuel_type = data.get('fuel_type', 'Petrol').strip()

    if not vehicle_code:
        return jsonify({"error": "Vehicle code / registration identifier is required"}), 400
    
    # Check duplicate code
    existing = db_manager.query("SELECT vehicle_id FROM vehicles WHERE UPPER(vehicle_code) = %s", (vehicle_code,))
    if existing:
        return jsonify({"error": f"Vehicle with code '{vehicle_code}' already exists"}), 400

    new_id = db_manager.execute(
        "INSERT INTO vehicles (vehicle_code, vehicle_type, fuel_type) VALUES (%s, %s, %s)",
        (vehicle_code, vehicle_type, fuel_type)
    )

    return jsonify({
        "message": f"Vehicle '{vehicle_code}' added successfully",
        "vehicle_id": new_id,
        "vehicle_code": vehicle_code,
        "vehicle_type": vehicle_type,
        "fuel_type": fuel_type
    }), 201

@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    """Get single vehicle details."""
    vehicles = db_manager.query("SELECT * FROM vehicles WHERE vehicle_id = %s", (vehicle_id,))
    if not vehicles:
        return jsonify({"error": "Vehicle not found"}), 404
    return jsonify(vehicles[0])

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    """Update vehicle details."""
    vehicles = db_manager.query("SELECT * FROM vehicles WHERE vehicle_id = %s", (vehicle_id,))
    if not vehicles:
        return jsonify({"error": "Vehicle not found"}), 404

    data = request.json or {}
    vehicle_code = data.get('vehicle_code', '').strip().upper()
    vehicle_type = data.get('vehicle_type', 'Car').strip()
    fuel_type = data.get('fuel_type', 'Petrol').strip()

    if not vehicle_code:
        return jsonify({"error": "Vehicle code is required"}), 400

    # Ensure uniqueness except current vehicle
    existing = db_manager.query("SELECT vehicle_id FROM vehicles WHERE UPPER(vehicle_code) = %s AND vehicle_id != %s", (vehicle_code, vehicle_id))
    if existing:
        return jsonify({"error": f"Another vehicle with code '{vehicle_code}' already exists"}), 400

    db_manager.execute(
        "UPDATE vehicles SET vehicle_code = %s, vehicle_type = %s, fuel_type = %s WHERE vehicle_id = %s",
        (vehicle_code, vehicle_type, fuel_type, vehicle_id)
    )

    return jsonify({"message": f"Vehicle #{vehicle_id} updated successfully"})

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    """Delete a vehicle and cascade delete its fuel records."""
    vehicles = db_manager.query("SELECT * FROM vehicles WHERE vehicle_id = %s", (vehicle_id,))
    if not vehicles:
        return jsonify({"error": "Vehicle not found"}), 404

    db_manager.execute("DELETE FROM vehicles WHERE vehicle_id = %s", (vehicle_id,))
    return jsonify({"message": f"Vehicle #{vehicle_id} and associated fuel records deleted successfully"})

# ================= Fuel Records CRUD Endpoints =================

@app.route('/api/fuel-records', methods=['GET'])
def get_fuel_records():
    """
    Retrieve fuel records, processed through the MileageEngine with
    interval mileage, distance, and validation flags.
    """
    vehicles = db_manager.query("SELECT * FROM vehicles")
    records = db_manager.query("SELECT * FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC, record_id ASC")

    vehicles_dict = {v['vehicle_id']: v for v in vehicles}
    engine_result = MileageEngine.process_records(records, vehicles_dict)

    # Optional query param filters
    vehicle_id_param = request.args.get('vehicle_id')
    status_param = request.args.get('status') # 'valid', 'invalid', 'all'
    
    result_records = engine_result['records']
    if vehicle_id_param:
        result_records = [r for r in result_records if r['vehicle_id'] == int(vehicle_id_param)]
    if status_param == 'valid':
        result_records = [r for r in result_records if r['is_valid']]
    elif status_param == 'invalid':
        result_records = [r for r in result_records if not r['is_valid']]

    # Sort descending by fill_date, record_id for display table
    result_records = sorted(result_records, key=lambda x: (x.get('fill_date') or '', x.get('record_id') or 0), reverse=True)

    return jsonify({
        "records": result_records,
        "total_records": len(result_records),
        "total_valid": engine_result['total_valid_records'],
        "total_invalid": engine_result['total_invalid_records']
    })

@app.route('/api/fuel-records', methods=['POST'])
def create_fuel_record():
    """
    Create a new fuel record with validation.
    Note: Never silently delete or reject invalid records from being logged;
    if a chronological violation occurs, it is stored and flagged for review.
    Hard schema checks (non-empty vehicle, non-empty date, parseable numbers) are enforced.
    """
    data = request.json or {}
    
    try:
        vehicle_id = int(data.get('vehicle_id'))
    except (TypeError, ValueError):
        return jsonify({"error": "Valid vehicle ID is required"}), 400

    fill_date = data.get('fill_date', '').strip()
    if not fill_date:
        return jsonify({"error": "Fill date is required (YYYY-MM-DD)"}), 400

    try:
        odometer_km = float(data.get('odometer_km'))
        litres = float(data.get('litres'))
        total_cost = float(data.get('total_cost'))
    except (TypeError, ValueError):
        return jsonify({"error": "Odometer, litres, and total cost must be valid numerical values"}), 400

    if litres <= 0:
        return jsonify({"error": "Fuel quantity must be strictly greater than 0 litres"}), 400
    if total_cost < 0:
        return jsonify({"error": "Total fuel cost cannot be negative"}), 400
    if odometer_km < 0:
        return jsonify({"error": "Odometer reading cannot be negative"}), 400

    full_tank_flag = bool(data.get('full_tank_flag', True))
    notes = data.get('notes', '').strip()

    # Verify vehicle exists
    v = db_manager.query("SELECT vehicle_id, vehicle_code FROM vehicles WHERE vehicle_id = %s", (vehicle_id,))
    if not v:
        return jsonify({"error": "Selected vehicle does not exist"}), 404

    # Save to database
    new_id = db_manager.execute("""
        INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (vehicle_id, fill_date, odometer_km, litres, total_cost, 1 if full_tank_flag else 0, notes))

    # Evaluate new record's validity in the sequence
    records = db_manager.query("SELECT * FROM fuel_records WHERE vehicle_id = %s ORDER BY fill_date ASC, odometer_km ASC, record_id ASC", (vehicle_id,))
    engine_result = MileageEngine.process_records(records)
    current_rec = next((r for r in engine_result['records'] if r['record_id'] == new_id), None)

    warning = None
    if current_rec and not current_rec['is_valid']:
        warning = f"Record saved, but flagged with issue: {current_rec['issue_description']}. Recommended: {current_rec['recommended_correction']}"

    return jsonify({
        "message": "Fuel record saved successfully",
        "record_id": new_id,
        "is_valid": current_rec['is_valid'] if current_rec else True,
        "warning": warning
    }), 201

@app.route('/api/fuel-records/<int:record_id>', methods=['GET'])
def get_fuel_record(record_id):
    """Get single fuel record."""
    recs = db_manager.query("SELECT * FROM fuel_records WHERE record_id = %s", (record_id,))
    if not recs:
        return jsonify({"error": "Fuel record not found"}), 404
    return jsonify(recs[0])

@app.route('/api/fuel-records/<int:record_id>', methods=['PUT'])
def update_fuel_record(record_id):
    """Update an existing fuel record."""
    recs = db_manager.query("SELECT * FROM fuel_records WHERE record_id = %s", (record_id,))
    if not recs:
        return jsonify({"error": "Fuel record not found"}), 404

    data = request.json or {}
    try:
        vehicle_id = int(data.get('vehicle_id'))
        odometer_km = float(data.get('odometer_km'))
        litres = float(data.get('litres'))
        total_cost = float(data.get('total_cost'))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid numerical values provided"}), 400

    fill_date = data.get('fill_date', '').strip()
    if not fill_date:
        return jsonify({"error": "Fill date is required"}), 400
    if litres <= 0:
        return jsonify({"error": "Fuel quantity must be strictly greater than 0 litres"}), 400
    if total_cost < 0:
        return jsonify({"error": "Total fuel cost cannot be negative"}), 400
    if odometer_km < 0:
        return jsonify({"error": "Odometer reading cannot be negative"}), 400

    full_tank_flag = bool(data.get('full_tank_flag', True))
    notes = data.get('notes', '').strip()

    db_manager.execute("""
        UPDATE fuel_records
        SET vehicle_id = %s, fill_date = %s, odometer_km = %s, litres = %s, total_cost = %s, full_tank_flag = %s, notes = %s
        WHERE record_id = %s
    """, (vehicle_id, fill_date, odometer_km, litres, total_cost, 1 if full_tank_flag else 0, notes, record_id))

    return jsonify({"message": f"Fuel record #{record_id} updated successfully"})

@app.route('/api/fuel-records/<int:record_id>', methods=['DELETE'])
def delete_fuel_record(record_id):
    """Delete a fuel record."""
    recs = db_manager.query("SELECT * FROM fuel_records WHERE record_id = %s", (record_id,))
    if not recs:
        return jsonify({"error": "Fuel record not found"}), 404

    db_manager.execute("DELETE FROM fuel_records WHERE record_id = %s", (record_id,))
    return jsonify({"message": f"Fuel record #{record_id} deleted successfully"})

# ================= Analytics & Dashboard Endpoints =================

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """Retrieve full dashboard KPIs, filters, and chart trends."""
    vehicles = db_manager.query("SELECT * FROM vehicles")
    records = db_manager.query("SELECT * FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC")

    filters = {
        'vehicle_id': request.args.get('vehicle_id'),
        'fuel_type': request.args.get('fuel_type'),
        'month': request.args.get('month'),
        'year': request.args.get('year')
    }

    data = AnalyticsService.get_dashboard_data(records, vehicles, filters)
    return jsonify(data)

@app.route('/api/invalid-readings', methods=['GET'])
def get_invalid_readings():
    """Retrieve all flagged invalid records with issues and recommended corrections."""
    vehicles = db_manager.query("SELECT * FROM vehicles")
    records = db_manager.query("SELECT * FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC")

    vehicles_dict = {v['vehicle_id']: v for v in vehicles}
    engine_result = MileageEngine.process_records(records, vehicles_dict)

    return jsonify({
        "invalid_records": engine_result['invalid_records'],
        "count": len(engine_result['invalid_records'])
    })

@app.route('/api/analytics/reports', methods=['GET'])
def get_reports():
    """Retrieve comprehensive report data for the Reports page."""
    vehicles = db_manager.query("SELECT * FROM vehicles")
    records = db_manager.query("SELECT * FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC")

    reports = AnalyticsService.generate_reports(records, vehicles)
    return jsonify(reports)

# ================= CSV Export Endpoint =================

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    """Export tabular reports or fuel logs to CSV format."""
    report_type = request.args.get('type', 'vehicle_mileage')
    vehicles = db_manager.query("SELECT * FROM vehicles")
    records = db_manager.query("SELECT * FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC")

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == 'fuel_records':
        vehicles_dict = {v['vehicle_id']: v for v in vehicles}
        engine_res = MileageEngine.process_records(records, vehicles_dict)
        writer.writerow([
            'Record ID', 'Vehicle Code', 'Vehicle Type', 'Fuel Type', 'Fill Date',
            'Odometer (km)', 'Distance (km)', 'Litres', 'Total Cost (INR)',
            'Full Tank', 'Valid Mileage (km/L)', 'Cost per KM (INR)', 'Status', 'Notes'
        ])
        for r in engine_res['records']:
            writer.writerow([
                r['record_id'],
                r.get('vehicle_code', ''),
                r.get('vehicle_type', ''),
                r.get('fuel_type', ''),
                r.get('fill_date', ''),
                r.get('odometer_km', ''),
                r.get('distance_km', ''),
                r.get('litres', ''),
                r.get('total_cost', ''),
                'Yes' if r.get('full_tank_flag') else 'No',
                r.get('mileage_km_per_l', '') or r.get('approx_km_per_l', 'N/A'),
                r.get('cost_per_km', 'N/A'),
                'Valid' if r.get('is_valid') else f"Invalid ({r.get('issue_description')})",
                r.get('notes', '')
            ])
        filename = f"fuel_records_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif report_type == 'vehicle_mileage' or report_type == 'vehicle_comparison':
        reports = AnalyticsService.generate_reports(records, vehicles)
        writer.writerow([
            'Vehicle Code', 'Vehicle Type', 'Fuel Type', 'Total Records', 'Valid Intervals',
            'Total Distance (km)', 'Total Fuel (L)', 'Total Expense (INR)',
            'Average Mileage (km/L)', 'Average Cost/KM (INR)', 'Data Status'
        ])
        for r in reports['vehicle_mileage_report']:
            writer.writerow([
                r['vehicle_code'], r['vehicle_type'], r['fuel_type'], r['total_records'],
                r['valid_intervals'], r['total_distance_km'], r['total_fuel_litres'],
                r['total_cost_inr'], r['average_mileage'], r['cost_per_km'], r['status']
            ])
        filename = f"vehicle_mileage_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif report_type == 'monthly_consumption':
        reports = AnalyticsService.generate_reports(records, vehicles)
        writer.writerow([
            'Month', 'Fills Count', 'Total Litres (L)', 'Total Cost (INR)',
            'Total Distance (km)', 'Avg Cost/Litre (INR)', 'Avg Cost/KM (INR)'
        ])
        for r in reports['monthly_consumption_report']:
            writer.writerow([
                r['month'], r['fills_count'], r['total_litres'], r['total_cost_inr'],
                r['total_distance_km'], r['average_cost_per_litre'], r['average_fuel_cost_per_km']
            ])
        filename = f"monthly_consumption_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif report_type == 'invalid_readings':
        reports = AnalyticsService.generate_reports(records, vehicles)
        writer.writerow([
            'Record ID', 'Vehicle ID', 'Vehicle Code', 'Fill Date', 'Odometer (km)',
            'Litres', 'Total Cost (INR)', 'Issue Description', 'Recommended Correction'
        ])
        for r in reports['invalid_reading_report']:
            writer.writerow([
                r['record_id'], r['vehicle_id'], r['vehicle_code'], r['fill_date'],
                r['odometer_km'], r['litres'], r['total_cost'], r['issue_description'],
                r['recommended_correction']
            ])
        filename = f"invalid_readings_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    else:
        return jsonify({"error": "Unknown report type"}), 400

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ================= Matplotlib Chart Image Endpoint =================

@app.route('/api/charts/monthly-expense.png', methods=['GET'])
def generate_monthly_chart_image():
    """Generate a Matplotlib visual chart of monthly expenditure."""
    vehicles = db_manager.query("SELECT * FROM vehicles")
    records = db_manager.query("SELECT * FROM fuel_records ORDER BY fill_date ASC, odometer_km ASC")
    data = AnalyticsService.get_dashboard_data(records, vehicles)
    
    monthly = data['monthly_expenditure']
    if not monthly:
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.text(0.5, 0.5, 'No Data Available', horizontalalignment='center', verticalalignment='center')
    else:
        months = [m['month'] for m in monthly]
        expenses = [m['expenditure'] for m in monthly]
        
        fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
        bars = ax.bar(months, expenses, color='#0d9488', width=0.55, edgecolor='#0f766e', linewidth=1.2)
        ax.set_title('Monthly Fuel Expenditure (₹)', fontsize=14, fontweight='bold', pad=15, color='#0f172a')
        ax.set_ylabel('Total Cost (₹)', fontsize=11, color='#334155')
        ax.set_xlabel('Month', fontsize=11, color='#334155')
        ax.grid(axis='y', linestyle='--', alpha=0.4)
        
        # Add value labels
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'₹{height:,.0f}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 4),  # 4 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=9, fontweight='semibold', color='#0f172a')

        plt.tight_layout()

    img_io = io.BytesIO()
    plt.savefig(img_io, format='png', bbox_inches='tight')
    plt.close(fig)
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Fuel Consumption Analysis System backend running on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
