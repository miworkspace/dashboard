import React from 'react';
import { PackageOpen, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'Try adjusting your search terms or filters to find what you are looking for.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 ${className}`}>
      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl mb-3">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ message = 'Loading infrastructure records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-3" />
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
}

export function SkeletonRow({ cols = 6 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function ErrorState({ title = 'Error Loading Data', message, onRetry }) {
  return (
    <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
      <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      {message && <p className="text-xs text-rose-700 mt-1 mb-4 max-w-md mx-auto">{message}</p>}
      {onRetry && (
        <Button variant="dangerOutline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
