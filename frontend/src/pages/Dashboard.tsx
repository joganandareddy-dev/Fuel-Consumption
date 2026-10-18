import { useState, useEffect } from 'react';
import { 
  Car, 
  Fuel, 
  IndianRupee, 
  Gauge, 
  TrendingUp, 
  AlertTriangle, 
  Filter, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { DashboardData, Vehicle, DatabaseStatus } from '../types';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { MonthlyExpenseBarChart, MileageTrendLineChart, VehicleComparisonChart } from '../components/Charts';

interface DashboardProps {
  vehicles: Vehicle[];
  onNavigateTab: (tab: string) => void;
  dbStatus: DatabaseStatus | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ vehicles, onNavigateTab, dbStatus }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedVehicle, setSelectedVehicle] = useState<string>('All');
  const [selectedFuelType, setSelectedFuelType] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardAnalytics({
        vehicle_id: selectedVehicle,
        fuel_type: selectedFuelType,
        month: selectedMonth,
        year: selectedYear,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedVehicle, selectedFuelType, selectedMonth, selectedYear]);

  const resetFilters = () => {
    setSelectedVehicle('All');
    setSelectedFuelType('All');
    setSelectedMonth('All');
    setSelectedYear('All');
  };

  const hasActiveFilters = selectedVehicle !== 'All' || selectedFuelType !== 'All' || selectedMonth !== 'All' || selectedYear !== 'All';

  return (
    <div className="space-y-6">
      {/* Demo Mode / MySQL Status Banner */}
      {dbStatus?.is_demo_mode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Demonstration Mode Active (Sample Data Loaded)
                <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  Sample Fleet Data
                </span>
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Displaying 5 sample vehicles, multi-month fuel logs, and test invalid readings. MySQL is not connected yet.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-4 decoration-amber-400"
          >
            Configure MySQL Database <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Vehicles"
          value={data?.total_vehicles ?? '-'}
          subtitle="Registered in fleet"
          icon={Car}
          colorScheme="blue"
        />
        <StatCard
          title="Fuel Consumed"
          value={data ? `${data.total_litres.toLocaleString()} L` : '-'}
          subtitle="Valid fuel recorded"
          icon={Fuel}
          colorScheme="teal"
        />
        <StatCard
          title="Total Expenditure"
          value={data ? `₹${data.total_expenditure.toLocaleString()}` : '-'}
          subtitle="Cumulative spend"
          icon={IndianRupee}
          colorScheme="indigo"
        />
        <StatCard
          title="Avg Valid Mileage"
          value={data?.average_mileage !== null && data?.average_mileage !== undefined ? `${data.average_mileage} km/L` : 'Insufficient data'}
          subtitle="Full-tank intervals"
          icon={Gauge}
          colorScheme="emerald"
          badge={data?.average_mileage ? 'Calculated' : 'Pending Full-Tank'}
        />
        <StatCard
          title="Avg Cost per KM"
          value={data?.average_cost_per_km !== null && data?.average_cost_per_km !== undefined ? `₹${data.average_cost_per_km}/km` : 'Insufficient data'}
          subtitle="Per km running cost"
          icon={TrendingUp}
          colorScheme="amber"
        />
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Vehicle Filter */}
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Vehicles ({vehicles.length})</option>
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id.toString()}>
                {v.vehicle_code} ({v.vehicle_type} - {v.fuel_type})
              </option>
            ))}
          </select>

          {/* Fuel Type Filter */}
          <select
            value={selectedFuelType}
            onChange={(e) => setSelectedFuelType(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Fuel Types</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="CNG">CNG</option>
            <option value="Electric">Electric</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {data?.invalid_count ? (
          <button
            onClick={() => onNavigateTab('invalid-readings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{data.invalid_count} Invalid Reading{data.invalid_count > 1 ? 's' : ''} Flagged</span>
          </button>
        ) : null}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Fuel Expenditure Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Fuel Expenditure</h3>
              <p className="text-xs text-slate-500">Expenditure trend in ₹ across billing periods</p>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              Bar Chart
            </span>
          </div>
          <MonthlyExpenseBarChart data={data?.monthly_expenditure || []} />
        </div>

        {/* Monthly Mileage Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Mileage Trend</h3>
              <p className="text-xs text-slate-500">Full-tank interval efficiency in km/litre</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Line Chart
            </span>
          </div>
          <MileageTrendLineChart data={data?.monthly_mileage_trends || []} />
        </div>
      </div>

      {/* Vehicle Comparison & Recent Records Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Fuel Efficiency Comparison */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Efficiency Comparison</h3>
              <p className="text-xs text-slate-500">Fleet average valid mileage</p>
            </div>
            <button
              onClick={() => onNavigateTab('mileage-analysis')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Analyze
            </button>
          </div>
          <VehicleComparisonChart data={data?.vehicle_efficiency_comparison || []} />
        </div>

        {/* Recent Fuel Records Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Fuel Records</h3>
              <p className="text-xs text-slate-500">Latest odometer entries, fuel refills and calculated intervals</p>
            </div>
            <button
              onClick={() => onNavigateTab('fuel-records')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              View All ({data?.all_records_count || 0})
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Odometer</th>
                  <th className="py-2.5 px-3">Fuel</th>
                  <th className="py-2.5 px-3">Cost</th>
                  <th className="py-2.5 px-3">Mileage</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.recent_records && data.recent_records.length > 0 ? (
                  data.recent_records.map((r) => (
                    <tr key={r.record_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {r.vehicle_code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {r.fill_date}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.odometer_km.toLocaleString()} km
                      </td>
                      <td className="py-2.5 px-3">
                        {r.litres.toFixed(1)} L
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        ₹{r.total_cost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.mileage_km_per_l ? (
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {r.mileage_km_per_l} km/L
                          </span>
                        ) : r.approx_km_per_l ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]" title="Approximate segment distance per litre. Not exact full-tank mileage.">
                            ~{r.approx_km_per_l} km/L*
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {!r.is_valid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Invalid
                          </span>
                        ) : r.is_valid_interval ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Full-Tank Cycle
                          </span>
                        ) : !r.full_tank_flag ? (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Partial Fill
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Baseline</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No fuel records matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
