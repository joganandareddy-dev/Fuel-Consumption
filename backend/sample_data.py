"""
Sample demonstration data for Fuel Consumption Analysis System.
Includes realistic vehicle information, full-tank cycles, partial refills,
and intentional invalid records to demonstrate validation checks.
"""

SAMPLE_VEHICLES = [
    {
        "vehicle_id": 1,
        "vehicle_code": "KA-01-MJ-5050",
        "vehicle_type": "Car",
        "fuel_type": "Petrol"
    },
    {
        "vehicle_id": 2,
        "vehicle_code": "MH-12-PQ-9021",
        "vehicle_type": "Car",
        "fuel_type": "Diesel"
    },
    {
        "vehicle_id": 3,
        "vehicle_code": "DL-03-CB-1122",
        "vehicle_type": "Bike",
        "fuel_type": "Petrol"
    },
    {
        "vehicle_id": 4,
        "vehicle_code": "HR-55-TR-7840",
        "vehicle_type": "Truck",
        "fuel_type": "Diesel"
    },
    {
        "vehicle_id": 5,
        "vehicle_code": "TS-09-EV-3003",
        "vehicle_type": "Car",
        "fuel_type": "CNG"
    }
]

SAMPLE_FUEL_RECORDS = [
    # Vehicle 1: KA-01-MJ-5050 (Car - Petrol)
    {
        "record_id": 1,
        "vehicle_id": 1,
        "fill_date": "2026-05-02",
        "odometer_km": 15200.0,
        "litres": 40.0,
        "total_cost": 4080.0,
        "full_tank_flag": True,
        "notes": "Initial full tank baseline fill at Shell pump"
    },
    {
        "record_id": 2,
        "vehicle_id": 1,
        "fill_date": "2026-05-18",
        "odometer_km": 15780.0,
        "litres": 38.5,
        "total_cost": 3965.5,
        "full_tank_flag": True,
        "notes": "City commuting. Full tank interval: 580km / 38.5L = 15.06 km/L"
    },
    {
        "record_id": 3,
        "vehicle_id": 1,
        "fill_date": "2026-06-03",
        "odometer_km": 16040.0,
        "litres": 15.0,
        "total_cost": 1545.0,
        "full_tank_flag": False,
        "notes": "Partial top-up before weekend excursion (tank not filled to auto-cut)"
    },
    {
        "record_id": 4,
        "vehicle_id": 1,
        "fill_date": "2026-06-15",
        "odometer_km": 16420.0,
        "litres": 26.8,
        "total_cost": 2760.4,
        "full_tank_flag": True,
        "notes": "Full tank completed after trip. Multi-fill interval (15L + 26.8L = 41.8L for 640km)"
    },
    {
        "record_id": 5,
        "vehicle_id": 1,
        "fill_date": "2026-07-01",
        "odometer_km": 17050.0,
        "litres": 41.2,
        "total_cost": 4243.6,
        "full_tank_flag": True,
        "notes": "Highway run to Mysore: 630km / 41.2L = 15.29 km/L"
    },
    {
        "record_id": 6,
        "vehicle_id": 1,
        "fill_date": "2026-07-20",
        "odometer_km": 17660.0,
        "litres": 39.0,
        "total_cost": 4017.0,
        "full_tank_flag": True,
        "notes": "Regular office travel in heavy monsoon traffic"
    },

    # Vehicle 2: MH-12-PQ-9021 (Car - Diesel)
    {
        "record_id": 7,
        "vehicle_id": 2,
        "fill_date": "2026-05-05",
        "odometer_km": 28100.0,
        "litres": 45.0,
        "total_cost": 4005.0,
        "full_tank_flag": True,
        "notes": "Baseline full tank fill - HPCL Pump"
    },
    {
        "record_id": 8,
        "vehicle_id": 2,
        "fill_date": "2026-05-25",
        "odometer_km": 28950.0,
        "litres": 44.2,
        "total_cost": 3933.8,
        "full_tank_flag": True,
        "notes": "Mumbai-Pune expressway runs: 850km / 44.2L = 19.23 km/L"
    },
    {
        "record_id": 9,
        "vehicle_id": 2,
        "fill_date": "2026-06-10",
        "odometer_km": 29810.0,
        "litres": 45.5,
        "total_cost": 4049.5,
        "full_tank_flag": True,
        "notes": "Highway and ring road mix: 860km / 45.5L = 18.90 km/L"
    },
    {
        "record_id": 10,
        "vehicle_id": 2,
        "fill_date": "2026-06-28",
        "odometer_km": 30300.0,
        "litres": 20.0,
        "total_cost": 1780.0,
        "full_tank_flag": False,
        "notes": "Partial emergency refill at rural station"
    },
    {
        "record_id": 11,
        "vehicle_id": 2,
        "fill_date": "2026-07-12",
        "odometer_km": 30720.0,
        "litres": 26.5,
        "total_cost": 2358.5,
        "full_tank_flag": True,
        "notes": "Full tank to complete interval: 910km / 46.5L = 19.57 km/L"
    },
    {
        "record_id": 12,
        "vehicle_id": 2,
        "fill_date": "2026-07-29",
        "odometer_km": 31580.0,
        "litres": 43.8,
        "total_cost": 3898.2,
        "full_tank_flag": True,
        "notes": "Monsoon weekend drive to Mahabaleshwar"
    },

    # Vehicle 3: DL-03-CB-1122 (Bike - Petrol)
    {
        "record_id": 13,
        "vehicle_id": 3,
        "fill_date": "2026-05-08",
        "odometer_km": 8400.0,
        "litres": 12.0,
        "total_cost": 1224.0,
        "full_tank_flag": True,
        "notes": "Baseline full tank for commuter motorcycle"
    },
    {
        "record_id": 14,
        "vehicle_id": 3,
        "fill_date": "2026-05-22",
        "odometer_km": 8840.0,
        "litres": 11.8,
        "total_cost": 1203.6,
        "full_tank_flag": True,
        "notes": "Daily Delhi-Noida commute: 440km / 11.8L = 37.29 km/L"
    },
    {
        "record_id": 15,
        "vehicle_id": 3,
        "fill_date": "2026-06-08",
        "odometer_km": 9270.0,
        "litres": 11.5,
        "total_cost": 1184.5,
        "full_tank_flag": True,
        "notes": "Early morning riding sessions: 430km / 11.5L = 37.39 km/L"
    },
    {
        "record_id": 16,
        "vehicle_id": 3,
        "fill_date": "2026-06-24",
        "odometer_km": 9680.0,
        "litres": 11.2,
        "total_cost": 1153.6,
        "full_tank_flag": True,
        "notes": "Gurgaon corporate route: 410km / 11.2L = 36.61 km/L"
    },
    {
        "record_id": 17,
        "vehicle_id": 3,
        "fill_date": "2026-07-10",
        "odometer_km": 10120.0,
        "litres": 12.1,
        "total_cost": 1246.3,
        "full_tank_flag": True,
        "notes": "Highway cruise: 440km / 12.1L = 36.36 km/L"
    },

    # Vehicle 4: HR-55-TR-7840 (Truck - Diesel)
    {
        "record_id": 18,
        "vehicle_id": 4,
        "fill_date": "2026-05-01",
        "odometer_km": 112000.0,
        "litres": 200.0,
        "total_cost": 17800.0,
        "full_tank_flag": True,
        "notes": "Logistics hub initial fill"
    },
    {
        "record_id": 19,
        "vehicle_id": 4,
        "fill_date": "2026-05-15",
        "odometer_km": 112950.0,
        "litres": 210.0,
        "total_cost": 18690.0,
        "full_tank_flag": True,
        "notes": "Heavy freight cargo: 950km / 210L = 4.52 km/L"
    },
    {
        "record_id": 20,
        "vehicle_id": 4,
        "fill_date": "2026-06-01",
        "odometer_km": 113880.0,
        "litres": 205.0,
        "total_cost": 18245.0,
        "full_tank_flag": True,
        "notes": "Inter-state freight: 930km / 205L = 4.54 km/L"
    },
    {
        "record_id": 21,
        "vehicle_id": 4,
        "fill_date": "2026-06-20",
        "odometer_km": 114840.0,
        "litres": 212.0,
        "total_cost": 18868.0,
        "full_tank_flag": True,
        "notes": "Industrial delivery route: 960km / 212L = 4.53 km/L"
    },
    {
        "record_id": 22,
        "vehicle_id": 4,
        "fill_date": "2026-07-15",
        "odometer_km": 115790.0,
        "litres": 208.0,
        "total_cost": 18512.0,
        "full_tank_flag": True,
        "notes": "Return cargo transport: 950km / 208L = 4.57 km/L"
    },

    # Vehicle 5: TS-09-EV-3003 (Car - CNG)
    {
        "record_id": 23,
        "vehicle_id": 5,
        "fill_date": "2026-05-10",
        "odometer_km": 42000.0,
        "litres": 9.5,
        "total_cost": 807.5,
        "full_tank_flag": True,
        "notes": "CNG 200 bar cylinder baseline fill"
    },
    {
        "record_id": 24,
        "vehicle_id": 5,
        "fill_date": "2026-05-24",
        "odometer_km": 42220.0,
        "litres": 9.2,
        "total_cost": 782.0,
        "full_tank_flag": True,
        "notes": "City taxi runs: 220km / 9.2kg = 23.91 km/kg"
    },
    {
        "record_id": 25,
        "vehicle_id": 5,
        "fill_date": "2026-06-07",
        "odometer_km": 42450.0,
        "litres": 9.4,
        "total_cost": 799.0,
        "full_tank_flag": True,
        "notes": "ORR ring road loop: 230km / 9.4kg = 24.47 km/kg"
    },
    {
        "record_id": 26,
        "vehicle_id": 5,
        "fill_date": "2026-06-22",
        "odometer_km": 42680.0,
        "litres": 9.1,
        "total_cost": 773.5,
        "full_tank_flag": True,
        "notes": "Suburban taxi duty: 230km / 9.1kg = 25.27 km/kg"
    },
    {
        "record_id": 27,
        "vehicle_id": 5,
        "fill_date": "2026-07-08",
        "odometer_km": 42910.0,
        "litres": 9.3,
        "total_cost": 790.5,
        "full_tank_flag": True,
        "notes": "Regular city commute: 230km / 9.3kg = 24.73 km/kg"
    },

    # ========================================================
    # Intentionally Invalid Test Records
    # These demonstrate validation checks and the Invalid Readings report
    # ========================================================
    {
        "record_id": 28,
        "vehicle_id": 1,
        "fill_date": "2026-08-05",
        "odometer_km": 17200.0,  # Typo: 17,200 km entered after 17,660 km!
        "litres": 38.0,
        "total_cost": 3914.0,
        "full_tank_flag": True,
        "notes": "[SAMPLE INVALID] Odometer rollback typo: 17,200 km entered after previous reading of 17,660 km"
    },
    {
        "record_id": 29,
        "vehicle_id": 3,
        "fill_date": "2026-07-25",
        "odometer_km": 10120.0,  # Duplicate reading: same as record 17
        "litres": 10.5,
        "total_cost": 1081.5,
        "full_tank_flag": True,
        "notes": "[SAMPLE INVALID] Duplicate odometer: 10,120 km entered on next date without distance progression"
    }
]
