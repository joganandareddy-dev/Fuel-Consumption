"""
Analytics Service using Pandas and NumPy.
Generates vehicle-wise summaries, monthly expenditure & consumption trends,
mileage comparisons, and report aggregations with safe numerical operations.
"""

import pandas as pd
import numpy as np
from services.mileage_engine import MileageEngine

class AnalyticsService:
    @staticmethod
    def get_dashboard_data(fuel_records, vehicles, filters=None):
        """
        Aggregate dashboard KPIs and chart datasets based on processed records
        and optional filters (vehicle_id, month, year, fuel_type).
        """
        vehicles_dict = {v['vehicle_id']: v for v in vehicles}
        engine_result = MileageEngine.process_records(fuel_records, vehicles_dict)
        all_records = engine_result['records']

        if not all_records:
            return {
                "total_vehicles": len(vehicles),
                "total_litres": 0.0,
                "total_expenditure": 0.0,
                "average_mileage": None,
                "average_cost_per_km": None,
                "total_valid_distance": 0.0,
                "monthly_expenditure": [],
                "monthly_mileage_trends": [],
                "vehicle_efficiency_comparison": [],
                "recent_records": [],
                "invalid_count": 0
            }

        df = pd.DataFrame(all_records)
        
        # Apply filters if provided
        if filters:
            if filters.get('vehicle_id'):
                df = df[df['vehicle_id'] == int(filters['vehicle_id'])]
            if filters.get('fuel_type') and filters.get('fuel_type') != 'All':
                df = df[df['fuel_type'] == filters['fuel_type']]
            if filters.get('year') and filters.get('year') != 'All':
                df = df[df['fill_date'].str.startswith(str(filters['year']))]
            if filters.get('month') and filters.get('month') != 'All':
                target_month = f"{filters.get('year', '2026')}-{str(filters['month']).zfill(2)}" if filters.get('year') and filters.get('year') != 'All' else f"-{str(filters['month']).zfill(2)}-"
                df = df[df['fill_date'].str.contains(target_month)]

        # Valid vs invalid split
        valid_df = df[df['is_valid'] == True] if not df.empty else pd.DataFrame()
        invalid_count = len(df[df['is_valid'] == False]) if not df.empty else 0

        # High-level KPIs using NumPy for safe handling
        total_litres = float(np.round(valid_df['litres'].sum(), 2)) if not valid_df.empty else 0.0
        total_expenditure = float(np.round(valid_df['total_cost'].sum(), 2)) if not valid_df.empty else 0.0
        total_valid_dist = float(np.round(valid_df['distance_km'].fillna(0).sum(), 2)) if not valid_df.empty else 0.0

        # Calculate average valid mileage across completed full-tank intervals
        completed_intervals = valid_df[valid_df['is_valid_interval'] == True] if not valid_df.empty else pd.DataFrame()
        if not completed_intervals.empty and completed_intervals['distance_km'].sum() > 0:
            avg_mileage = float(np.round(completed_intervals['distance_km'].sum() / completed_intervals['litres'].sum(), 2))
            avg_cost_km = float(np.round(completed_intervals['total_cost'].sum() / completed_intervals['distance_km'].sum(), 2))
        else:
            avg_mileage = None
            avg_cost_km = None

        # 1. Monthly Expenditure (bar chart data)
        monthly_expenditure = []
        if not valid_df.empty:
            valid_df['month_key'] = valid_df['fill_date'].str.slice(0, 7) # YYYY-MM
            month_grp = valid_df.groupby('month_key').agg(
                total_cost=('total_cost', 'sum'),
                total_litres=('litres', 'sum'),
                records_count=('record_id', 'count')
            ).reset_index().sort_values('month_key')

            for _, row in month_grp.iterrows():
                monthly_expenditure.append({
                    "month": row['month_key'],
                    "expenditure": round(float(row['total_cost']), 2),
                    "litres": round(float(row['total_litres']), 2),
                    "count": int(row['records_count'])
                })

        # 2. Monthly Mileage Trend (line chart data)
        monthly_mileage_trends = []
        if not completed_intervals.empty:
            completed_intervals['month_key'] = completed_intervals['fill_date'].str.slice(0, 7)
            mileage_grp = completed_intervals.groupby('month_key').agg(
                interval_distance=('distance_km', 'sum'),
                interval_litres=('litres', 'sum')
            ).reset_index().sort_values('month_key')

            for _, row in mileage_grp.iterrows():
                dist = float(row['interval_distance'])
                lits = float(row['interval_litres'])
                m = round(dist / lits, 2) if lits > 0 else None
                monthly_mileage_trends.append({
                    "month": row['month_key'],
                    "average_mileage": m,
                    "distance_km": round(dist, 1)
                })

        # 3. Vehicle-wise Fuel Efficiency Comparison (comparison chart)
        vehicle_efficiency_comparison = []
        for v in vehicles:
            v_id = v['vehicle_id']
            v_df = valid_df[valid_df['vehicle_id'] == v_id] if not valid_df.empty else pd.DataFrame()
            v_intervals = v_df[v_df['is_valid_interval'] == True] if not v_df.empty else pd.DataFrame()
            
            if not v_intervals.empty and v_intervals['litres'].sum() > 0:
                dist = float(v_intervals['distance_km'].sum())
                lits = float(v_intervals['litres'].sum())
                eff = round(dist / lits, 2) if lits > 0 else None
                cost_km = round(float(v_intervals['total_cost'].sum()) / dist, 2) if dist > 0 else None
                status = "Reliable"
            else:
                eff = None
                cost_km = None
                status = "Insufficient data"

            vehicle_efficiency_comparison.append({
                "vehicle_id": v_id,
                "vehicle_code": v['vehicle_code'],
                "vehicle_type": v['vehicle_type'],
                "fuel_type": v['fuel_type'],
                "average_mileage": eff,
                "cost_per_km": cost_km,
                "status": status,
                "total_fuel_litres": round(float(v_df['litres'].sum()), 2) if not v_df.empty else 0.0,
                "total_spend": round(float(v_df['total_cost'].sum()), 2) if not v_df.empty else 0.0
            })

        # Recent records (latest 8)
        recent_records = df.sort_values(by=['fill_date', 'record_id'], ascending=[False, False]).head(8).to_dict(orient='records')
        # Clean NaNs in recent_records for JSON serialization
        for r in recent_records:
            for k, val in r.items():
                if pd.isna(val):
                    r[k] = None

        return {
            "total_vehicles": len(vehicles),
            "total_litres": total_litres,
            "total_expenditure": total_expenditure,
            "average_mileage": avg_mileage,
            "average_cost_per_km": avg_cost_km,
            "total_valid_distance": total_valid_dist,
            "monthly_expenditure": monthly_expenditure,
            "monthly_mileage_trends": monthly_mileage_trends,
            "vehicle_efficiency_comparison": vehicle_efficiency_comparison,
            "recent_records": recent_records,
            "invalid_count": invalid_count,
            "all_records_count": len(df)
        }

    @staticmethod
    def generate_reports(fuel_records, vehicles):
        """
        Generate tabular reports:
        1. Vehicle-wise Mileage Report
        2. Fuel Expense Summary
        3. Monthly Consumption Report
        4. Vehicle Comparison Report
        5. Invalid-Reading Report
        """
        vehicles_dict = {v['vehicle_id']: v for v in vehicles}
        engine_result = MileageEngine.process_records(fuel_records, vehicles_dict)
        all_records = engine_result['records']
        invalid_records = engine_result['invalid_records']

        df = pd.DataFrame(all_records) if all_records else pd.DataFrame()
        valid_df = df[df['is_valid'] == True] if not df.empty else pd.DataFrame()

        # Report 1: Vehicle-wise Mileage Report
        vehicle_mileage_report = []
        for v in vehicles:
            v_id = v['vehicle_id']
            v_records = valid_df[valid_df['vehicle_id'] == v_id] if not valid_df.empty else pd.DataFrame()
            v_intervals = v_records[v_records['is_valid_interval'] == True] if not v_records.empty else pd.DataFrame()

            total_litres = round(float(v_records['litres'].sum()), 2) if not v_records.empty else 0.0
            total_cost = round(float(v_records['total_cost'].sum()), 2) if not v_records.empty else 0.0
            total_dist = round(float(v_records['distance_km'].fillna(0).sum()), 2) if not v_records.empty else 0.0
            
            if not v_intervals.empty and v_intervals['litres'].sum() > 0:
                int_dist = float(v_intervals['distance_km'].sum())
                int_lits = float(v_intervals['litres'].sum())
                int_cost = float(v_intervals['total_cost'].sum())
                avg_mileage = round(int_dist / int_lits, 2)
                avg_cost_km = round(int_cost / int_dist, 2) if int_dist > 0 else None
                status = "Active"
                intervals_count = len(v_intervals)
            else:
                avg_mileage = "Insufficient data"
                avg_cost_km = "Insufficient data"
                status = "Needs full-tank data"
                intervals_count = 0

            vehicle_mileage_report.append({
                "vehicle_id": v_id,
                "vehicle_code": v['vehicle_code'],
                "vehicle_type": v['vehicle_type'],
                "fuel_type": v['fuel_type'],
                "total_records": len(v_records),
                "valid_intervals": intervals_count,
                "total_distance_km": total_dist,
                "total_fuel_litres": total_litres,
                "total_cost_inr": total_cost,
                "average_mileage": avg_mileage,
                "cost_per_km": avg_cost_km,
                "status": status
            })

        # Report 2: Fuel Expense Summary
        fuel_expense_summary = {
            "overall_total_expense": round(float(valid_df['total_cost'].sum()), 2) if not valid_df.empty else 0.0,
            "overall_total_litres": round(float(valid_df['litres'].sum()), 2) if not valid_df.empty else 0.0,
            "by_fuel_type": [],
            "by_vehicle_type": []
        }
        if not valid_df.empty:
            # By Fuel Type
            f_grp = valid_df.groupby('fuel_type').agg(
                total_cost=('total_cost', 'sum'),
                total_litres=('litres', 'sum'),
                record_count=('record_id', 'count')
            ).reset_index()
            for _, r in f_grp.iterrows():
                lits = float(r['total_litres'])
                cost = float(r['total_cost'])
                fuel_expense_summary['by_fuel_type'].append({
                    "fuel_type": r['fuel_type'],
                    "total_cost": round(cost, 2),
                    "total_litres": round(lits, 2),
                    "avg_price_per_litre": round(cost / lits, 2) if lits > 0 else 0,
                    "record_count": int(r['record_count'])
                })

            # By Vehicle Type
            v_grp = valid_df.groupby('vehicle_type').agg(
                total_cost=('total_cost', 'sum'),
                total_litres=('litres', 'sum'),
                record_count=('record_id', 'count')
            ).reset_index()
            for _, r in v_grp.iterrows():
                fuel_expense_summary['by_vehicle_type'].append({
                    "vehicle_type": r['vehicle_type'],
                    "total_cost": round(float(r['total_cost']), 2),
                    "total_litres": round(float(r['total_litres']), 2),
                    "record_count": int(r['record_count'])
                })

        # Report 3: Monthly Consumption Report
        monthly_consumption_report = []
        if not valid_df.empty:
            valid_df['month_key'] = valid_df['fill_date'].str.slice(0, 7)
            m_grp = valid_df.groupby('month_key').agg(
                total_litres=('litres', 'sum'),
                total_cost=('total_cost', 'sum'),
                total_dist=('distance_km', 'sum'),
                fills_count=('record_id', 'count')
            ).reset_index().sort_values('month_key', ascending=False)

            for _, r in m_grp.iterrows():
                dist = float(r['total_dist'])
                lits = float(r['total_litres'])
                cost = float(r['total_cost'])
                monthly_consumption_report.append({
                    "month": r['month_key'],
                    "fills_count": int(r['fills_count']),
                    "total_litres": round(lits, 2),
                    "total_cost_inr": round(cost, 2),
                    "total_distance_km": round(dist, 1),
                    "average_cost_per_litre": round(cost / lits, 2) if lits > 0 else 0.0,
                    "average_fuel_cost_per_km": round(cost / dist, 2) if dist > 0 else "N/A"
                })

        # Report 4: Vehicle Comparison Report
        vehicle_comparison_report = vehicle_mileage_report

        # Report 5: Invalid-Reading Report
        invalid_reading_report = []
        for inv in invalid_records:
            invalid_reading_report.append({
                "record_id": inv['record_id'],
                "vehicle_id": inv['vehicle_id'],
                "vehicle_code": inv.get('vehicle_code', 'Unknown'),
                "fill_date": inv.get('fill_date', ''),
                "odometer_km": inv.get('odometer_km', 0),
                "litres": inv.get('litres', 0),
                "total_cost": inv.get('total_cost', 0),
                "issue_description": inv.get('issue_description', 'Validation error'),
                "recommended_correction": inv.get('recommended_correction', 'Check entry values')
            })

        return {
            "vehicle_mileage_report": vehicle_mileage_report,
            "fuel_expense_summary": fuel_expense_summary,
            "monthly_consumption_report": monthly_consumption_report,
            "vehicle_comparison_report": vehicle_comparison_report,
            "invalid_reading_report": invalid_reading_report
        }
