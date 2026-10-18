"""
Database Manager for Fuel Consumption Analysis System.
Supports MySQL connection with seamless fallback to SQLite demonstration database.
Never pretends MySQL is connected if it cannot establish a real connection.
"""

import sqlite3
import pymysql
from pymysql.cursors import DictCursor
import os
import socket
from config import Config
from sample_data import SAMPLE_VEHICLES, SAMPLE_FUEL_RECORDS

class DatabaseManager:
    def __init__(self):
        self.mysql_config = {
            'host': Config.MYSQL_HOST,
            'port': Config.MYSQL_PORT,
            'user': Config.MYSQL_USER,
            'password': Config.MYSQL_PASSWORD,
            'database': Config.MYSQL_DB,
            'charset': 'utf8mb4',
            'cursorclass': DictCursor,
            'connect_timeout': 2
        }
        self.active_engine = 'sqlite'
        self.mysql_connected = False
        self.connection_error = None
        self.init_database()

    def test_mysql_connection(self, host=None, port=None, user=None, password=None, database=None):
        """Test a MySQL connection with specific or current parameters."""
        h = host or self.mysql_config['host']
        p = int(port or self.mysql_config['port'])
        u = user or self.mysql_config['user']
        pwd = password if password is not None else self.mysql_config['password']

        # Fast socket probe first (under 0.5s) to check if MySQL port is open
        try:
            target_host = '127.0.0.1' if h == 'localhost' else h
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.8)
            res = sock.connect_ex((target_host, p))
            sock.close()
            if res != 0:
                return False, f"Cannot reach MySQL server at {h}:{p} (Port is closed or server is not running)."
        except Exception as se:
            return False, f"Network probe failed for {h}:{p}: {se}"

        cfg = {
            'host': target_host,
            'port': p,
            'user': u,
            'password': pwd,
            'charset': 'utf8mb4',
            'connect_timeout': 2
        }
        try:
            # First connect to server
            conn = pymysql.connect(**cfg)
            with conn.cursor() as cur:
                target_db = database or self.mysql_config['database']
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{target_db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            conn.close()

            # Now connect to specific db
            cfg['database'] = target_db
            conn = pymysql.connect(**cfg)
            conn.close()
            return True, "Successfully connected to MySQL database."
        except Exception as e:
            return False, str(e)

    def init_database(self):
        """Attempt to initialize MySQL; fall back gracefully to SQLite."""
        success, msg = self.test_mysql_connection()
        if success:
            try:
                self.active_engine = 'mysql'
                self.mysql_connected = True
                self.connection_error = None
                self._init_mysql_schema()
                print(f"[DB] Connected successfully to MySQL database '{self.mysql_config['database']}'")
                return
            except Exception as e:
                self.mysql_connected = False
                self.connection_error = str(e)
                print(f"[DB] MySQL schema init failed: {e}")
        else:
            self.mysql_connected = False
            self.connection_error = msg
            print(f"[DB] MySQL connection not established: {msg}")

        # Fallback to SQLite demonstration mode
        self.active_engine = 'sqlite'
        print(f"[DB] Using local demonstration SQLite database at: {Config.SQLITE_PATH}")
        self._init_sqlite_schema()

    def get_status(self):
        """Return clear database connection details for frontend visibility."""
        return {
            "active_engine": self.active_engine,
            "mysql_connected": self.mysql_connected,
            "is_demo_mode": self.active_engine == 'sqlite',
            "status_message": (
                f"Connected to MySQL database '{self.mysql_config['database']}' on {self.mysql_config['host']}:{self.mysql_config['port']}"
                if self.mysql_connected else
                "Running in Demonstration Mode (SQLite database with realistic sample data). MySQL is not connected."
            ),
            "connection_error": self.connection_error,
            "mysql_config": {
                "host": self.mysql_config['host'],
                "port": self.mysql_config['port'],
                "user": self.mysql_config['user'],
                "database": self.mysql_config['database']
            }
        }

    # ================= MySQL Methods =================
    def _get_mysql_conn(self):
        return pymysql.connect(**self.mysql_config)

    def _init_mysql_schema(self):
        conn = self._get_mysql_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS vehicles (
                        vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
                        vehicle_code VARCHAR(50) NOT NULL UNIQUE,
                        vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Car',
                        fuel_type VARCHAR(50) NOT NULL DEFAULT 'Petrol',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_vehicle_code (vehicle_code)
                    ) ENGINE=InnoDB;
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS fuel_records (
                        record_id INT AUTO_INCREMENT PRIMARY KEY,
                        vehicle_id INT NOT NULL,
                        fill_date DATE NOT NULL,
                        odometer_km DECIMAL(10, 2) NOT NULL,
                        litres DECIMAL(10, 2) NOT NULL,
                        total_cost DECIMAL(10, 2) NOT NULL,
                        full_tank_flag BOOLEAN NOT NULL DEFAULT TRUE,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
                        INDEX idx_vehicle_date (vehicle_id, fill_date),
                        INDEX idx_odometer (odometer_km)
                    ) ENGINE=InnoDB;
                """)
                # Seed if empty
                cur.execute("SELECT COUNT(*) AS cnt FROM vehicles")
                if cur.fetchone()['cnt'] == 0:
                    self._seed_sample_data_mysql(cur)
            conn.commit()
        finally:
            conn.close()

    def _seed_sample_data_mysql(self, cur):
        for v in SAMPLE_VEHICLES:
            cur.execute("""
                INSERT INTO vehicles (vehicle_id, vehicle_code, vehicle_type, fuel_type)
                VALUES (%s, %s, %s, %s)
            """, (v['vehicle_id'], v['vehicle_code'], v['vehicle_type'], v['fuel_type']))
        for r in SAMPLE_FUEL_RECORDS:
            cur.execute("""
                INSERT INTO fuel_records (record_id, vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (r['record_id'], r['vehicle_id'], r['fill_date'], r['odometer_km'], r['litres'], r['total_cost'], r['full_tank_flag'], r['notes']))

    # ================= SQLite Methods =================
    def _get_sqlite_conn(self):
        conn = sqlite3.connect(Config.SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_sqlite_schema(self):
        conn = self._get_sqlite_conn()
        try:
            with conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS vehicles (
                        vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        vehicle_code TEXT NOT NULL UNIQUE,
                        vehicle_type TEXT NOT NULL DEFAULT 'Car',
                        fuel_type TEXT NOT NULL DEFAULT 'Petrol',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS fuel_records (
                        record_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        vehicle_id INTEGER NOT NULL,
                        fill_date TEXT NOT NULL,
                        odometer_km REAL NOT NULL,
                        litres REAL NOT NULL,
                        total_cost REAL NOT NULL,
                        full_tank_flag INTEGER NOT NULL DEFAULT 1,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
                    );
                """)
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM vehicles")
                if cur.fetchone()[0] == 0:
                    self._seed_sample_data_sqlite(conn)
        finally:
            conn.close()

    def _seed_sample_data_sqlite(self, conn):
        for v in SAMPLE_VEHICLES:
            conn.execute("""
                INSERT OR IGNORE INTO vehicles (vehicle_id, vehicle_code, vehicle_type, fuel_type)
                VALUES (?, ?, ?, ?)
            """, (v['vehicle_id'], v['vehicle_code'], v['vehicle_type'], v['fuel_type']))
        for r in SAMPLE_FUEL_RECORDS:
            conn.execute("""
                INSERT OR IGNORE INTO fuel_records (record_id, vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (r['record_id'], r['vehicle_id'], r['fill_date'], r['odometer_km'], r['litres'], r['total_cost'], 1 if r['full_tank_flag'] else 0, r['notes']))

    def reset_to_sample_data(self):
        """Wipe tables and re-populate with fresh sample demo data."""
        if self.active_engine == 'mysql' and self.mysql_connected:
            conn = self._get_mysql_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute("SET FOREIGN_KEY_CHECKS = 0")
                    cur.execute("TRUNCATE TABLE fuel_records")
                    cur.execute("TRUNCATE TABLE vehicles")
                    cur.execute("SET FOREIGN_KEY_CHECKS = 1")
                    self._seed_sample_data_mysql(cur)
                conn.commit()
            finally:
                conn.close()
        else:
            conn = self._get_sqlite_conn()
            try:
                with conn:
                    conn.execute("DELETE FROM fuel_records")
                    conn.execute("DELETE FROM vehicles")
                    self._seed_sample_data_sqlite(conn)
            finally:
                conn.close()

    # ================= Universal Unified Query API =================
    def query(self, sql_query, params=None):
        """Execute a SELECT query and return list of dictionaries."""
        params = params or ()
        if self.active_engine == 'mysql' and self.mysql_connected:
            conn = self._get_mysql_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(sql_query, params)
                    return cur.fetchall()
            finally:
                conn.close()
        else:
            # SQLite query (normalize %s to ? placeholders)
            sqlite_query = sql_query.replace('%s', '?')
            conn = self._get_sqlite_conn()
            try:
                cur = conn.cursor()
                cur.execute(sqlite_query, params)
                rows = cur.fetchall()
                result = []
                for row in rows:
                    d = dict(row)
                    # Convert integer full_tank_flag back to boolean
                    if 'full_tank_flag' in d:
                        d['full_tank_flag'] = bool(d['full_tank_flag'])
                    result.append(d)
                return result
            finally:
                conn.close()

    def execute(self, sql_query, params=None):
        """Execute an INSERT, UPDATE, or DELETE query and return lastrowid / affected rows."""
        params = params or ()
        if self.active_engine == 'mysql' and self.mysql_connected:
            conn = self._get_mysql_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(sql_query, params)
                    last_id = cur.lastrowid
                conn.commit()
                return last_id
            finally:
                conn.close()
        else:
            sqlite_query = sql_query.replace('%s', '?')
            conn = self._get_sqlite_conn()
            try:
                with conn:
                    cur = conn.cursor()
                    cur.execute(sqlite_query, params)
                    return cur.lastrowid
            finally:
                conn.close()

# Singleton DB manager instance
db_manager = DatabaseManager()
