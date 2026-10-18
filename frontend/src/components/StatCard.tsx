import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'teal' | 'blue' | 'indigo' | 'amber' | 'emerald';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'teal',
  badge,
}) => {
  const schemeStyles = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-100',
      glow: 'group-hover:border-teal-300',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      glow: 'group-hover:border-blue-300',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      glow: 'group-hover:border-indigo-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      glow: 'group-hover:border-amber-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      glow: 'group-hover:border-emerald-300',
    },
  };

  const style = schemeStyles[colorScheme] || schemeStyles.teal;

  return (
    <div className={`
      group bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all duration-200 ${style.glow}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">Status</span>
          <span className="font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full text-[11px]">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};
