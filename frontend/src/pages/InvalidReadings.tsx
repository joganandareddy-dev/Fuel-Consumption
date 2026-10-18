import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Edit2, 
  RotateCcw, 
  ShieldAlert,
  Info
} from 'lucide-react';
import type { FuelRecord, Vehicle } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface InvalidReadingsProps {
  vehicles: Vehicle[];
  onRefreshStats: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const InvalidReadings: React.FC<InvalidReadingsProps> = ({
  vehicles,
  onRefreshStats,
  onShowToast,
}) => {
  const [invalidRecords, setInvalidRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<FuelRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    vehicle_id: 1,
    fill_date: '',
    odometer_km: '',
    litres: '',
    total_cost: '',
    full_tank_flag: true,
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvalidReadings = async () => {
    setLoading(true);
    try {
      const res = await api.getInvalidReadings();
      setInvalidRecords(res.invalid_records);
    } catch (err: any) {
      onShowToast('error', 'Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvalidReadings();
  }, []);

  const handleOpenEdit = (rec: FuelRecord) => {
    setActiveRecord(rec);
    setEditFormData({
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

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;
    const litres = parseFloat(editFormData.litres);
    const cost = parseFloat(editFormData.total_cost);
    const odo = parseFloat(editFormData.odometer_km);

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
        vehicle_id: Number(editFormData.vehicle_id),
        fill_date: editFormData.fill_date,
        odometer_km: odo,
        litres: litres,
        total_cost: cost,
        full_tank_flag: editFormData.full_tank_flag,
        notes: editFormData.notes,
      });

      setIsEditModalOpen(false);
      onShowToast('success', 'Record Corrected', `Record #${activeRecord.record_id} was updated. Checking chronology...`);
      fetchInvalidReadings();
      onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Invalid Readings & Data Quality Register
          </h2>
          <p className="text-xs text-slate-500">
            Records flagged for chronological odometer violations, zero fuel quantities, or invalid costs.
          </p>
        </div>
        <button
          onClick={fetchInvalidReadings}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-scan Audit</span>
        </button>
      </div>

      {/* Policy Notice Box */}
      <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Zero-Data-Loss Invalidation Policy:</strong>
          <span className="block text-rose-900/90 mt-1">
            In accordance with system specifications, invalid fuel logs are <strong>never silently deleted</strong>.
            Instead, anomalous records are quarantined from mileage equations to prevent skewing fleet efficiency metrics,
            while preserving the physical receipt for manual review and correction.
          </span>
        </div>
      </div>

      {/* Flagged Records List */}
      <div className="space-y-4">
        {invalidRecords.length > 0 ? (
          invalidRecords.map((r) => (
            <div
              key={r.record_id}
              className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Record #{r.record_id}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {r.vehicle_code}
                    </span>
                    <span className="text-xs text-slate-500">
                      Logged on: <strong className="text-slate-700">{r.fill_date}</strong>
                    </span>
                  </div>

                  {/* Issue Explanation */}
                  <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-100 text-xs">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      Detected Anomaly: {r.issue_description}
                    </span>
                    <p className="text-slate-700 mt-1 pl-5">
                      <strong>Recommended Correction:</strong> {r.recommended_correction}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span>Odometer: <strong className="font-mono text-slate-900">{r.odometer_km.toLocaleString()} km</strong></span>
                    <span>Fuel: <strong className="font-mono text-slate-900">{r.litres} L</strong></span>
                    <span>Cost: <strong className="font-mono text-slate-900">₹{r.total_cost}</strong></span>
                    <span>Tank Flag: <strong>{r.full_tank_flag ? 'Full Tank' : 'Partial Fill'}</strong></span>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-slate-500 italic">
                      Original Note: "{r.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => handleOpenEdit(r)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit & Resolve</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All Fuel Records Are Valid!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No chronological violations, negative quantities, or invalid odometer progressions detected.
            </p>
          </div>
        )}
      </div>

      {/* Edit Invalid Record Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Correct Invalid Record #${activeRecord?.record_id}`}
        subtitle="Adjust the odometer reading or fuel values to resolve validation errors"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div><strong>Flagged Issue:</strong> {activeRecord?.issue_description}</div>
            <div><strong>Recommended Correction:</strong> {activeRecord?.recommended_correction}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle</label>
              <select
                value={editFormData.vehicle_id}
                onChange={(e) => setEditFormData({ ...editFormData, vehicle_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
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
                value={editFormData.fill_date}
                onChange={(e) => setEditFormData({ ...editFormData, fill_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Corrected Odometer (km) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={editFormData.odometer_km}
                onChange={(e) => setEditFormData({ ...editFormData, odometer_km: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Litres (L)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={editFormData.litres}
                onChange={(e) => setEditFormData({ ...editFormData, litres: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Cost (₹)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={editFormData.total_cost}
                onChange={(e) => setEditFormData({ ...editFormData, total_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none"
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
              className="px-5 py-2 rounded-xl font-semibold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Validating...' : 'Save & Re-evaluate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
