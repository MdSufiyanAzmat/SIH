import React from 'react';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportReportToDocx } from '../utils/docxExport';
import { StatusBadge } from './StatusBadge';
import {
  Download,
  FileDown,
  Printer,
  Edit,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Scale,
  Award,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';

export function ReportPreview({ report, onBack, onEdit }) {
  const data = report?.data || {};
  const inst = data.instrument || {};
  const env = data.environment || {};
  const tests = data.tests || {};
  const evalResults = data.evaluation || {};
  const attachments = data.attachments || [];
  const isPass = report?.verdict === 'PASS' || evalResults.overallPass;

  const nVal = (inst.capacity && inst.verificationInterval)
    ? Math.round(inst.capacity / inst.verificationInterval)
    : 'N/A';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-20 z-30">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Edit size={14} /> Edit Report
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Printer size={14} /> Print
          </button>

          <button
            onClick={() => exportReportToPDF(report)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Download size={14} /> Export PDF
          </button>

          <button
            onClick={() => exportReportToDocx(report)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <FileDown size={14} /> Export Word (.docx)
          </button>
        </div>
      </div>

      {/* Printable Certificate Layout */}
      <div className="print-page bg-white rounded-xl border border-slate-300 p-8 sm:p-12 shadow-sm space-y-8 text-slate-900">
        {/* Certificate Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <Scale size={32} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                International Recommendation OIML R 76-1: 2006 (E)
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                TYPE EVALUATION TEST REPORT
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Authorized Legal Metrology Assessment for Non-Automatic Weighing Instruments (NAWI)
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                Facility: {env.labName || 'National Legal Metrology Laboratory'}
              </p>
            </div>
          </div>

          <div className="text-right md:min-w-[200px] flex flex-col items-start md:items-end justify-between">
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-left w-full sm:w-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Report Certificate No.</div>
              <div className="text-sm font-black font-mono text-slate-900 mt-0.5">{report.reportNumber}</div>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>Issue Date: {env.date || report.testDate || report.createdAt?.split('T')[0]}</span>
              </div>
            </div>
            <div className="mt-2">
              <StatusBadge status={report.status} verdict={report.verdict} size="md" />
            </div>
          </div>
        </div>

        {/* Overall Verdict Banner */}
        <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
          isPass
            ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
            : 'bg-red-50 border-red-600 text-red-950'
        }`}>
          <div className="flex items-center gap-3">
            {isPass ? (
              <CheckCircle2 size={32} className="text-emerald-600 shrink-0" />
            ) : (
              <XCircle size={32} className="text-red-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                Overall Metrological Verdict
              </div>
              <div className="text-lg font-black tracking-tight">
                {isPass ? 'COMPLIANT — PASS' : 'NON-COMPLIANT — FAIL'}
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                {isPass
                  ? 'All evaluated test items (Zero-setting, Tare, Eccentricity, Weighing performance, Repeatability) conform to OIML R 76-1: 2006.'
                  : 'Instrument exceeds maximum permissible error (mpe) or repeatability tolerances defined in OIML R 76-1: 2006.'}
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-2xl font-black font-mono tracking-wider px-4 py-1 rounded bg-white/70 border border-current">
            {isPass ? 'PASS' : 'FAIL'}
          </div>
        </div>

        {/* Section 1: Instrument Characteristics */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            Instrument Identification & Metrological Specifications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Manufacturer</span>
              <span className="font-semibold text-slate-900">{inst.manufacturer || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Model Designation</span>
              <span className="font-semibold text-slate-900">{inst.model || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Serial Number</span>
              <span className="font-mono font-semibold text-slate-900">{inst.serialNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Instrument Type</span>
              <span className="font-semibold text-slate-900">{inst.type || 'Platform'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Accuracy Class</span>
              <span className="font-bold text-slate-900">{inst.accuracyClass || 'Class III'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Max Capacity (Max)</span>
              <span className="font-mono font-semibold text-slate-900">{inst.capacity} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Scale Interval (e)</span>
              <span className="font-mono font-semibold text-slate-900">{inst.verificationInterval} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Scale Intervals (n)</span>
              <span className="font-mono font-semibold text-slate-900">{nVal}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Laboratory & Environment */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            Environmental Test Conditions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Ambient Temperature</span>
              <span className="font-mono font-semibold text-slate-900">
                {env.temperature ?? '21.5'} °C
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {env.temperature >= 15 && env.temperature <= 35 ? '✓ Compliant (15–35°C)' : '⚠️ Warning: Outside 15–35°C'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Relative Humidity</span>
              <span className="font-mono font-semibold text-slate-900">
                {env.humidity ?? '50'} %
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {env.humidity <= 80 ? '✓ Compliant (≤ 80%)' : '⚠️ Warning: Exceeds 80%'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Atmospheric Pressure</span>
              <span className="font-mono font-semibold text-slate-900">{env.pressure || '1013.25'} hPa</span>
            </div>
            <div>
              <span className="text-slate-500 block">Testing Officer</span>
              <span className="font-semibold text-slate-900">{env.testerName || report.userName || 'Alex Vance'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Test 1 - Zero-Setting and Tare */}
        <div className="space-y-3 avoid-break">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
            Zero-Setting & Tare Device Test (OIML R 76-1 Clause 4.5)
          </h2>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Test Stage</th>
                <th className="py-2.5 px-3">Applied Load</th>
                <th className="py-2.5 px-3">Indicated Value</th>
                <th className="py-2.5 px-3">Calculated Error</th>
                <th className="py-2.5 px-3">mpe Tolerance</th>
                <th className="py-2.5 px-3 text-center">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Initial Zero-Setting (No Load)</td>
                <td className="py-2.5 px-3">0.000 kg</td>
                <td className="py-2.5 px-3">{tests.zeroTest?.zeroIndicated ?? 0} kg</td>
                <td className="py-2.5 px-3">{evalResults.zeroTest?.zeroError ?? 0} kg</td>
                <td className="py-2.5 px-3 text-slate-600">±{evalResults.zeroTest?.zeroMpe ?? (0.25 * (inst.verificationInterval || 0.005))} kg (±0.25e)</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded ${
                    evalResults.zeroTest?.zeroPass !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {evalResults.zeroTest?.zeroPass !== false ? 'PASS' : 'FAIL'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Tare Mechanism Performance</td>
                <td className="py-2.5 px-3">{tests.zeroTest?.tareApplied ?? 0} kg</td>
                <td className="py-2.5 px-3">{tests.zeroTest?.tareIndicated ?? 0} kg</td>
                <td className="py-2.5 px-3">{evalResults.zeroTest?.tareError ?? 0} kg</td>
                <td className="py-2.5 px-3 text-slate-600">±{evalResults.zeroTest?.tareMpe ?? 0} kg</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded ${
                    evalResults.zeroTest?.tarePass !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {evalResults.zeroTest?.tarePass !== false ? 'PASS' : 'FAIL'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Test 2 - Eccentricity Test */}
        <div className="space-y-3 avoid-break">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
            Eccentricity Test Observations (OIML R 76-1 Clause 3.6.2)
          </h2>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Applied Load</th>
                <th className="py-2.5 px-3">Indicated Value</th>
                <th className="py-2.5 px-3">Error (I − L)</th>
                <th className="py-2.5 px-3">Dev. from Center</th>
                <th className="py-2.5 px-3">mpe Limit</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(evalResults.eccentricity?.rows || tests.eccentricity?.rows || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                    {row.positionName || `Position ${row.position}`}
                  </td>
                  <td className="py-2.5 px-3">{row.appliedLoad} kg</td>
                  <td className="py-2.5 px-3 font-semibold">{row.indicatedValue} kg</td>
                  <td className="py-2.5 px-3">{row.error > 0 ? `+${row.error}` : row.error} kg</td>
                  <td className="py-2.5 px-3">{row.devFromCenter ?? 0} kg</td>
                  <td className="py-2.5 px-3 text-slate-600">±{row.mpe || evalResults.eccentricity?.mpe} kg</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded ${
                      row.pass !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {row.pass !== false ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5: Test 3 - Weighing Performance Test */}
        <div className="space-y-3 avoid-break">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">5</span>
            Weighing Performance Test (Increasing & Decreasing Loads)
          </h2>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Test Checkpoint</th>
                <th className="py-2.5 px-3">Applied Load</th>
                <th className="py-2.5 px-3">Indicated Value</th>
                <th className="py-2.5 px-3">Error (I − L)</th>
                <th className="py-2.5 px-3">mpe Rule & Limit</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(evalResults.weighing?.increasingRows || tests.weighing?.increasing || []).map((row, idx) => (
                <tr key={`inc-${idx}`} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-sans font-semibold text-blue-700">Increasing (↑)</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{row.pointLabel || `Point ${idx + 1}`}</td>
                  <td className="py-2.5 px-3">{row.appliedLoad} kg</td>
                  <td className="py-2.5 px-3 font-semibold">{row.indicatedValue} kg</td>
                  <td className="py-2.5 px-3">{row.error > 0 ? `+${row.error}` : row.error} kg</td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">
                    ±{row.mpe} kg <span className="text-[10px] text-slate-400">({row.mpeRule || row.limitDescription || 'Table 6'})</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded ${
                      row.pass !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {row.pass !== false ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
              {(evalResults.weighing?.decreasingRows || tests.weighing?.decreasing || []).map((row, idx) => (
                <tr key={`dec-${idx}`} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-sans font-semibold text-purple-700">Decreasing (↓)</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{row.pointLabel || `Point ${idx + 1}`}</td>
                  <td className="py-2.5 px-3">{row.appliedLoad} kg</td>
                  <td className="py-2.5 px-3 font-semibold">{row.indicatedValue} kg</td>
                  <td className="py-2.5 px-3">{row.error > 0 ? `+${row.error}` : row.error} kg</td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">
                    ±{row.mpe} kg <span className="text-[10px] text-slate-400">({row.mpeRule || row.limitDescription || 'Table 6'})</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded ${
                      row.pass !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {row.pass !== false ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 6: Test 4 - Repeatability Test */}
        <div className="space-y-3 avoid-break">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">6</span>
              Repeatability Test (5 Cycles at {tests.repeatability?.appliedLoad || tests.repeatability?.rows?.[0]?.appliedLoad} kg)
            </h2>
            <span className="text-xs font-mono font-semibold text-slate-700">
              Range (Max − Min): {evalResults.repeatability?.range ?? 0} kg | Limit: ±{evalResults.repeatability?.mpe ?? 0} kg
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Run Cycle</th>
                <th className="py-2.5 px-3">Applied Test Load</th>
                <th className="py-2.5 px-3">Indicated Value</th>
                <th className="py-2.5 px-3">Error (I − L)</th>
                <th className="py-2.5 px-3">mpe Limit</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(evalResults.repeatability?.rows || tests.repeatability?.rows || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                    Cycle Run {row.runNumber || idx + 1}
                  </td>
                  <td className="py-2.5 px-3">{row.appliedLoad} kg</td>
                  <td className="py-2.5 px-3 font-semibold">{row.indicatedValue} kg</td>
                  <td className="py-2.5 px-3">{row.error > 0 ? `+${row.error}` : row.error} kg</td>
                  <td className="py-2.5 px-3 text-slate-600">±{evalResults.repeatability?.mpe} kg</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded ${
                      row.pass !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {row.pass !== false ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 7: Photographic Evidence (if attached) */}
        {attachments.length > 0 && (
          <div className="space-y-3 avoid-break">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">7</span>
              Photographic Attachments & Stamped Seals
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {attachments.map((att, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-2 bg-slate-50 text-center space-y-1.5">
                  <div className="h-44 bg-slate-200 rounded flex items-center justify-center overflow-hidden">
                    {att.url ? (
                      <img src={att.url} alt={att.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">Attached Photo</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{att.caption || att.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 8: Metrological Remarks */}
        {data.notes && (
          <div className="space-y-1 avoid-break bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700">Remarks & Special Observations:</h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Section 9: Formal Metrology Signatures */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-8 avoid-break text-xs">
          <div className="border border-slate-300 rounded-lg p-4 space-y-3">
            <div className="font-bold uppercase tracking-wider text-slate-800">
              Verified & Tested By (Authorized Metrologist):
            </div>
            <div className="space-y-1">
              <div>Name: <strong className="text-slate-900">{env.testerName || report.userName || 'Alex Vance'}</strong></div>
              <div>Title: Verification Officer / Metrologist</div>
              <div>Date: {env.date || report.testDate || new Date().toISOString().split('T')[0]}</div>
              <div className="pt-4 text-slate-400">Signature: ____________________________________</div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg p-4 space-y-3">
            <div className="font-bold uppercase tracking-wider text-slate-800">
              Approved by Technical Manager / Director:
            </div>
            <div className="space-y-1">
              <div>Name: <strong className="text-slate-900">Dr. Evelyn Reed</strong></div>
              <div>Title: Chief Metrologist & Laboratory Director</div>
              <div>Official Seal / Date: ______________________________</div>
              <div className="pt-4 text-slate-400">Signature: ____________________________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
