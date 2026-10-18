import type { Vehicle, FuelRecord, DashboardData, DatabaseStatus, ReportsData } from '../types';

let rawApiUrl = (import.meta.env.VITE_API_URL as string) || '';
if (!rawApiUrl) {
  rawApiUrl = 'http://127.0.0.1:5000/api';
} else if (!rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}/api`;
} else if (!rawApiUrl.endsWith('/api') && !rawApiUrl.endsWith('/api/')) {
  rawApiUrl = `${rawApiUrl.replace(/\/$/, '')}/api`;
}
const API_BASE_URL = rawApiUrl;

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      });

      if (!response.ok) {
        let errMessage = `HTTP error ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.error || errData.message || errMessage;
        } catch {
          // fallback to status text
        }
        throw new Error(errMessage);
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API request failed: ${endpoint}`, err);
      throw err;
    }
  }

  // Database Connection & Demo Mode
  async getDbStatus(): Promise<DatabaseStatus> {
    return this.request<DatabaseStatus>('/db-status');
  }

  async testAndConnectMySQL(config: any): Promise<{ success: boolean; message: string; status: DatabaseStatus }> {
    return this.request('/db-connect', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return this.request('/db-reset-demo', {
      method: 'POST',
    });
  }

  // Vehicles CRUD
  async getVehicles(): Promise<Vehicle[]> {
    return this.request<Vehicle[]>('/vehicles');
  }

  async getVehicle(id: number): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  async createVehicle(data: { vehicle_code: string; vehicle_type: string; fuel_type: string }): Promise<any> {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVehicle(id: number, data: { vehicle_code: string; vehicle_type: string; fuel_type: string }): Promise<any> {
    return this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVehicle(id: number): Promise<any> {
    return this.request(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // Fuel Records CRUD
  async getFuelRecords(params?: { vehicle_id?: number | string; status?: string }): Promise<{
    records: FuelRecord[];
    total_records: number;
    total_valid: number;
    total_invalid: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.vehicle_id) searchParams.append('vehicle_id', params.vehicle_id.toString());
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/fuel-records${query}`);
  }

  async createFuelRecord(data: {
    vehicle_id: number;
    fill_date: string;
    odometer_km: number;
    litres: number;
    total_cost: number;
    full_tank_flag: boolean;
    notes?: string;
  }): Promise<{ message: string; record_id: number; is_valid: boolean; warning?: string }> {
    return this.request('/fuel-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFuelRecord(id: number, data: {
    vehicle_id: number;
    fill_date: string;
    odometer_km: number;
    litres: number;
    total_cost: number;
    full_tank_flag: boolean;
    notes?: string;
  }): Promise<any> {
    return this.request(`/fuel-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFuelRecord(id: number): Promise<any> {
    return this.request(`/fuel-records/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics & Dashboard
  async getDashboardAnalytics(filters?: {
    vehicle_id?: string;
    fuel_type?: string;
    month?: string;
    year?: string;
  }): Promise<DashboardData> {
    const searchParams = new URLSearchParams();
    if (filters?.vehicle_id && filters.vehicle_id !== 'All') searchParams.append('vehicle_id', filters.vehicle_id);
    if (filters?.fuel_type && filters.fuel_type !== 'All') searchParams.append('fuel_type', filters.fuel_type);
    if (filters?.month && filters.month !== 'All') searchParams.append('month', filters.month);
    if (filters?.year && filters.year !== 'All') searchParams.append('year', filters.year);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<DashboardData>(`/analytics/dashboard${query}`);
  }

  async getInvalidReadings(): Promise<{ invalid_records: FuelRecord[]; count: number }> {
    return this.request('/invalid-readings');
  }

  async getReports(): Promise<ReportsData> {
    return this.request<ReportsData>('/analytics/reports');
  }

  getCsvExportUrl(type: 'fuel_records' | 'vehicle_mileage' | 'monthly_consumption' | 'vehicle_comparison' | 'invalid_readings'): string {
    return `${API_BASE_URL}/export/csv?type=${type}`;
  }
}

export const api = new ApiService();
