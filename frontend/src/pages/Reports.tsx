import { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Gauge, 
  IndianRupee, 
  Calendar, 
  Car, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import type { ReportsData } from '../types';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<
    'vehicle_mileage' | 'fuel_expense' | 'monthly_consumption' | 'vehicle_comparison' | 'invalid_reading'
  >('vehicle_mileage');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.getReports();
        setReports(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const reportTabs = [
    { id: 'vehicle_mileage', label: 'Vehicle-wise Mileage Report', icon: Gauge },
    { id: 'fuel_expense', label: 'Fuel Expense Summary', icon: IndianRupee },
    { id: 'monthly_consumption', label: 'Monthly Consumption Report', icon: Calendar },
    { id: 'vehicle_comparison', label: 'Vehicle Comparison Report', icon: Car },
    { id: 'invalid_reading', label: 'Invalid-Reading Report', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions (Hidden during print) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Fleet Analytics & Management Reports</h2>
          <p className="text-xs text-slate-500">
            Generate, print, and export CSV summaries for vehicle efficiency, monthly consumption, and data integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          <a
            href={api.getCsvExportUrl(
              activeReportTab === 'invalid_reading' ? 'invalid_readings' : activeReportTab as any
            )}
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all shadow-teal-600/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Active CSV</span>
          </a>
        </div>
      </div>

      {/* Printable Report Header (Visible only on print) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Fuel Consumption Analysis System</h1>
        <p className="text-sm text-slate-600">Official Fleet Mileage & Expense Audit Report</p>
        <p className="text-xs text-slate-500 mt-1">
          Generated on: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Report Selection Tabs (Hidden during print) */}
      <div className="no-print flex overflow-x-auto gap-2 pb-1">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${isActive 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 overflow-hidden">
        {/* 1. Vehicle-wise Mileage Report */}
        {activeReportTab === 'vehicle_mileage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Vehicle-wise Mileage Report</h3>
                <p className="text-xs text-slate-500">Calculated across verified full-tank-to-full-tank intervals</p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                {reports?.vehicle_mileage_report.length || 0} Vehicles Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle Code</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Fuel</th>
                    <th className="py-2.5 px-3">Fills</th>
                    <th className="py-2.5 px-3">Valid Cycles</th>
                    <th className="py-2.5 px-3">Total Distance</th>
                    <th className="py-2.5 px-3">Total Fuel (L)</th>
                    <th className="py-2.5 px-3">Total Expense</th>
                    <th className="py-2.5 px-3">Avg Mileage</th>
                    <th className="py-2.5 px-3">Cost / km</th>
                    <th className="py-2.5 px-3">Reliability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reports?.vehicle_mileage_report.map((row) => (
                    <tr key={row.vehicle_id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.vehicle_code}</td>
                      <td className="py-3 px-3">{row.vehicle_type}</td>
                      <td className="py-3 px-3">{row.fuel_type}</td>
                      <td className="py-3 px-3">{row.total_records}</td>
                      <td className="py-3 px-3">{row.valid_intervals}</td>
                      <td className="py-3 px-3 font-mono">{row.total_distance_km.toLocaleString()} km</td>
                      <td className="py-3 px-3 font-mono">{row.total_fuel_litres.toFixed(1)} L</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{row.total_cost_inr.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        {typeof row.average_mileage === 'number' ? (
                          <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 inline-block">
                            {row.average_mileage} km/L
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            {row.average_mileage}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {typeof row.cost_per_km === 'number' ? `₹${row.cost_per_km}/km` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Fuel Expense Summary */}
        {activeReportTab === 'fuel_expense' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Fuel Expense Summary</h3>
                <p className="text-xs text-slate-500">Expenditure segmented by fuel types and vehicle categories</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Fleet Grand Total</span>
                <span className="text-base font-bold text-indigo-700">
                  ₹{reports?.fuel_expense_summary.overall_total_expense.toLocaleString()}
                </span>
              </div>
            </div>

            {/* By Fuel Type Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2.5">Breakdown By Fuel Type</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-2 px-3">Fuel Type</th>
                      <th className="py-2 px-3">Total Spend (₹)</th>
                      <th className="py-2 px-3">Total Volume (L)</th>
                      <th className="py-2 px-3">Avg Rate / Litre</th>
                      <th className="py-2 px-3">Log Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {reports?.fuel_expense_summary.by_fuel_type.map((f) => (
                      <tr key={f.fuel_type} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{f.fuel_type}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">₹{f.total_cost.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono">{f.total_litres.toFixed(1)} L</td>
                        <td className="py-2.5 px-3 font-mono text-teal-700">₹{f.avg_price_per_litre.toFixed(2)}/L</td>
                        <td className="py-2.5 px-3">{f.record_count} fills</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Vehicle Classification Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2.5">Breakdown By Vehicle Type</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-2 px-3">Vehicle Type</th>
                      <th className="py-2 px-3">Total Spend (₹)</th>
                      <th className="py-2 px-3">Total Volume (L)</th>
                      <th className="py-2 px-3">Records Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {reports?.fuel_expense_summary.by_vehicle_type.map((v) => (
                      <tr key={v.vehicle_type} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{v.vehicle_type}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">₹{v.total_cost.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono">{v.total_litres.toFixed(1)} L</td>
                        <td className="py-2.5 px-3">{v.record_count} fills</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Monthly Consumption Report */}
        {activeReportTab === 'monthly_consumption' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Monthly Fuel Consumption Report</h3>
                <p className="text-xs text-slate-500">Aggregated litres, expenditures, and average fuel pricing by calendar month</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3">Calendar Month</th>
                    <th className="py-2.5 px-3">Fills Count</th>
                    <th className="py-2.5 px-3">Total Litres (L)</th>
                    <th className="py-2.5 px-3">Total Cost (₹)</th>
                    <th className="py-2.5 px-3">Travelled Dist (km)</th>
                    <th className="py-2.5 px-3">Avg Cost / Litre</th>
                    <th className="py-2.5 px-3">Avg Fuel Cost / km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reports?.monthly_consumption_report.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{m.month}</td>
                      <td className="py-3 px-3">{m.fills_count}</td>
                      <td className="py-3 px-3 font-mono">{m.total_litres.toFixed(1)} L</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{m.total_cost_inr.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono">{m.total_distance_km.toLocaleString()} km</td>
                      <td className="py-3 px-3 font-mono text-teal-700">₹{m.average_cost_per_litre.toFixed(2)}/L</td>
                      <td className="py-3 px-3 font-mono">
                        {typeof m.average_fuel_cost_per_km === 'number' ? `₹${m.average_fuel_cost_per_km}/km` : m.average_fuel_cost_per_km}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Vehicle Comparison Report */}
        {activeReportTab === 'vehicle_comparison' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Vehicle Comparison Report</h3>
                <p className="text-xs text-slate-500">Cross-fleet comparative analysis of fuel economy and operational expense</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Fuel</th>
                    <th className="py-2.5 px-3">Total Litres</th>
                    <th className="py-2.5 px-3">Total Spend</th>
                    <th className="py-2.5 px-3">Verified Mileage</th>
                    <th className="py-2.5 px-3">Cost / km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reports?.vehicle_comparison_report.map((v) => (
                    <tr key={v.vehicle_id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{v.vehicle_code}</td>
                      <td className="py-3 px-3">{v.vehicle_type}</td>
                      <td className="py-3 px-3">{v.fuel_type}</td>
                      <td className="py-3 px-3 font-mono">{v.total_fuel_litres.toFixed(1)} L</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{v.total_cost_inr.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        {typeof v.average_mileage === 'number' ? (
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {v.average_mileage} km/L
                          </span>
                        ) : (
                          <span className="text-amber-600 text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {v.average_mileage}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {typeof v.cost_per_km === 'number' ? `₹${v.cost_per_km}/km` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Invalid-Reading Report */}
        {activeReportTab === 'invalid_reading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Invalid-Reading Audit Report
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed register of records flagged for odometer rollbacks, duplicates, or negative inputs (excluded from calculations)
                </p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                {reports?.invalid_reading_report.length || 0} Issues Detected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-50/60 text-rose-900 font-semibold border-b border-rose-200">
                  <tr>
                    <th className="py-2.5 px-3">Record ID</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Odometer</th>
                    <th className="py-2.5 px-3">Litres</th>
                    <th className="py-2.5 px-3">Cost</th>
                    <th className="py-2.5 px-3">Detected Anomaly / Issue</th>
                    <th className="py-2.5 px-3">Recommended Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reports?.invalid_reading_report && reports.invalid_reading_report.length > 0 ? (
                    reports.invalid_reading_report.map((inv) => (
                      <tr key={inv.record_id} className="bg-rose-50/20 hover:bg-rose-50/50">
                        <td className="py-3 px-3 font-mono text-slate-500">#{inv.record_id}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{inv.vehicle_code}</td>
                        <td className="py-3 px-3 text-slate-600">{inv.fill_date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-700">{inv.odometer_km.toLocaleString()} km</td>
                        <td className="py-3 px-3 font-mono">{inv.litres} L</td>
                        <td className="py-3 px-3">₹{inv.total_cost}</td>
                        <td className="py-3 px-3 text-rose-700 font-bold max-w-xs">{inv.issue_description}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">{inv.recommended_correction}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                        No invalid readings detected! Fleet data chronology is pristine.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
