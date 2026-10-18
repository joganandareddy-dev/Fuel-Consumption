# Fuel Consumption Analysis System

A modern, responsive full-stack vehicle fuel management and telemetry analysis application built with **React**, **TypeScript**, **Tailwind CSS**, **Python Flask**, **Pandas**, **NumPy**, and **MySQL 8.0+** (with automated **SQLite Demonstration Fallback**).

---

## 🌟 Key Features

1. **Fleet Dashboard**:
   - Real-time KPIs: Total Registered Vehicles, Total Fuel Consumed (L), Total Expenditure (₹), Average Valid Mileage (km/L), and Average Fuel Cost per Kilometre (₹/km).
   - Interactive Filters: Vehicle, Month, Year, and Fuel Type.
   - Dynamic Charts:
     - **Monthly Fuel Expenditure Bar Chart** (₹ vs Billing Month).
     - **Monthly Mileage Trend Line Chart** (Verified Full-Tank km/L).
     - **Vehicle-wise Fuel Efficiency Comparison Bars** (Comparative Fleet Benchmark).
   - Recent Fuel Logs table with live interval statuses.

2. **Vehicle Fleet Management**:
   - Full CRUD (Create, Read, Update, Delete) for fleet vehicles.
   - Fields: Vehicle ID, Registration Code, Vehicle Type (`Car`, `Bike`, `Truck`, `Bus`, `Other`), Propulsion Fuel (`Petrol`, `Diesel`, `CNG`, `Electric`, `Other`).
   - Searchable, filterable fleet table with badge indicators.

3. **Fuel Record & Odometer Logging**:
   - Logging of Fill Date, Odometer Reading (km), Fuel Litres (L), Total Cost (₹), Full Tank Checkbox (100% capacity cut-off vs Partial Refill), and Notes.
   - Automatic chronological validation, distance interval calculation, and full-tank cycle compilation.
   - In-table badges distinguishing complete full-tank cycles from approximate partial refills.

4. **Rigorous Mileage & Telemetry Engine (Pandas & NumPy)**:
   - **Distance Travelled**: $\text{ODO}_{\text{current}} - \text{ODO}_{\text{previous}}$
   - **Verified Mileage**: $\text{Total Distance in Cycle} \div \text{Total Litres in Cycle}$
   - **Partial Refill Transparency**: Distance per partial fill is strictly tagged as *approximate (~km/L\*)*. True mileage is calculated only when topped up to 100% full capacity.
   - **No Fabricated Data**: Displays *"Insufficient data"* when full-tank conditions are not yet met.

5. **Data Quality & Zero-Data-Loss Invalid Readings Audit**:
   - Never silently deletes invalid records.
   - Detects chronological odometer rollbacks, duplicate odometer readings, and negative inputs.
   - Dedicated **Invalid Readings** page detailing the Record ID, Vehicle, Detected Anomaly, Date, and Recommended Correction, with direct inline resolution.

6. **Comprehensive Reports & Export Center**:
   - **Vehicle-wise Mileage Report**
   - **Fuel Expense Summary** (by Fuel Type and Vehicle Classification)
   - **Monthly Consumption Report**
   - **Vehicle Comparison Report**
   - **Invalid-Reading Audit Report**
   - Direct **CSV Export** for all reports.
   - **Print-friendly layout** (`@media print` styling + Print button).

7. **Database Architecture (MySQL 8.0+ with Seamless Demonstration Fallback)**:
   - Production relational schema in `backend/schema.sql` with foreign keys, checks, indexes, and sample seeds.
   - Backend auto-detects MySQL. If MySQL is not running or unconfigured, it automatically loads a local SQLite database preloaded with 5 vehicles, multi-month fuel logs, and test invalid readings.
   - Real-time connection testing from the in-app **Settings & MySQL** screen.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+)
- *(Optional)* **MySQL Server 8.0+**

---

### Step 1: Start the Flask Backend

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start the Flask server (runs on port 5000)
python app.py
```

*Note: The backend will automatically initialize the local demonstration SQLite database if MySQL credentials are not supplied, so you can test all features right out of the box!*

---

### Step 2: Start the React Frontend

In a separate terminal:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Launch Vite development server
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173/`**

---

## 🗄️ MySQL Database Setup (Optional)

To connect the application to a live MySQL server:

1. **Create the Database and Tables using the included script**:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```

2. **Configure Credentials**:
   Either configure environment variables:
   ```powershell
   # Windows PowerShell
   $env:MYSQL_HOST="localhost"
   $env:MYSQL_PORT="3306"
   $env:MYSQL_USER="root"
   $env:MYSQL_PASSWORD="your_password"
   $env:MYSQL_DB="fuel_db"
   ```
   *OR* simply open the **Settings & MySQL** tab in the web application and enter your host, user, and password to test and switch dynamically.

---

## 📂 Project Architecture

```
fuel project/
├── backend/
│   ├── app.py                   # Flask REST API endpoints & CORS configuration
│   ├── config.py                # Environment configuration & DB paths
│   ├── database.py              # MySQL manager with automated SQLite fallback
│   ├── schema.sql               # MySQL DDL schema with tables, constraints, indexes & seeds
│   ├── sample_data.py           # Demonstration dataset (5 vehicles, multi-month logs)
│   ├── requirements.txt         # Flask, flask-cors, pandas, numpy, pymysql, matplotlib
│   └── services/
│       ├── mileage_engine.py    # Chronological validation & full-tank interval calculation
│       └── analytics_service.py # Pandas & NumPy aggregations and report generators
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # Dark navy sidebar with badge indicators
│   │   │   ├── Header.tsx       # Header with live DB status pill & action shortcuts
│   │   │   ├── StatCard.tsx     # KPI metrics card with gradients
│   │   │   ├── Charts.tsx       # SVG interactive bar, line, and comparison charts
│   │   │   ├── Modal.tsx        # Accessible dialog component
│   │   │   └── Toast.tsx        # Notification toast alerts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Main analytics dashboard with interactive filters
│   │   │   ├── Vehicles.tsx     # Fleet vehicle CRUD and search table
│   │   │   ├── FuelRecords.tsx  # Fuel purchase logs, partial refills, and validations
│   │   │   ├── MileageAnalysis.tsx # Cycle-by-cycle interval progression deep-dive
│   │   │   ├── Reports.tsx      # Tabular reports, CSV exports, and print view
│   │   │   ├── InvalidReadings.tsx # Quarantined anomaly register with correction guide
│   │   │   └── Settings.tsx     # MySQL credentials tester and setup instructions
│   │   ├── services/
│   │   │   └── api.ts           # REST API client
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── App.tsx              # Root coordinator & navigation state
│   │   └── index.css            # Tailwind directives & print media styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## 🧪 Demonstration Sample Fleet

The preloaded sample dataset contains 5 realistic vehicles:
1. `KA-01-MJ-5050` (Car, Petrol) - Sedan with city commute and highway cycles
2. `MH-12-PQ-9021` (Car, Diesel) - Long-distance highway runner (~19.2 km/L)
3. `DL-03-CB-1122` (Bike, Petrol) - High-efficiency commuter (~37.2 km/L)
4. `HR-55-TR-7840` (Truck, Diesel) - Heavy freight logistics hauler (~4.5 km/L)
5. `TS-09-EV-3003` (Car, CNG) - Commercial urban taxi (~24.5 km/kg)

**Test Invalid Records**:
- **Record #28**: Decreasing odometer reading (`17,200 km` entered after `17,660 km`).
- **Record #29**: Duplicate odometer reading on consecutive date without distance progress.
Both are quarantined in the **Invalid Readings** page with recommendations to demonstrate zero-data-loss validation.
