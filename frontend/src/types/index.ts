export const TYPES_VERSION = '1.0.0';

export interface Vehicle {
  vehicle_id: number;
  vehicle_code: string;
  vehicle_type: 'Car' | 'Bike' | 'Truck' | 'Bus' | 'Other';
  fuel_type: 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Other';
  record_count?: number;
  latest_odometer_km?: number;
  created_at?: string;
}

export interface FuelRecord {
  record_id: number;
  vehicle_id: number;
  vehicle_code?: string;
  vehicle_type?: string;
  fuel_type?: string;
  fill_date: string;
  odometer_km: number;
  litres: number;
  total_cost: number;
  full_tank_flag: boolean;
  notes?: string;
  // Computed interval properties
  is_valid?: boolean;
  distance_km?: number | null;
  mileage_km_per_l?: number | null;
  approx_km_per_l?: number | null;
  cost_per_km?: number | null;
  interval_type?: string;
  is_valid_interval?: boolean;
  calculation_note?: string;
  issue_description?: string | null;
  recommended_correction?: string | null;
}

export interface MonthlyExpenditure {
  month: string;
  expenditure: number;
  litres: number;
  count: number;
}

export interface MonthlyMileageTrend {
  month: string;
  average_mileage: number | null;
  distance_km: number;
}

export interface VehicleEfficiency {
  vehicle_id: number;
  vehicle_code: string;
  vehicle_type: string;
  fuel_type: string;
  average_mileage: number | null;
  cost_per_km: number | null;
  status: string;
  total_fuel_litres: number;
  total_spend: number;
}

export interface DashboardData {
  total_vehicles: number;
  total_litres: number;
  total_expenditure: number;
  average_mileage: number | null;
  average_cost_per_km: number | null;
  total_valid_distance: number;
  monthly_expenditure: MonthlyExpenditure[];
  monthly_mileage_trends: MonthlyMileageTrend[];
  vehicle_efficiency_comparison: VehicleEfficiency[];
  recent_records: FuelRecord[];
  invalid_count: number;
  all_records_count: number;
}

export interface DatabaseStatus {
  active_engine: 'mysql' | 'sqlite';
  mysql_connected: boolean;
  is_demo_mode: boolean;
  status_message: string;
  connection_error?: string | null;
  mysql_config: {
    host: string;
    port: number;
    user: string;
    database: string;
  };
}

export interface VehicleMileageReportItem {
  vehicle_id: number;
  vehicle_code: string;
  vehicle_type: string;
  fuel_type: string;
  total_records: number;
  valid_intervals: number;
  total_distance_km: number;
  total_fuel_litres: number;
  total_cost_inr: number;
  average_mileage: number | string;
  cost_per_km: number | string;
  status: string;
}

export interface MonthlyConsumptionReportItem {
  month: string;
  fills_count: number;
  total_litres: number;
  total_cost_inr: number;
  total_distance_km: number;
  average_cost_per_litre: number;
  average_fuel_cost_per_km: number | string;
}

export interface InvalidReadingReportItem {
  record_id: number;
  vehicle_id: number;
  vehicle_code: string;
  fill_date: string;
  odometer_km: number;
  litres: number;
  total_cost: number;
  issue_description: string;
  recommended_correction: string;
}

export interface ReportsData {
  vehicle_mileage_report: VehicleMileageReportItem[];
  fuel_expense_summary: {
    overall_total_expense: number;
    overall_total_litres: number;
    by_fuel_type: Array<{
      fuel_type: string;
      total_cost: number;
      total_litres: number;
      avg_price_per_litre: number;
      record_count: number;
    }>;
    by_vehicle_type: Array<{
      vehicle_type: string;
      total_cost: number;
      total_litres: number;
      record_count: number;
    }>;
  };
  monthly_consumption_report: MonthlyConsumptionReportItem[];
  vehicle_comparison_report: VehicleMileageReportItem[];
  invalid_reading_report: InvalidReadingReportItem[];
}
