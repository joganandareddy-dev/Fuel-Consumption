import { Menu, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DatabaseStatus } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  setMobileOpen: (open: boolean) => void;
  onOpenAddRecord: () => void;
  onResetDemo: () => void;
  dbStatus: DatabaseStatus | null;
  onNavigateSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  setMobileOpen,
  onOpenAddRecord,
  onResetDemo,
  dbStatus,
  onNavigateSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & mobile menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* DB Status Pill */}
        <button
          onClick={onNavigateSettings}
          title="Click to view database connection settings"
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm
            ${dbStatus?.mysql_connected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}
          `}
        >
          {dbStatus?.mysql_connected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>MySQL Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Mode (SQLite)</span>
            </>
          )}
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetDemo}
          title="Reset database to fresh sample dataset"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* Quick Add Fuel Record Button */}
        <button
          onClick={onOpenAddRecord}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all shadow-teal-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fuel Record</span>
        </button>
      </div>
    </header>
  );
};
