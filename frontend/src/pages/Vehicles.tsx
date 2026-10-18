import { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Eye,
  Fuel
} from 'lucide-react';
import type { Vehicle } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface VehiclesProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateTab: (tab: string, vehicleId?: number) => void;
}

export const Vehicles: React.FC<VehiclesProps> = ({
  vehicles: initialVehicles,
  onRefresh,
  onShowToast,
  onNavigateTab,
}) => {
  const [vehicleList, setVehicleList] = useState<Vehicle[]>(initialVehicles || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [fuelFilter, setFuelFilter] = useState('All');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles();
      setVehicleList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      setVehicleList(initialVehicles);
    } else {
      fetchVehicles();
    }
  }, [initialVehicles]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    vehicle_code: '',
    vehicle_type: 'Car',
    fuel_type: 'Petrol',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search and filter logic
  const filteredVehicles = vehicleList.filter((v) => {
    const matchesSearch = v.vehicle_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || v.vehicle_type === typeFilter;
    const matchesFuel = fuelFilter === 'All' || v.fuel_type === fuelFilter;
    return matchesSearch && matchesType && matchesFuel;
  });

  const handleOpenAdd = () => {
    setFormData({ vehicle_code: '', vehicle_type: 'Car', fuel_type: 'Petrol' });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setActiveVehicle(v);
    setFormData({
      vehicle_code: v.vehicle_code,
      vehicle_type: v.vehicle_type,
      fuel_type: v.fuel_type,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = (v: Vehicle) => {
    setActiveVehicle(v);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (v: Vehicle) => {
    setActiveVehicle(v);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_code.trim()) {
      setFormError('Vehicle registration / code is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.createVehicle({
        vehicle_code: formData.vehicle_code.trim().toUpperCase(),
        vehicle_type: formData.vehicle_type,
        fuel_type: formData.fuel_type,
      });
      setIsAddModalOpen(false);
      onShowToast('success', 'Vehicle Added', `Vehicle ${formData.vehicle_code.toUpperCase()} successfully registered.`);
      fetchVehicles();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) return;
    if (!formData.vehicle_code.trim()) {
      setFormError('Vehicle registration / code is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.updateVehicle(activeVehicle.vehicle_id, {
        vehicle_code: formData.vehicle_code.trim().toUpperCase(),
        vehicle_type: formData.vehicle_type,
        fuel_type: formData.fuel_type,
      });
      setIsEditModalOpen(false);
      onShowToast('success', 'Vehicle Updated', `Vehicle ${formData.vehicle_code.toUpperCase()} updated.`);
      fetchVehicles();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeVehicle) return;
    setSubmitting(true);
    try {
      await api.deleteVehicle(activeVehicle.vehicle_id);
      setIsDeleteModalOpen(false);
      onShowToast('info', 'Vehicle Deleted', `Vehicle ${activeVehicle.vehicle_code} and records were deleted.`);
      fetchVehicles();
      onRefresh();
    } catch (err: any) {
      onShowToast('error', 'Delete Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getFuelBadgeColor = (fuel: string) => {
    switch (fuel) {
      case 'Petrol': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Diesel': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CNG': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Electric': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Vehicle Fleet Register</h2>
          <p className="text-xs text-slate-500">
            Manage registered vehicles, propulsion types, odometer statuses, and view fuel logs.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all shadow-teal-600/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vehicle registration / code (e.g. KA-01, MH-12)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Types</option>
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Fuels</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="CNG">CNG</option>
            <option value="Electric">Electric</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Vehicle ID</th>
                <th className="py-3 px-4">Registration Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Logs Count</th>
                <th className="py-3 px-4">Latest Odometer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.vehicle_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      #{v.vehicle_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {v.vehicle_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                        <Car className="w-3.5 h-3.5 text-slate-500" />
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getFuelBadgeColor(v.fuel_type)}`}>
                        <Fuel className="w-3 h-3" />
                        {v.fuel_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onNavigateTab('fuel-records', v.vehicle_id)}
                        className="text-teal-600 hover:text-teal-700 hover:underline font-semibold"
                      >
                        {v.record_count || 0} fuel fills
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {v.latest_odometer_km ? `${v.latest_odometer_km.toLocaleString()} km` : 'No logs yet'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(v)}
                          title="View Vehicle Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          title="Edit Vehicle"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(v)}
                          title="Delete Vehicle"
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Car className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No vehicles found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try altering your search or register a new vehicle above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Vehicle"
        subtitle="Add a vehicle to monitor its fuel consumption and mileage intervals"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Vehicle Code / Registration Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KA-01-MJ-5050 or TRUCK-04"
              value={formData.vehicle_code}
              onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs uppercase"
            />
            <p className="text-[11px] text-slate-400 mt-1">Must be unique across the fleet.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Other">Other</option>
              </select>
            </div>
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
              {submitting ? 'Registering...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Vehicle #${activeVehicle?.vehicle_id}`}
        subtitle="Update vehicle registration or propulsion details"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vehicle Code</label>
            <input
              type="text"
              required
              value={formData.vehicle_code}
              onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Other">Other</option>
              </select>
            </div>
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
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Vehicle Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Vehicle Profile: ${activeVehicle?.vehicle_code}`}
        subtitle="Detailed specifications and fleet history"
      >
        {activeVehicle && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Vehicle ID</span>
                <span className="font-bold text-slate-900">#{activeVehicle.vehicle_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Registration</span>
                <span className="font-bold text-slate-900">{activeVehicle.vehicle_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Classification</span>
                <span className="font-semibold text-slate-800">{activeVehicle.vehicle_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Propulsion / Fuel</span>
                <span className="font-semibold text-slate-800">{activeVehicle.fuel_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Fuel Fills</span>
                <span className="font-bold text-teal-600">{activeVehicle.record_count || 0} records</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Latest Odometer</span>
                <span className="font-mono text-slate-800 font-bold">
                  {activeVehicle.latest_odometer_km ? `${activeVehicle.latest_odometer_km.toLocaleString()} km` : 'No logs'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  onNavigateTab('fuel-records', activeVehicle.vehicle_id);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 transition-colors"
              >
                <Fuel className="w-4 h-4" />
                View Fuel Logs
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Vehicle Deletion"
        subtitle="This action is irreversible and cascades to fuel records."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to delete vehicle <strong className="text-slate-900">{activeVehicle?.vehicle_code}</strong>?
            All associated odometer readings, fuel records, and interval mileage history for this vehicle will also be removed.
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
              {submitting ? 'Deleting...' : 'Delete Vehicle'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
