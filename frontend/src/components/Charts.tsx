import React, { useState } from 'react';
import type { MonthlyExpenditure, MonthlyMileageTrend, VehicleEfficiency } from '../types';

// ================= 1. Monthly Fuel Expenditure Bar Chart =================
interface MonthlyExpenseBarChartProps {
  data: MonthlyExpenditure[];
}

export const MonthlyExpenseBarChart: React.FC<MonthlyExpenseBarChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No monthly expenditure data available</p>
        <p className="text-xs text-slate-400 mt-1">Add fuel logs to see expenditure trends</p>
      </div>
    );
  }

  const maxExpense = Math.max(...data.map(d => d.expenditure), 1000);
  const chartHeight = 220;

  return (
    <div className="relative">
      {/* Tooltip display */}
      <div className="h-8 mb-2 flex items-center justify-between text-xs text-slate-500">
        <div>
          {hoveredIdx !== null ? (
            <span className="font-semibold text-slate-900">
              {data[hoveredIdx].month}: <span className="text-teal-600">₹{data[hoveredIdx].expenditure.toLocaleString()}</span> ({data[hoveredIdx].litres.toFixed(1)} L across {data[hoveredIdx].count} fills)
            </span>
          ) : (
            <span>Hover over any bar to view exact expenditure and litres</span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Peak: ₹{maxExpense.toLocaleString()}</span>
      </div>

      {/* SVG Bar Chart */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[320px] flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-200" style={{ height: `${chartHeight}px` }}>
          {data.map((item, idx) => {
            const barHeightPct = Math.max((item.expenditure / maxExpense) * 100, 4);
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Bar Value text */}
                <span className={`text-[11px] font-bold transition-opacity mb-1.5 ${isHovered ? 'text-teal-600 opacity-100' : 'text-slate-500 opacity-80'}`}>
                  ₹{Math.round(item.expenditure / 1000)}k
                </span>

                {/* Animated Bar Column */}
                <div className="w-full max-w-[48px] rounded-t-lg bg-slate-100 overflow-hidden flex items-end h-full">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`
                      w-full rounded-t-lg transition-all duration-300
                      ${isHovered 
                        ? 'bg-gradient-to-t from-teal-600 to-cyan-500 shadow-md shadow-teal-500/30' 
                        : 'bg-gradient-to-t from-teal-500 to-teal-400'}
                    `}
                  />
                </div>

                {/* Month label */}
                <span className={`mt-2 text-xs font-medium transition-colors ${isHovered ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  {item.month.slice(5)}/{item.month.slice(2, 4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ================= 2. Monthly Mileage Trend Line Chart =================
interface MileageTrendLineChartProps {
  data: MonthlyMileageTrend[];
}

export const MileageTrendLineChart: React.FC<MileageTrendLineChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validData = data.filter(d => d.average_mileage !== null);

  if (!validData || validData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">Insufficient full-tank intervals for trend</p>
        <p className="text-xs text-slate-400 mt-1">Requires at least one completed full-to-full cycle</p>
      </div>
    );
  }

  const mileages = validData.map(d => d.average_mileage as number);
  const minMileage = Math.max(0, Math.floor(Math.min(...mileages) * 0.8));
  const maxMileage = Math.ceil(Math.max(...mileages) * 1.2);
  const range = maxMileage - minMileage || 1;

  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = validData.map((d, i) => {
    const x = paddingX + (i / Math.max(validData.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (((d.average_mileage as number) - minMileage) / range) * (height - 2 * paddingY);
    return { x, y, data: d };
  });

  const pathD = points.length === 1 
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');

  const areaD = points.length === 1
    ? ''
    : `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="relative">
      {/* Tooltip Header */}
      <div className="h-8 mb-2 flex items-center justify-between text-xs text-slate-500">
        <div>
          {hoveredIdx !== null ? (
            <span className="font-semibold text-slate-900">
              {validData[hoveredIdx].month}: <span className="text-blue-600 font-bold">{validData[hoveredIdx].average_mileage} km/L</span> ({validData[hoveredIdx].distance_km} km travelled)
            </span>
          ) : (
            <span>Monthly efficiency across valid full-tank intervals</span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Scale: {minMileage}-{maxMileage} km/L</span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 25}`} className="w-full h-auto min-w-[320px]">
          <defs>
            <linearGradient id="mileageGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#e2e8f0" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#cbd5e1" />

          {/* Shaded Area */}
          {areaD && <path d={areaD} fill="url(#mileageGradient)" />}

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={pt.data.month}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? '#1d4ed8' : '#ffffff'}
                  stroke="#2563eb"
                  strokeWidth={isHovered ? 3 : 2.5}
                  className="transition-all duration-150"
                />
                {/* Value on hover */}
                {isHovered && (
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-blue-700"
                  >
                    {pt.data.average_mileage} km/L
                  </text>
                )}
                {/* X-axis labels */}
                <text
                  x={pt.x}
                  y={height + 14}
                  textAnchor="middle"
                  className={`text-[10px] ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400 font-medium'}`}
                >
                  {pt.data.month.slice(5)}/{pt.data.month.slice(2, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ================= 3. Vehicle-wise Fuel Efficiency Comparison =================
interface VehicleComparisonChartProps {
  data: VehicleEfficiency[];
}

export const VehicleComparisonChart: React.FC<VehicleComparisonChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No vehicles registered</p>
      </div>
    );
  }

  // Filter vehicles with known mileage to compute relative bar length
  const validMileages = data.map(d => d.average_mileage || 0);
  const maxMileage = Math.max(...validMileages, 40);

  return (
    <div className="space-y-3.5">
      {data.map((item) => {
        const hasMileage = item.average_mileage !== null;
        const widthPct = hasMileage ? Math.min(100, Math.max(8, ((item.average_mileage || 0) / maxMileage) * 100)) : 0;

        return (
          <div key={item.vehicle_id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">{item.vehicle_code}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                  {item.vehicle_type} • {item.fuel_type}
                </span>
              </div>
              <div className="text-right">
                {hasMileage ? (
                  <span className="text-xs font-bold text-teal-700">
                    {item.average_mileage} km/L
                    {item.cost_per_km !== null && (
                      <span className="text-[11px] text-slate-400 font-normal ml-1.5">
                        (₹{item.cost_per_km}/km)
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Insufficient data
                  </span>
                )}
              </div>
            </div>

            {/* Horizontal Bar */}
            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
              {hasMileage ? (
                <div
                  style={{ width: `${widthPct}%` }}
                  className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-500"
                />
              ) : (
                <div className="h-full w-full bg-slate-200" />
              )}
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Consumed: {item.total_fuel_litres.toFixed(1)} L</span>
              <span>Total Spend: ₹{item.total_spend.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
