import React from 'react';
import { MetrologyNotice } from '../MetrologyNotice';
import { Thermometer, Droplets, Gauge, Building2, User, Calendar, AlertTriangle } from 'lucide-react';

export function Step2Environment({ data, onChange }) {
  const {
    labName = 'National Legal Metrology Laboratory (NLML)',
    date = new Date().toISOString().split('T')[0],
    temperature = '21.5',
    humidity = '50',
    testerName = '',
    pressure = '1013.25'
  } = data;

  const handleNumericInput = (field, val) => {
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      onChange({ [field]: val });
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Step 2 — Laboratory & Ambient Environment</h2>
        <p className="text-xs text-slate-500">
          Record testing facility conditions per OIML R 76-1 Clause 3.9 (Temperature range 15°C to 35°C, Humidity ≤ 80%).
        </p>
      </div>

      {/* Dynamic Warning Notification for Temperature/Humidity */}
      <MetrologyNotice temperature={temperature} humidity={humidity} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Lab Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Testing Laboratory Facility <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              required
              value={labName}
              onChange={(e) => onChange({ labName: e.target.value })}
              placeholder="e.g. National Legal Metrology Laboratory"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Date of Type Evaluation <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => onChange({ date: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tester Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Authorized Testing Officer / Metrologist <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              required
              value={testerName}
              onChange={(e) => onChange({ testerName: e.target.value })}
              placeholder="e.g. Alex Vance (Verification Officer)"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Ambient Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Ambient Temperature (°C) <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Standard: 15.0°C – 35.0°C</span>
          </div>
          <div className="relative">
            <Thermometer size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              required
              value={temperature}
              onChange={(e) => handleNumericInput('temperature', e.target.value)}
              placeholder="e.g. 21.5"
              className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 ${
                temperature !== '' && (parseFloat(temperature) < 15 || parseFloat(temperature) > 35)
                  ? 'border-amber-400 focus:ring-amber-500'
                  : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Relative Humidity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Relative Humidity (%) <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Standard: ≤ 80% RH</span>
          </div>
          <div className="relative">
            <Droplets size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              required
              value={humidity}
              onChange={(e) => handleNumericInput('humidity', e.target.value)}
              placeholder="e.g. 52.0"
              className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 ${
                humidity !== '' && parseFloat(humidity) > 80
                  ? 'border-amber-400 focus:ring-amber-500'
                  : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Atmospheric Pressure */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Atmospheric Pressure (hPa / mbar) <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Gauge size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={pressure}
              onChange={(e) => handleNumericInput('pressure', e.target.value)}
              placeholder="e.g. 1013.25"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
