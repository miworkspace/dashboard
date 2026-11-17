import React from 'react';

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendPositive = true,
  helper,
  onClick,
  badge,
  iconColor = 'text-slate-600',
  iconBg = 'bg-slate-100',
  className = ''
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs transition-all duration-150 ${
        isClickable ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-slate-500 truncate">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {value}
        </span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(trend || helper) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trendPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend}
            </span>
          )}
          {helper && <span className="text-slate-500 truncate">{helper}</span>}
        </div>
      )}
    </div>
  );
}
