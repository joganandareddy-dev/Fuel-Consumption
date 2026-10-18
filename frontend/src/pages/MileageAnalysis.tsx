import { useState, useEffect } from 'react';
import { 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';
import type { Vehicle, FuelRecord } from '../types';
import { api } from '../services/api';

interface MileageAnalysisProps {
  vehicles: Vehicle[];
}

export const MileageAnalysis: React.FC<MileageAnalysisProps> = ({ vehicles: initialVehicles }) => {
  const [vehicleList, setVehicleList] = useState<Vehicle[]>(initialVehicles || []);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(initialVehicles[0]?.vehicle_id || 1);
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      setVehicleList(initialVehicles);
      if (!selectedVehicleId) setSelectedVehicleId(initialVehicles[0].vehicle_id);
    } else {
      api.getVehicles().then((data) => {
        setVehicleList(data);
        if (data.length > 0) setSelectedVehicleId(data[0].vehicle_id);
      }).catch(console.error);
    }
  }, [initialVehicles]);

  useEffect(() => {
    const fetchVehicleLogs = async () => {
      setLoading(true);
      try {
        const res = await api.getFuelRecords({ vehicle_id: selectedVehicleId });
        // Sort chronologically ascending to follow interval progression
        const chronological = [...res.records].sort((a, b) => {
          if (a.fill_date === b.fill_date) return a.odometer_km - b.odometer_km;
          return a.fill_date.localeCompare(b.fill_date);
        });
        setRecords(chronological);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedVehicleId) {
      fetchVehicleLogs();
    }
  }, [selectedVehicleId]);

  const activeVehicle = vehicleList.find((v) => v.vehicle_id === selectedVehicleId);

  // Completed valid intervals
  const validIntervals = records.filter(r => r.is_valid && r.is_valid_interval);
  const partialFills = records.filter(r => r.is_valid && !r.full_tank_flag && r.interval_type === 'Partial Refill');
  const invalidRecords = records.filter(r => !r.is_valid);

  const totalValidDistance = validIntervals.reduce((sum, r) => sum + (r.distance_km || 0), 0);
  const totalIntervalLitres = validIntervals.reduce((sum, r) => sum + (r.litres || 0), 0);
  const totalIntervalCost = validIntervals.reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const avgVehicleMileage = totalIntervalLitres > 0 && totalValidDistance > 0
    ? (totalValidDistance / totalIntervalLitres).toFixed(2)
    : 'Insufficient data';

  const avgCostPerKm = totalValidDistance > 0 && totalIntervalCost > 0
    ? `₹${(totalIntervalCost / totalValidDistance).toFixed(2)}/km`
    : 'Insufficient data';

  return (
    <div className="space-y-6">
      {/* Vehicle Selector Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Vehicle Mileage Analysis & Interval Deep-Dive</h2>
          <p className="text-xs text-slate-500">
            Inspect cycle-by-cycle odometer progression and full-tank computational reliability.
          </p>
        </div>

        {/* Vehicle Picker */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Car className="w-4 h-4 text-teal-600" />
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {vehicleList.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.vehicle_code} ({v.vehicle_type} - {v.fuel_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">Overall Verified Mileage</span>
          <div className="mt-2 text-2xl font-bold text-teal-700">
            {avgVehicleMileage} {avgVehicleMileage !== 'Insufficient data' ? 'km/L' : ''}
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on full-tank cycles</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">Fuel Cost per Kilometre</span>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {avgCostPerKm}
          </div>
          <p className="text-xs text-slate-500 mt-1">Running expense rate</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">Completed Intervals</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {validIntervals.length} <span className="text-xs font-medium text-slate-500">cycles</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{partialFills.length} intermediate partial fills</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">Data Quality Status</span>
          <div className="mt-2">
            {invalidRecords.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                {invalidRecords.length} Flagged
              </span>
            ) : validIntervals.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified Data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Awaiting Full Tank
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {invalidRecords.length > 0 ? 'Excludes invalid readings' : 'Validated odometer chronology'}
          </p>
        </div>
      </div>

      {/* Mathematical Principle Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 rounded-2xl p-5 shadow-lg border border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          Rigorous Full-Tank Interval Calculation Engine
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Unlike inaccurate apps that simply divide distance by the latest partial refill, this system implements strict fuel interval science:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="font-bold text-teal-300 block mb-1">1. Distance Travelled</span>
            <code className="text-teal-400 font-mono text-[11px]">Distance = ODO_current − ODO_previous</code>
            <p className="text-slate-400 text-[11px] mt-1.5">Strictly checked: Odometer must be ascending. Rollbacks or duplicates are rejected.</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="font-bold text-blue-300 block mb-1">2. Full-to-Full Mileage</span>
            <code className="text-blue-400 font-mono text-[11px]">Mileage = Distance_interval ÷ Fuel_litres</code>
            <p className="text-slate-400 text-[11px] mt-1.5">Summates all intermediate partial refill litres until the next 100% full top-up.</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="font-bold text-amber-300 block mb-1">3. Running Cost Rate</span>
            <code className="text-amber-400 font-mono text-[11px]">Cost/km = Total_Cost_Interval ÷ Distance</code>
            <p className="text-slate-400 text-[11px] mt-1.5">Accurate monetary cost per kilometre incurred during each interval.</p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Chronological Progression Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chronological Fuel Refill Progression ({activeVehicle?.vehicle_code})
            </h3>
            <p className="text-xs text-slate-500">
              Tracing every fuel stop, interval completions, and validation assessments
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {records.length} total entries
          </span>
        </div>

        <div className="space-y-3">
          {records.length > 0 ? (
            records.map((r, index) => (
              <div
                key={r.record_id}
                className={`
                  p-4 rounded-xl border transition-all text-xs
                  ${!r.is_valid 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                    : r.is_valid_interval 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                      : !r.full_tank_flag 
                        ? 'bg-amber-50/40 border-amber-200 text-amber-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-800'}
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-500 font-bold">
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {r.fill_date}
                    </span>
                    <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                      {r.odometer_km.toLocaleString()} km
                    </span>
                    {r.distance_km !== null && r.distance_km !== undefined && (
                      <span className="font-mono text-teal-700 font-bold">
                        (+{r.distance_km.toLocaleString()} km)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {r.litres.toFixed(1)} L @ ₹{r.total_cost.toLocaleString()}
                    </span>

                    {r.full_tank_flag ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Full Tank
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                        Partial Fill
                      </span>
                    )}
                  </div>
                </div>

                {/* Computational Outcome */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex-1">
                    {!r.is_valid ? (
                      <span className="font-bold text-rose-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        {r.issue_description} — Excluded from mileage calculations.
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        {r.calculation_note}
                      </span>
                    )}
                  </div>

                  <div>
                    {r.mileage_km_per_l ? (
                      <span className="font-bold text-teal-700 bg-white px-2.5 py-1 rounded-md border border-teal-300 text-xs shadow-xs">
                        Mileage: {r.mileage_km_per_l} km/L ({r.cost_per_km ? `₹${r.cost_per_km}/km` : ''})
                      </span>
                    ) : r.approx_km_per_l ? (
                      <span className="text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300 text-[11px]" title="Segment approximate distance per litre. Not exact full-tank mileage.">
                        Approx: ~{r.approx_km_per_l} km/L* (Partial)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {r.interval_type === 'Baseline Fill' ? 'Starting Baseline' : 'Insufficient data'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400">
              No fuel records recorded for this vehicle yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
