import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Fuel, 
  Gauge, 
  FileText, 
  AlertTriangle, 
  Settings,
  Flame,
  Database
} from 'lucide-react';
import type { DatabaseStatus } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  invalidCount: number;
  dbStatus: DatabaseStatus | null;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  invalidCount,
  dbStatus,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'fuel-records', label: 'Fuel Records', icon: Fuel },
    { id: 'mileage-analysis', label: 'Mileage Analysis', icon: Gauge },
    { id: 'reports', label: 'Reports', icon: FileText },
    { 
      id: 'invalid-readings', 
      label: 'Invalid Readings', 
      icon: AlertTriangle, 
      badge: invalidCount > 0 ? invalidCount : undefined 
    },
    { id: 'settings', label: 'Settings & MySQL', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Title */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">
              Fuel Analytics
            </h1>
            <p className="text-xs text-teal-400 font-medium">Consumption System</p>
          </div>
        </div>

        {/* Database Status Banner */}
        <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.mysql_connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className={`absolute w-4 h-4 rounded-full opacity-75 animate-ping ${dbStatus?.mysql_connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {dbStatus?.mysql_connected ? 'MySQL Active' : 'Demo Mode (SQLite)'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {dbStatus?.mysql_connected ? `DB: ${dbStatus.mysql_config.database}` : 'Sample data active'}
            </div>
          </div>
          <Database className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-gradient-to-r from-teal-500/20 to-blue-600/20 text-teal-300 border-l-4 border-teal-400 pl-3' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Pandas & NumPy:</span>
            <span className="text-teal-400 font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Interval Engine:</span>
            <span className="text-slate-300">Full-Tank Strict</span>
          </div>
          <div className="pt-2 text-[10px] text-slate-400 text-center">
            Fuel Management v2.4
          </div>
        </div>
      </aside>
    </>
  );
};
