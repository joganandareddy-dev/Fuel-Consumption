-- Fuel Consumption Analysis System
-- Database Schema for MySQL 8.0+

CREATE DATABASE IF NOT EXISTS fuel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fuel_db;

-- 1. Vehicles Table
DROP TABLE IF EXISTS fuel_records;
DROP TABLE IF EXISTS vehicles;

CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_code VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type ENUM('Car', 'Bike', 'Truck', 'Bus', 'Other') NOT NULL DEFAULT 'Car',
    fuel_type ENUM('Petrol', 'Diesel', 'CNG', 'Electric', 'Other') NOT NULL DEFAULT 'Petrol',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicle_code (vehicle_code),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_fuel_type (fuel_type)
) ENGINE=InnoDB;

-- 2. Fuel Records Table
CREATE TABLE fuel_records (
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
    CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    CONSTRAINT chk_positive_litres CHECK (litres > 0),
    CONSTRAINT chk_positive_cost CHECK (total_cost >= 0),
    CONSTRAINT chk_non_negative_odo CHECK (odometer_km >= 0),
    INDEX idx_vehicle_date (vehicle_id, fill_date),
    INDEX idx_fill_date (fill_date),
    INDEX idx_odometer (odometer_km)
) ENGINE=InnoDB;

-- =======================================================
-- Sample Data Insertion
-- Includes 5 realistic vehicles and fuel logs across multiple months
-- Note: Includes both full-tank, partial fills, and intentionally invalid records for demonstration
-- =======================================================

INSERT INTO vehicles (vehicle_id, vehicle_code, vehicle_type, fuel_type) VALUES
(1, 'KA-01-MJ-5050', 'Car', 'Petrol'),
(2, 'MH-12-PQ-9021', 'Car', 'Diesel'),
(3, 'DL-03-CB-1122', 'Bike', 'Petrol'),
(4, 'HR-55-TR-7840', 'Truck', 'Diesel'),
(5, 'TS-09-EV-3003', 'Car', 'CNG');

-- Fuel Records for KA-01-MJ-5050 (Car - Petrol)
-- Baseline fill (Full tank): 15,200 km
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(1, '2026-05-02', 15200.00, 40.00, 4080.00, TRUE, 'Initial full tank baseline fill'),
(1, '2026-05-18', 15780.00, 38.50, 3965.50, TRUE, 'City commuting; 580km / 38.5L = 15.06 km/L'),
(1, '2026-06-03', 16040.00, 15.00, 1545.00, FALSE, 'Partial top-up for weekend trip'),
(1, '2026-06-15', 16420.00, 26.80, 2760.40, TRUE, 'Full tank after trip; 640km / 41.8L = 15.31 km/L interval'),
(1, '2026-07-01', 17050.00, 41.20, 4243.60, TRUE, 'Highway drive to Mysore; 630km / 41.2L = 15.29 km/L'),
(1, '2026-07-20', 17660.00, 39.00, 4017.00, TRUE, 'Regular office commute');

-- Fuel Records for MH-12-PQ-9021 (Car - Diesel)
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(2, '2026-05-05', 28100.00, 45.00, 4005.00, TRUE, 'Baseline full tank - Shell pump'),
(2, '2026-05-25', 28950.00, 44.20, 3933.80, TRUE, 'Expressway run; 850km / 44.2L = 19.23 km/L'),
(2, '2026-06-10', 29810.00, 45.50, 4049.50, TRUE, 'Pune-Mumbai round trips; 860km / 45.5L = 18.90 km/L'),
(2, '2026-06-28', 30300.00, 20.00, 1780.00, FALSE, 'Mid-month quick top-up'),
(2, '2026-07-12', 30720.00, 26.50, 2358.50, TRUE, 'Full tank top-up; combined 910km / 46.5L = 19.57 km/L'),
(2, '2026-07-29', 31580.00, 43.80, 3898.20, TRUE, 'Monsoon trip to Lonavala');

-- Fuel Records for DL-03-CB-1122 (Bike - Petrol)
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(3, '2026-05-08', 8400.00, 12.00, 1224.00, TRUE, 'Baseline tank fill'),
(3, '2026-05-22', 8840.00, 11.80, 1203.60, TRUE, 'City ride; 440km / 11.8L = 37.29 km/L'),
(3, '2026-06-08', 9270.00, 11.50, 1184.50, TRUE, 'Smooth traffic mileage; 430km / 11.5L = 37.39 km/L'),
(3, '2026-06-24', 9680.00, 11.20, 1153.60, TRUE, 'Gurgaon office travel; 410km / 11.2L = 36.61 km/L'),
(3, '2026-07-10', 10120.00, 12.10, 1246.30, TRUE, 'Trip to Neemrana; 440km / 12.1L = 36.36 km/L');

-- Fuel Records for HR-55-TR-7840 (Truck - Diesel)
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(4, '2026-05-01', 112000.00, 200.00, 17800.00, TRUE, 'Fleet baseline refuel'),
(4, '2026-05-15', 112950.00, 210.00, 18690.00, TRUE, 'Freight delivery; 950km / 210L = 4.52 km/L'),
(4, '2026-06-01', 113880.00, 205.00, 18245.00, TRUE, 'Inter-state corridor; 930km / 205L = 4.54 km/L'),
(4, '2026-06-20', 114840.00, 212.00, 18868.00, TRUE, 'Industrial goods run; 960km / 212L = 4.53 km/L'),
(4, '2026-07-15', 115790.00, 208.00, 18512.00, TRUE, 'Return logistics; 950km / 208L = 4.57 km/L');

-- Fuel Records for TS-09-EV-3003 (Car - CNG)
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(5, '2026-05-10', 42000.00, 9.50, 807.50, TRUE, 'CNG cylinder full fill at 200 bar'),
(5, '2026-05-24', 42220.00, 9.20, 782.00, TRUE, 'City taxi/rideshare; 220km / 9.2kg = 23.91 km/kg'),
(5, '2026-06-07', 42450.00, 9.40, 799.00, TRUE, 'Airport shuttle run; 230km / 9.4kg = 24.47 km/kg'),
(5, '2026-06-22', 42680.00, 9.10, 773.50, TRUE, 'Secunderabad rounds; 230km / 9.1kg = 25.27 km/kg'),
(5, '2026-07-08', 42910.00, 9.30, 790.50, TRUE, 'Regular city driving; 230km / 9.3kg = 24.73 km/kg');

-- =======================================================
-- Intentionally Invalid Records (for Demonstration of Validation & Invalid Readings Report)
-- =======================================================
-- Invalid Record 1: KA-01-MJ-5050 - Decreasing Odometer reading (odometer typo/rollback: 17200 entered instead of 18200 after 17660)
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(1, '2026-08-05', 17200.00, 38.00, 3914.00, TRUE, '[SAMPLE INVALID] Typo in odometer: 17,200 km entered after 17,660 km (Decreasing Odometer)');

-- Invalid Record 2: DL-03-CB-1122 - Duplicate Odometer reading on consecutive date
INSERT INTO fuel_records (vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag, notes) VALUES
(3, '2026-07-25', 10120.00, 10.50, 1081.50, TRUE, '[SAMPLE INVALID] Duplicate odometer: 10,120 km entered on next date without distance progress');
