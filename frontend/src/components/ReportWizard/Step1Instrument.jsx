import React from 'react';
import { Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export function Step1Instrument({ data, onChange }) {
  const {
    manufacturer = '',
    model = '',
    serialNumber = '',
    capacity = '',
    verificationInterval = '',
    accuracyClass = 'Class III',
    type = 'Electronic Platform',
    minCapacity = ''
  } = data;

  const capNum = parseFloat(capacity) || 0;
  const eNum = parseFloat(verificationInterval) || 0;
  const nVal = (capNum > 0 && eNum > 0) ? Math.round(capNum / eNum) : 0;

  // OIML R 76 Table 3 verification interval limits
  let nStatus = { valid: true, message: '' };
  if (nVal > 0) {
    if (accuracyClass === 'Class III') {
      if (nVal < 100 || nVal > 10000) {
        nStatus = { valid: false, message: `For Class III, n should be between 100 and 10,000 (currently ${nVal.toLocaleString()})` };
      } else {
        nStatus = { valid: true, message: `Compliant Class III scale (n = ${nVal.toLocaleString()} intervals)` };
      }
    } else if (accuracyClass === 'Class II') {
      if (nVal < 100 || nVal > 100000) {
        nStatus = { valid: false, message: `For Class II, n should be between 100 and 100,000 (currently ${nVal.toLocaleString()})` };
      } else {
        nStatus = { valid: true, message: `Compliant Class II scale (n = ${nVal.toLocaleString()} intervals)` };
      }
    }
  }

  const handlePreFill = () => {
    onChange({
      manufacturer: 'Mettler Toledo',
      model: 'bC-U215 Precision Scale',
      serialNumber: 'MT-2026-NAWI-9481',
      capacity: '15',
      verificationInterval: '0.005',
      accuracyClass: 'Class III',
      type: 'Electronic Counter Scale',
      minCapacity: '0.1'
    });
  };

  const handleCapacityChange = (val) => {
    // Only allow valid numeric string
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    const c = parseFloat(val) || 0;
    const e = parseFloat(verificationInterval) || 0;
    const newMin = e > 0 ? (20 * e).toFixed(3) : minCapacity;
    onChange({ capacity: val, minCapacity: newMin });
  };

  const handleIntervalChange = (val) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    const e = parseFloat(val) || 0;
    const newMin = e > 0 ? (20 * e).toFixed(3) : minCapacity;
    onChange({ verificationInterval: val, minCapacity: newMin });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Step 1 — Instrument Details</h2>
          <p className="text-xs text-slate-500">
            Define metrological characteristics per OIML R 76-1 Clause 3.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePreFill}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
        >
          <Sparkles size={14} className="text-emerald-600" />
          Pre-fill Demo Specs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Manufacturer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Manufacturer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={manufacturer}
            onChange={(e) => onChange({ manufacturer: e.target.value })}
            placeholder="e.g. Mettler Toledo, Sartorius, Ohaus"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Model Designation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="e.g. bC-U215, Defender 3000"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Serial Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Serial Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={serialNumber}
            onChange={(e) => onChange({ serialNumber: e.target.value })}
            placeholder="e.g. SN-2026-8849-NAWI"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Instrument Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Instrument Type / Form Factor <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Electronic Platform">Electronic Platform Scale</option>
            <option value="Electronic Counter Scale">Electronic Counter / Price-Computing Scale</option>
            <option value="Bench Scale">Bench Scale</option>
            <option value="Weighbridge">Weighbridge / Vehicle Scale</option>
            <option value="Analytical Balance">Analytical / Precision Balance</option>
          </select>
        </div>

        {/* Accuracy Class */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Accuracy Class <span className="text-red-500">*</span>
          </label>
          <select
            value={accuracyClass}
            onChange={(e) => onChange({ accuracyClass: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Class I">Class I — Special Accuracy (e ≥ 1 mg)</option>
            <option value="Class II">Class II — High Accuracy (1 mg ≤ e ≤ 50 mg)</option>
            <option value="Class III">Class III — Medium Accuracy (0.1 g ≤ e ≤ 2 g) [Most Commercial Scales]</option>
            <option value="Class IIII">Class IIII — Ordinary Accuracy (e ≥ 5 g)</option>
          </select>
        </div>

        {/* Capacity (Max) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Max Capacity (Max) in kg <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={capacity}
            onChange={(e) => handleCapacityChange(e.target.value)}
            placeholder="e.g. 15 or 30 or 60"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Verification scale interval (e) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Verification Scale Interval (e) in kg <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={verificationInterval}
            onChange={(e) => handleIntervalChange(e.target.value)}
            placeholder="e.g. 0.005 (for 5 g) or 0.002 (for 2 g)"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Example: 5 g = 0.005 kg, 2 g = 0.002 kg, 10 g = 0.010 kg
          </p>
        </div>

        {/* Min Capacity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Minimum Capacity (Min) in kg
          </label>
          <input
            type="text"
            value={minCapacity}
            onChange={(e) => {
              if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                onChange({ minCapacity: e.target.value });
              }
            }}
            placeholder="Auto-calculated (e.g. 20e)"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Standard: Min = 20e (Class III) = {eNum > 0 ? (20 * eNum).toFixed(3) : 0} kg
          </p>
        </div>
      </div>

      {/* Auto-Calculated Scale Intervals (n) Info Card */}
      {nVal > 0 && (
        <div className={`p-4 rounded-xl border ${nStatus.valid ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {nStatus.valid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Calculated Verification Scale Intervals (n = Max / e)
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                n = {nVal.toLocaleString()} intervals
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {nStatus.message}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
