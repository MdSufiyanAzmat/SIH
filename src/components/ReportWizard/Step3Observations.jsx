import React, { useEffect } from 'react';
import { getMPE, getMPEDetails, generateDefaultWeighingPoints, round } from '../../utils/metrologyCalc';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  Scale,
  RefreshCw,
  Info
} from 'lucide-react';

export function Step3Observations({ instrument, tests, onChange }) {
  const e = parseFloat(instrument?.verificationInterval) || 0.005;
  const capacity = parseFloat(instrument?.capacity) || 15;
  const accuracyClass = instrument?.accuracyClass || 'Class III';
  const epsilon = 1e-7;

  // Initialize defaults if missing
  useEffect(() => {
    if (!tests.eccentricity || !tests.eccentricity.rows || tests.eccentricity.rows.length === 0) {
      const eccLoad = round(capacity / 3, 3);
      onChange({
        ...tests,
        zeroTest: tests.zeroTest || { zeroIndicated: '0.000', tareApplied: '3.000', tareIndicated: '3.000' },
        eccentricity: {
          appliedLoad: eccLoad,
          rows: [
            { position: 1, positionName: '1. Center (Platform Center)', appliedLoad: eccLoad, indicatedValue: eccLoad },
            { position: 2, positionName: '2. Front-Left (Corner 1)', appliedLoad: eccLoad, indicatedValue: eccLoad },
            { position: 3, positionName: '3. Back-Left (Corner 2)', appliedLoad: eccLoad, indicatedValue: eccLoad },
            { position: 4, positionName: '4. Back-Right (Corner 3)', appliedLoad: eccLoad, indicatedValue: eccLoad },
            { position: 5, positionName: '5. Front-Right (Corner 4)', appliedLoad: eccLoad, indicatedValue: eccLoad }
          ]
        },
        weighing: tests.weighing || {
          increasing: generateDefaultWeighingPoints(capacity, e, accuracyClass).map((pt, i) => ({
            step: i + 1,
            pointLabel: pt.pointLabel,
            appliedLoad: pt.appliedLoad,
            indicatedValue: pt.appliedLoad
          })),
          decreasing: [...generateDefaultWeighingPoints(capacity, e, accuracyClass)].reverse().map((pt, i) => ({
            step: i + 1,
            pointLabel: pt.pointLabel,
            appliedLoad: pt.appliedLoad,
            indicatedValue: pt.appliedLoad
          }))
        },
        repeatability: tests.repeatability || {
          appliedLoad: round(capacity * 0.5, 3),
          rows: [
            { runNumber: 1, appliedLoad: round(capacity * 0.5, 3), indicatedValue: round(capacity * 0.5, 3) },
            { runNumber: 2, appliedLoad: round(capacity * 0.5, 3), indicatedValue: round(capacity * 0.5, 3) },
            { runNumber: 3, appliedLoad: round(capacity * 0.5, 3), indicatedValue: round(capacity * 0.5, 3) },
            { runNumber: 4, appliedLoad: round(capacity * 0.5, 3), indicatedValue: round(capacity * 0.5, 3) },
            { runNumber: 5, appliedLoad: round(capacity * 0.5, 3), indicatedValue: round(capacity * 0.5, 3) }
          ]
        }
      });
    }
  }, [capacity, e, accuracyClass]);

  // Reject non-numeric inputs
  const sanitizeNumeric = (val) => {
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) return val;
    return null;
  };

  // 1. Zero & Tare Updates
  const handleZeroChange = (field, val) => {
    const clean = sanitizeNumeric(val);
    if (clean === null) return;
    onChange({
      ...tests,
      zeroTest: {
        ...tests.zeroTest,
        [field]: clean
      }
    });
  };

  // 2. Eccentricity Updates
  const handleEccentricityRowChange = (index, field, val) => {
    const clean = sanitizeNumeric(val);
    if (clean === null) return;
    const newRows = [...(tests.eccentricity?.rows || [])];
    newRows[index] = { ...newRows[index], [field]: clean };
    onChange({
      ...tests,
      eccentricity: {
        ...tests.eccentricity,
        rows: newRows
      }
    });
  };

  // 3. Weighing Updates
  const handleWeighingRowChange = (direction, index, field, val) => {
    const clean = sanitizeNumeric(val);
    if (clean === null) return;
    const list = [...(tests.weighing?.[direction] || [])];
    list[index] = { ...list[index], [field]: clean };
    onChange({
      ...tests,
      weighing: {
        ...tests.weighing,
        [direction]: list
      }
    });
  };

  const addWeighingRow = (direction) => {
    const list = [...(tests.weighing?.[direction] || [])];
    list.push({
      step: list.length + 1,
      pointLabel: `Step ${list.length + 1}`,
      appliedLoad: '',
      indicatedValue: ''
    });
    onChange({
      ...tests,
      weighing: {
        ...tests.weighing,
        [direction]: list
      }
    });
  };

  const removeWeighingRow = (direction, index) => {
    const list = [...(tests.weighing?.[direction] || [])];
    list.splice(index, 1);
    onChange({
      ...tests,
      weighing: {
        ...tests.weighing,
        [direction]: list
      }
    });
  };

  // 4. Repeatability Updates
  const handleRepeatabilityRowChange = (index, field, val) => {
    const clean = sanitizeNumeric(val);
    if (clean === null) return;
    const rows = [...(tests.repeatability?.rows || [])];
    rows[index] = { ...rows[index], [field]: clean };
    onChange({
      ...tests,
      repeatability: {
        ...tests.repeatability,
        rows
      }
    });
  };

  // Pre-fill realistic compliant test data
  const handlePreFillCompliant = () => {
    const defaultPoints = generateDefaultWeighingPoints(capacity, e, accuracyClass);
    const eccLoad = round(capacity / 3, 3);
    const repLoad = round(capacity * 0.5, 3);

    onChange({
      zeroTest: {
        zeroIndicated: '0.000',
        tareApplied: '3.000',
        tareIndicated: '3.000'
      },
      eccentricity: {
        appliedLoad: eccLoad,
        rows: [
          { position: 1, positionName: '1. Center (Platform Center)', appliedLoad: eccLoad, indicatedValue: eccLoad },
          { position: 2, positionName: '2. Front-Left (Corner 1)', appliedLoad: eccLoad, indicatedValue: round(eccLoad + 0.001, 3) },
          { position: 3, positionName: '3. Back-Left (Corner 2)', appliedLoad: eccLoad, indicatedValue: round(eccLoad - 0.001, 3) },
          { position: 4, positionName: '4. Back-Right (Corner 3)', appliedLoad: eccLoad, indicatedValue: round(eccLoad + 0.001, 3) },
          { position: 5, positionName: '5. Front-Right (Corner 4)', appliedLoad: eccLoad, indicatedValue: eccLoad }
        ]
      },
      weighing: {
        increasing: defaultPoints.map((pt, i) => {
          const mpe = getMPE(pt.appliedLoad, e, accuracyClass, capacity);
          // slight realistic drift well within mpe
          const drift = i % 2 === 0 ? 0 : round(mpe * 0.4, 4);
          return {
            step: i + 1,
            pointLabel: pt.pointLabel,
            appliedLoad: pt.appliedLoad,
            indicatedValue: round(pt.appliedLoad + drift, 4)
          };
        }),
        decreasing: [...defaultPoints].reverse().map((pt, i) => {
          const mpe = getMPE(pt.appliedLoad, e, accuracyClass, capacity);
          const drift = i % 3 === 0 ? 0 : round(mpe * 0.3, 4);
          return {
            step: i + 1,
            pointLabel: pt.pointLabel,
            appliedLoad: pt.appliedLoad,
            indicatedValue: round(pt.appliedLoad + drift, 4)
          };
        })
      },
      repeatability: {
        appliedLoad: repLoad,
        rows: [
          { runNumber: 1, appliedLoad: repLoad, indicatedValue: round(repLoad + 0.001, 3) },
          { runNumber: 2, appliedLoad: repLoad, indicatedValue: repLoad },
          { runNumber: 3, appliedLoad: repLoad, indicatedValue: round(repLoad + 0.001, 3) },
          { runNumber: 4, appliedLoad: repLoad, indicatedValue: round(repLoad + 0.001, 3) },
          { runNumber: 5, appliedLoad: repLoad, indicatedValue: round(repLoad + 0.002, 3) }
        ]
      }
    });
  };

  // Calculations for live feedback
  const zeroIndicated = parseFloat(tests.zeroTest?.zeroIndicated ?? 0) || 0;
  const zeroError = round(zeroIndicated - 0, 5);
  const zeroMpe = round(0.25 * e, 5);
  const zeroPass = Math.abs(zeroError) <= zeroMpe + epsilon;

  const tareApp = parseFloat(tests.zeroTest?.tareApplied ?? 0) || 0;
  const tareInd = parseFloat(tests.zeroTest?.tareIndicated ?? 0) || 0;
  const tareError = round(tareInd - tareApp, 5);
  const tareMpe = getMPE(tareApp, e, accuracyClass, capacity);
  const tarePass = Math.abs(tareError) <= tareMpe + epsilon;

  // Center row of eccentricity
  const eccRows = tests.eccentricity?.rows || [];
  const centerIndicated = eccRows.length > 0 ? parseFloat(eccRows[0]?.indicatedValue || 0) : 0;

  // Repeatability calculation
  const repRows = tests.repeatability?.rows || [];
  const repValues = repRows.map(r => parseFloat(r.indicatedValue || 0)).filter(v => !isNaN(v));
  const repMax = repValues.length > 0 ? Math.max(...repValues) : 0;
  const repMin = repValues.length > 0 ? Math.min(...repValues) : 0;
  const repRange = round(repMax - repMin, 5);
  const repLoad = parseFloat(repRows[0]?.appliedLoad || (capacity * 0.5));
  const repMpe = getMPE(repLoad, e, accuracyClass, capacity);
  const repPass = repRange <= repMpe + epsilon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Step 3 — Metrology Test Observations</h2>
          <p className="text-xs text-slate-500">
            Real-time auto-calculation of errors, mpe thresholds, and compliance per OIML R 76.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePreFillCompliant}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Sparkles size={14} className="text-emerald-600" />
          Fill Compliant Test Readings
        </button>
      </div>

      {/* ======================================================== */}
      {/* TEST 1: ZERO-SETTING AND TARE TEST                       */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="text-sm font-bold text-slate-900">Zero-Setting & Tare Device Test (Clause 4.5)</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Zero Limit: ±0.25e (±{zeroMpe} kg)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zero Indication */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-800">Initial Zero-Setting (No Load)</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-slate-500 block mb-0.5">Applied (kg)</label>
                <input type="text" disabled value="0.000" className="w-full bg-slate-200/80 px-2 py-1.5 rounded font-mono text-slate-700" />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-0.5">Indicated (kg)</label>
                <input
                  type="text"
                  value={tests.zeroTest?.zeroIndicated ?? ''}
                  onChange={(e) => handleZeroChange('zeroIndicated', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-2 py-1.5 rounded font-mono text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5">Error (kg)</label>
                <div className="flex items-center justify-between px-2 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs">
                  <span>{zeroError > 0 ? `+${zeroError}` : zeroError}</span>
                  {zeroPass ? <CheckCircle2 size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-red-600" />}
                </div>
              </div>
            </div>
          </div>

          {/* Tare Indication */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-800">Tare Mechanism Operation</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-0.5">Tare Load (kg)</label>
                <input
                  type="text"
                  value={tests.zeroTest?.tareApplied ?? ''}
                  onChange={(e) => handleZeroChange('tareApplied', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-2 py-1.5 rounded font-mono text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-0.5">Net Indicated</label>
                <input
                  type="text"
                  value={tests.zeroTest?.tareIndicated ?? ''}
                  onChange={(e) => handleZeroChange('tareIndicated', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-2 py-1.5 rounded font-mono text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5">Tare Error</label>
                <div className="flex items-center justify-between px-2 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs">
                  <span>{tareError > 0 ? `+${tareError}` : tareError}</span>
                  {tarePass ? <CheckCircle2 size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-red-600" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TEST 2: ECCENTRICITY TEST (POSITIONS 1–5)                */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="text-sm font-bold text-slate-900">Eccentricity Test (Clause 3.6.2) — Load: 1/3 Max</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Positions: 1=Center, 2=FL, 3=BL, 4=BR, 5=FR
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Applied Load (kg)</th>
                <th className="py-2.5 px-3">Indicated Value (kg)</th>
                <th className="py-2.5 px-3">Error (I − L)</th>
                <th className="py-2.5 px-3">Deviation from Center</th>
                <th className="py-2.5 px-3">mpe</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(tests.eccentricity?.rows || []).map((row, idx) => {
                const applied = parseFloat(row.appliedLoad || 0);
                const indicated = parseFloat(row.indicatedValue || 0);
                const error = round(indicated - applied, 5);
                const devFromCenter = round(Math.abs(indicated - centerIndicated), 5);
                const mpe = getMPE(applied, e, accuracyClass, capacity);
                const rowPass = Math.abs(error) <= mpe + epsilon && devFromCenter <= mpe + epsilon;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">
                      {row.positionName || `Position ${idx + 1}`}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.appliedLoad ?? ''}
                        onChange={(e) => handleEccentricityRowChange(idx, 'appliedLoad', e.target.value)}
                        className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.indicatedValue ?? ''}
                        onChange={(e) => handleEccentricityRowChange(idx, 'indicatedValue', e.target.value)}
                        className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <span className={error === 0 ? 'text-slate-600' : Math.abs(error) <= mpe ? 'text-emerald-700' : 'text-red-700 font-bold'}>
                        {error > 0 ? `+${error}` : error}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={devFromCenter <= mpe ? 'text-slate-700' : 'text-red-700 font-bold'}>
                        {devFromCenter}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      ±{mpe}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {rowPass ? (
                        <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <XCircle size={12} /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TEST 3: WEIGHING TESTS (INCREASING & DECREASING)         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">3</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weighing Performance Test (Clause 3.5.1)</h3>
              <p className="text-[11px] text-slate-500">Checkpoints: Min, 500e, 2000e, 50% Max, Max (Increasing & Decreasing)</p>
            </div>
          </div>
        </div>

        {/* Increasing Loads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <span>Increasing Loads (Load ↑)</span>
            </h4>
            <button
              type="button"
              onClick={() => addWeighingRow('increasing')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus size={13} /> Add Load Step
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Step / Description</th>
                  <th className="py-2 px-3">Applied Load (kg)</th>
                  <th className="py-2 px-3">Indicated Value (kg)</th>
                  <th className="py-2 px-3">Error (I − L)</th>
                  <th className="py-2 px-3">mpe Rule</th>
                  <th className="py-2 px-3">mpe (kg)</th>
                  <th className="py-2 px-3 text-center">Verdict</th>
                  <th className="py-2 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(tests.weighing?.increasing || []).map((row, idx) => {
                  const applied = parseFloat(row.appliedLoad || 0);
                  const indicated = parseFloat(row.indicatedValue || 0);
                  const error = round(indicated - applied, 5);
                  const mpeValue = getMPE(applied, e, accuracyClass, capacity);
                  const { limitDescription } = getMPEDetails(applied, e, accuracyClass, capacity);
                  const rowPass = Math.abs(error) <= mpeValue + epsilon;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-sans">
                        <input
                          type="text"
                          value={row.pointLabel || ''}
                          onChange={(e) => handleWeighingRowChange('increasing', idx, 'pointLabel', e.target.value)}
                          className="w-36 bg-white border border-slate-200 px-2 py-1 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.appliedLoad ?? ''}
                          onChange={(e) => handleWeighingRowChange('increasing', idx, 'appliedLoad', e.target.value)}
                          className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.indicatedValue ?? ''}
                          onChange={(e) => handleWeighingRowChange('increasing', idx, 'indicatedValue', e.target.value)}
                          className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className={error === 0 ? 'text-slate-600' : rowPass ? 'text-emerald-700' : 'text-red-700 font-bold'}>
                          {error > 0 ? `+${error}` : error}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">
                        {limitDescription}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        ±{mpeValue}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {rowPass ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={12} /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <XCircle size={12} /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {(tests.weighing?.increasing || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeWeighingRow('increasing', idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decreasing Loads */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <span>Decreasing Loads (Load ↓)</span>
            </h4>
            <button
              type="button"
              onClick={() => addWeighingRow('decreasing')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus size={13} /> Add Load Step
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Step / Description</th>
                  <th className="py-2 px-3">Applied Load (kg)</th>
                  <th className="py-2 px-3">Indicated Value (kg)</th>
                  <th className="py-2 px-3">Error (I − L)</th>
                  <th className="py-2 px-3">mpe Rule</th>
                  <th className="py-2 px-3">mpe (kg)</th>
                  <th className="py-2 px-3 text-center">Verdict</th>
                  <th className="py-2 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(tests.weighing?.decreasing || []).map((row, idx) => {
                  const applied = parseFloat(row.appliedLoad || 0);
                  const indicated = parseFloat(row.indicatedValue || 0);
                  const error = round(indicated - applied, 5);
                  const mpeValue = getMPE(applied, e, accuracyClass, capacity);
                  const { limitDescription } = getMPEDetails(applied, e, accuracyClass, capacity);
                  const rowPass = Math.abs(error) <= mpeValue + epsilon;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-sans">
                        <input
                          type="text"
                          value={row.pointLabel || ''}
                          onChange={(e) => handleWeighingRowChange('decreasing', idx, 'pointLabel', e.target.value)}
                          className="w-36 bg-white border border-slate-200 px-2 py-1 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.appliedLoad ?? ''}
                          onChange={(e) => handleWeighingRowChange('decreasing', idx, 'appliedLoad', e.target.value)}
                          className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.indicatedValue ?? ''}
                          onChange={(e) => handleWeighingRowChange('decreasing', idx, 'indicatedValue', e.target.value)}
                          className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className={error === 0 ? 'text-slate-600' : rowPass ? 'text-emerald-700' : 'text-red-700 font-bold'}>
                          {error > 0 ? `+${error}` : error}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">
                        {limitDescription}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        ±{mpeValue}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {rowPass ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={12} /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <XCircle size={12} /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {(tests.weighing?.decreasing || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeWeighingRow('decreasing', idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TEST 4: REPEATABILITY TEST (5 SUCCESSIVE RUNS)           */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">4</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Repeatability Test (Clause 3.6.1) — 5 Consecutive Readings</h3>
              <p className="text-[11px] text-slate-500">Condition: Max reading − Min reading must be ≤ mpe (±{repMpe} kg)</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-800">
              Range (Max − Min): {repRange} kg
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Run Cycle</th>
                <th className="py-2 px-3">Applied Load (kg)</th>
                <th className="py-2 px-3">Indicated Value (kg)</th>
                <th className="py-2 px-3">Error (kg)</th>
                <th className="py-2 px-3">Permissible Limit (mpe)</th>
                <th className="py-2 px-3 text-center">Cycle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(tests.repeatability?.rows || []).map((row, idx) => {
                const applied = parseFloat(row.appliedLoad || 0);
                const indicated = parseFloat(row.indicatedValue || 0);
                const error = round(indicated - applied, 5);
                const rowPass = Math.abs(error) <= repMpe + epsilon;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">
                      Run {row.runNumber || idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.appliedLoad ?? ''}
                        onChange={(e) => handleRepeatabilityRowChange(idx, 'appliedLoad', e.target.value)}
                        className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.indicatedValue ?? ''}
                        onChange={(e) => handleRepeatabilityRowChange(idx, 'indicatedValue', e.target.value)}
                        className="w-24 bg-white border border-slate-300 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <span className={error === 0 ? 'text-slate-600' : rowPass ? 'text-emerald-700' : 'text-red-700 font-bold'}>
                        {error > 0 ? `+${error}` : error}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      ±{repMpe}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {rowPass ? (
                        <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <XCircle size={12} /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Repeatability verdict banner */}
        <div className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
          repPass ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {repPass ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-600" />}
            <span>
              <strong>Repeatability Overall Verdict:</strong> {repPass ? 'Compliant' : 'Non-compliant'} (Range: {repRange} kg vs mpe: {repMpe} kg)
            </span>
          </div>
          <span className="font-bold uppercase tracking-wider">{repPass ? 'PASS' : 'FAIL'}</span>
        </div>
      </div>
    </div>
  );
}
