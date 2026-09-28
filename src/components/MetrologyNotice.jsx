import React from 'react';
import { AlertTriangle, Thermometer, Droplets } from 'lucide-react';

export function MetrologyNotice({ temperature, humidity }) {
  const tempNum = Number(temperature);
  const humidNum = Number(humidity);

  const hasTempWarning = temperature !== '' && temperature !== null && !isNaN(tempNum) && (tempNum < 15 || tempNum > 35);
  const hasHumidWarning = humidity !== '' && humidity !== null && !isNaN(humidNum) && humidNum > 80;

  if (!hasTempWarning && !hasHumidWarning) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md my-3 shadow-xs">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-900">
            Metrological Environment Warning (OIML R 76-1 Clause 3.9)
          </h4>
          <div className="text-xs text-amber-800 space-y-1">
            {hasTempWarning && (
              <p className="flex items-center gap-1.5">
                <Thermometer size={14} className="text-amber-600" />
                Temperature is <strong>{tempNum}°C</strong>. Standard OIML R 76 type evaluation requires ambient temperature between <strong>15.0°C and 35.0°C</strong>.
              </p>
            )}
            {hasHumidWarning && (
              <p className="flex items-center gap-1.5">
                <Droplets size={14} className="text-amber-600" />
                Relative humidity is <strong>{humidNum}%</strong>. Standard maximum permissible test limit is <strong>≤ 80% RH</strong> to prevent condensation errors.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
