import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Ban, 
  Archive, 
  HelpCircle,
  Radio,
  ShieldAlert
} from 'lucide-react';

export function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = HelpCircle;

  switch (normalized) {
    case 'available':
      styles = 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80';
      Icon = CheckCircle2;
      break;
    case 'active':
      styles = 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80';
      Icon = Radio;
      break;
    case 'in use':
    case 'assigned':
      styles = 'bg-blue-50/80 text-blue-800 border-blue-200/80';
      Icon = CheckCircle2;
      break;
    case 'maintenance':
      styles = 'bg-amber-50/80 text-amber-800 border-amber-200/80';
      Icon = Wrench;
      break;
    case 'reserved':
      styles = 'bg-purple-50/80 text-purple-800 border-purple-200/80';
      Icon = Clock;
      break;
    case 'conflict':
      styles = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold animate-pulse';
      Icon = ShieldAlert;
      break;
    case 'damaged':
    case 'lost':
      styles = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = AlertTriangle;
      break;
    case 'retired':
    case 'disposed':
    case 'inactive':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = Archive;
      break;
    case 'disabled':
      styles = 'bg-slate-100 text-slate-500 border-slate-200';
      Icon = Ban;
      break;
    default:
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
      Icon = HelpCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles} ${className} whitespace-nowrap`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}
