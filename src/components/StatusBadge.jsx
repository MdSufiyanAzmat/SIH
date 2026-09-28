import React from 'react';
import { CheckCircle2, XCircle, Clock, FileCheck } from 'lucide-react';

export function StatusBadge({ status, verdict, size = 'sm' }) {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3.5 py-1';
  const iconSize = isSm ? 13 : 16;

  if (verdict === 'PASS' || (status === 'Completed' && verdict !== 'FAIL')) {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        <CheckCircle2 size={iconSize} className="text-emerald-600" />
        PASS
      </span>
    );
  }

  if (verdict === 'FAIL') {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
        <XCircle size={iconSize} className="text-red-600" />
        FAIL
      </span>
    );
  }

  if (status === 'Draft') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
        <Clock size={iconSize} className="text-amber-500" />
        Draft
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
      <FileCheck size={iconSize} className="text-slate-500" />
      {status || 'Pending'}
    </span>
  );
}
