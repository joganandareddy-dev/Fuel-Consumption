import { useState, useEffect } from 'react';
import { 
  Fuel, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ArrowUpDown, 
  Download,
  Info
} from 'lucide-react';
import type { FuelRecord, Vehicle } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface FuelRecordsProps {
  vehicles: Vehicle[];
  initialVehicleFilter?: number | null;
  onRefreshStats: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const FuelRecords: React.FC<FuelRecordsProps> = ({
  vehicles,
  initialVehicleFilter,
  onRefreshStats,
  onShowToast,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>(
    initialVehicleFilter ? initialVehicleFilter.toString() : 'All'
  );
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'fill_date' | 'odometer_km' | 'litres' | 'total_cost'>('fill_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit & Delete modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<FuelRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: vehicles[0]?.vehicle_id || 1,
    fill_date: new Date().toISOString().slice(0, 10),
    odometer_km: '',
    litres: '',
    total_cost: '',
    full_tank_flag: true,
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getFuelRecords({
        vehicle_id: vehicleFilter !== 'All' ? vehicleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setRecords(res.records);
    } catch (err: any) {
      onShowToast('error', 'Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [vehicleFilter, statusFilter]);

  useEffect(() => {
    if (initialVehicleFilter) {
      setVehicleFilter(initialVehicleFilter.toString());
    }
  }, [initialVehicleFilter]);

  const handleOpenAdd = () => {
    const defaultVid = vehicles[0]?.vehicle_id || 1;
    setFormData({
      vehicle_id: defaultVid,
      fill_date: new Date().toISOString().slice(0, 10),
      odometer_km: '',
      litres: '',
      total_cost: '',
      full_tank_flag: true,
      notes: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: FuelRecord) => {
    setActiveRecord(rec);
    setFormData({
      vehicle_id: rec.vehicle_id,
      fill_date: rec.fill_date,
      odometer_km: rec.odometer_km.toString(),
      litres: rec.litres.toString(),
      total_cost: rec.total_cost.toString(),
      full_tank_flag: rec.full_tank_flag,
      notes: rec.notes || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (rec: FuelRecord) => {
    setActiveRecord(rec);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const litres = parseFloat(formData.litres);
    const cost = parseFloat(formData.total_cost);
    const odo = parseFloat(formData.odometer_km);

    if (isNaN(litres) || litres <= 0) {
      setFormError('Fuel quantity must be strictly greater than 0 litres');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormError('Fuel cost cannot be negative');
      return;
    }
    if (isNaN(odo) || odo < 0) {
      setFormError('Odometer reading cannot be negative');
      return;
    }
    if (!formData.fill_date) {
      setFormError('Fill date is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createFuelRecord({
        vehicle_id: Number(formData.vehicle_id),
        fill_date: formData.fill_date,
        odometer_km: odo,
        litres: litres,
        total_cost: cost,
        full_tank_flag: formData.full_tank_flag,
        notes: formData.notes,
      });

      setIsAddModalOpen(false);
      if (res.warning) {
        onShowToast('warning', 'Record Logged with Warning', res.warning);
      } else {
        onShowToast('success', 'Fuel Log Saved', 'Fuel purchase recorded and interval mileage updated.');
      }
      fetchRecords();
      onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save fuel record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;
    const litres = parseFloat(formData.litres);
    const cost = parseFloat(formData.total_cost);
    const odo = parseFloat(formData.odometer_km);

    if (isNaN(litres) || litres <= 0) {
      setFormError('Fuel quantity must be strictly greater than 0 litres');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormError('Fuel cost cannot be negative');
      return;
    }
    if (isNaN(odo) || odo < 0) {
      setFormError('Odometer reading cannot be negative');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.updateFuelRecord(activeRecord.record_id, {
        vehicle_id: Number(formData.vehicle_id),
        fill_date: formData.fill_date,
        odometer_km: odo,
        litres: litres,
        total_cost: cost,
        full_tank_flag: formData.full_tank_flag,
        notes: formData.notes,
      });

      setIsEditModalOpen(false);
      onShowToast('success', 'Fuel Log Updated', `Record #${activeRecord.record_id} successfully updated.`);
      fetchRecords();
      onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeRecord) return;
    setSubmitting(true);
    try {
      await api.deleteFuelRecord(activeRecord.record_id);
      setIsDeleteModalOpen(false);
      onShowToast('info', 'Record Deleted', `Fuel record #${activeRecord.record_id} removed.`);
      fetchRecords();
      onRefreshStats();
    } catch (err: any) {
      onShowToast('error', 'Delete Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Sorting and text searching
  const filteredAndSortedRecords = records
    .filter((r) => {
      const search = searchTerm.toLowerCase();
      const codeMatch = r.vehicle_code?.toLowerCase().includes(search);
      const notesMatch = r.notes?.toLowerCase().includes(search);
      const dateMatch = r.fill_date?.includes(search);
      return codeMatch || notesMatch || dateMatch;
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'fill_date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Fuel Purchase & Odometer Log</h2>
          <p className="text-xs text-slate-500">
            Consecutive odometer tracking, full-tank interval detection, and mileage calculation engine.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={api.getCsvExportUrl('fuel_records')}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all shadow-teal-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fuel Record</span>
          </button>
        </div>
      </div>

      {/* Partial Refill Explanation Box */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Understanding Full-Tank Intervals vs Partial Refills:</strong>
          <span className="block text-blue-800/90 mt-1">
            Exact mileage requires a <strong>full-tank-to-full-tank cycle</strong> because only filling to 100% capacity measures the exact fuel consumed.
            For partial refills, distance divided by the partial fuel is labeled as <em>approximate (~km/L*)</em>.
            When you subsequently fill the tank to full, all accumulated partial litres and distances are combined into one verified interval.
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by vehicle code, notes, or date (YYYY-MM)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id.toString()}>
                {v.vehicle_code}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="valid">Valid Records Only</option>
            <option value="invalid">Flagged / Invalid Only</option>
          </select>
        </div>
      </div>

      {/* Fuel Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Vehicle</th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => toggleSort('fill_date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => toggleSort('odometer_km')}
                >
                  <div className="flex items-center gap-1">
                    <span>Odometer</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Interval Dist</th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => toggleSort('litres')}
                >
                  <div className="flex items-center gap-1">
                    <span>Litres</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => toggleSort('total_cost')}
                >
                  <div className="flex items-center gap-1">
                    <span>Cost (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Tank</th>
                <th className="py-3 px-3">Mileage</th>
                <th className="py-3 px-3">Cost/km</th>
                <th className="py-3 px-3">Validation & Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAndSortedRecords.length > 0 ? (
                filteredAndSortedRecords.map((r) => (
                  <tr 
                    key={r.record_id} 
                    className={`
                      transition-colors
                      ${!r.is_valid ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'}
                    `}
                  >
                    <td className="py-3 px-3 font-mono text-slate-400">
                      #{r.record_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.vehicle_code}</div>
                      <div className="text-[10px] text-slate-400">{r.vehicle_type} • {r.fuel_type}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {r.fill_date}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {r.odometer_km.toLocaleString()} km
                    </td>
                    <td className="py-3 px-3">
                      {r.distance_km !== null && r.distance_km !== undefined ? (
                        <span className="font-mono text-slate-700">
                          +{r.distance_km.toLocaleString()} km
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {r.litres.toFixed(1)} L
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{r.total_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      {r.full_tank_flag ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          100% Full
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Partial
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {r.mileage_km_per_l ? (
                        <div className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 inline-block">
                          {r.mileage_km_per_l} km/L
                        </div>
                      ) : r.approx_km_per_l ? (
                        <div 
                          className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block text-[11px]"
                          title="Segment approximate distance per partial litre. Not exact full-tank mileage."
                        >
                          ~{r.approx_km_per_l} km/L*
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Insufficient data</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {r.cost_per_km ? (
                        <span className="font-mono text-slate-700">₹{r.cost_per_km}/km</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      {!r.is_valid ? (
                        <div className="text-[11px] font-bold text-rose-700 flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                          <div>
                            <div>{r.issue_description}</div>
                            <div className="text-[10px] text-rose-500 font-normal mt-0.5">Rec: {r.recommended_correction}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 truncate" title={r.calculation_note || r.notes || ''}>
                          {r.calculation_note || r.notes || '—'}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          title="Edit Record"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(r)}
                          title="Delete Record"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Fuel className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No fuel records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add a new fuel purchase using the button above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fuel Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Fuel Record"
        subtitle="Log odometer reading, fuel volume, expense, and full-tank state"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vehicle <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.vehicle_code} ({v.vehicle_type} - {v.fuel_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Fill Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.fill_date}
                onChange={(e) => setFormData({ ...formData, fill_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Odometer (km) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="e.g. 15780"
                value={formData.odometer_km}
                onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Fuel Litres (L) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 38.5"
                value={formData.litres}
                onChange={(e) => setFormData({ ...formData, litres: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Cost (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                placeholder="e.g. 3965"
                value={formData.total_cost}
                onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Full Tank Flag checkbox */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="full_tank_checkbox"
              checked={formData.full_tank_flag}
              onChange={(e) => setFormData({ ...formData, full_tank_flag: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="full_tank_checkbox" className="cursor-pointer">
              <span className="font-bold text-slate-900 block">Tank was filled to 100% Full (Auto cut-off)</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Check this if tank was topped up completely. Uncheck for partial refills (e.g., ₹500 or 10 litres top-up).
              </span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Optional Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Highway travel to Mysore, Shell petrol pump, AC on full"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Fuel Record Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Fuel Record #${activeRecord?.record_id}`}
        subtitle="Correct odometer readings, fuel amount, or notes"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle</label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.vehicle_code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fill Date</label>
              <input
                type="date"
                required
                value={formData.fill_date}
                onChange={(e) => setFormData({ ...formData, fill_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Odometer (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={formData.odometer_km}
                onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Litres (L)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.litres}
                onChange={(e) => setFormData({ ...formData, litres: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost (₹)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={formData.total_cost}
                onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="edit_full_tank_checkbox"
              checked={formData.full_tank_flag}
              onChange={(e) => setFormData({ ...formData, full_tank_flag: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="edit_full_tank_checkbox" className="cursor-pointer">
              <span className="font-bold text-slate-900 block">Full Tank (Auto cut-off)</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Ensure this reflects whether the tank was 100% full.
              </span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Record Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Record Deletion"
        subtitle="This fuel record will be permanently deleted"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to delete fuel record <strong className="text-slate-900">#{activeRecord?.record_id}</strong> for {activeRecord?.vehicle_code}?
            Subsequent intervals will be re-calculated automatically.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmDelete}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete Record'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
