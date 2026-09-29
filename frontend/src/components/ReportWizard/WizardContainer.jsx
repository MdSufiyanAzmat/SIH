import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Step1Instrument } from './Step1Instrument';
import { Step2Environment } from './Step2Environment';
import { Step3Observations } from './Step3Observations';
import { Step4Attachments } from './Step4Attachments';
import { evaluateAllTests, round } from '../../utils/metrologyCalc';
import { loadDraft, saveDraft, clearDraft } from '../../utils/draftStorage';
import { apiUrl } from '../../utils/api';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle,
  Eye,
  RotateCcw,
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';

export function WizardContainer({ initialReport, onSaveSuccess, onCancel }) {
  const { token, user } = useAuth();
  const [activeReportId, setActiveReportId] = useState(() => initialReport?.id ? String(initialReport.id) : 'new');
  const [submitting, setSubmitting] = useState(false);
  const [saveDraftMessage, setSaveDraftMessage] = useState('');
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(null);
  const [restoredBanner, setRestoredBanner] = useState(false);
  const isFirstMount = useRef(true);

  // Check if saved draft exists in localStorage for this reportId
  const cachedDraft = loadDraft(activeReportId);

  // 1. Current Step
  const [currentStep, setCurrentStep] = useState(() => {
    if (cachedDraft?.currentStep) {
      return cachedDraft.currentStep;
    }
    return 1;
  });

  // 2. Instrument Details State
  const [instrument, setInstrument] = useState(() => {
    if (cachedDraft?.instrument) {
      return cachedDraft.instrument;
    }
    if (initialReport?.data?.instrument) {
      return initialReport.data.instrument;
    }
    return {
      manufacturer: '',
      model: '',
      serialNumber: '',
      capacity: '15',
      verificationInterval: '0.005',
      accuracyClass: 'Class III',
      type: 'Electronic Platform',
      minCapacity: '0.1'
    };
  });

  // 3. Laboratory & Environment State
  const [environment, setEnvironment] = useState(() => {
    if (cachedDraft?.environment) {
      return cachedDraft.environment;
    }
    if (initialReport?.data?.environment) {
      return initialReport.data.environment;
    }
    return {
      labName: 'National Legal Metrology Laboratory (NLML)',
      date: new Date().toISOString().split('T')[0],
      testerName: user?.name || '',
      temperature: '21.5',
      humidity: '50',
      pressure: '1013.25'
    };
  });

  // 4. Test Observations State
  const [tests, setTests] = useState(() => {
    if (cachedDraft?.tests) {
      return cachedDraft.tests;
    }
    if (initialReport?.data?.tests) {
      return initialReport.data.tests;
    }
    return {};
  });

  // 5. Attachments State
  const [attachments, setAttachments] = useState(() => {
    if (cachedDraft?.attachments) {
      return cachedDraft.attachments;
    }
    if (initialReport?.data?.attachments) {
      return initialReport.data.attachments;
    }
    return [];
  });

  // 6. Notes State
  const [notes, setNotes] = useState(() => {
    if (cachedDraft?.notes !== undefined) {
      return cachedDraft.notes;
    }
    if (initialReport?.data?.notes !== undefined) {
      return initialReport.data.notes;
    }
    return '';
  });

  // Check if draft was restored on mount
  useEffect(() => {
    if (cachedDraft && (cachedDraft.instrument || cachedDraft.environment || cachedDraft.tests)) {
      setRestoredBanner(true);
      if (cachedDraft.updatedAt) {
        setLastAutoSavedAt(new Date(cachedDraft.updatedAt).toLocaleTimeString());
      }
    }
  }, []);

  // Keep testerName synced with logged-in user if empty
  useEffect(() => {
    if (!environment.testerName && user?.name) {
      setEnvironment(prev => ({ ...prev, testerName: user.name }));
    }
  }, [user]);

  // AUTO-SAVE to localStorage keyed by activeReportId whenever any field changes
  useEffect(() => {
    // Avoid double-saving initial state immediately on first tick
    const timer = setTimeout(() => {
      const draftPayload = {
        currentStep,
        instrument,
        environment,
        tests,
        attachments,
        notes
      };
      saveDraft(activeReportId, draftPayload);
      setLastAutoSavedAt(new Date().toLocaleTimeString());
    }, 400);

    return () => clearTimeout(timer);
  }, [currentStep, instrument, environment, tests, attachments, notes, activeReportId]);

  // Live client-side calculation
  const evaluation = evaluateAllTests(instrument, tests);

  // Validation checks
  const getValidationErrors = () => {
    const errors = [];
    if (!instrument.manufacturer?.trim()) errors.push('Instrument Manufacturer is required.');
    if (!instrument.model?.trim()) errors.push('Instrument Model is required.');
    if (!instrument.serialNumber?.trim()) errors.push('Instrument Serial Number is required.');
    if (!instrument.capacity || parseFloat(instrument.capacity) <= 0) errors.push('Valid Max Capacity is required.');
    if (!instrument.verificationInterval || parseFloat(instrument.verificationInterval) <= 0) errors.push('Valid scale interval (e) is required.');

    if (!environment.labName?.trim()) errors.push('Laboratory Name is required.');
    if (!environment.testerName?.trim()) errors.push('Testing Officer / Metrologist name is required.');
    if (environment.temperature === '' || isNaN(parseFloat(environment.temperature))) errors.push('Valid temperature reading is required.');
    if (environment.humidity === '' || isNaN(parseFloat(environment.humidity))) errors.push('Valid humidity reading is required.');

    // Check test observations for empty rows
    const zeroInd = tests.zeroTest?.zeroIndicated;
    if (zeroInd === undefined || zeroInd === '' || isNaN(parseFloat(zeroInd))) {
      errors.push('Zero-setting observation value is required.');
    }

    const eccRows = tests.eccentricity?.rows || [];
    if (eccRows.length < 5 || eccRows.some(r => r.indicatedValue === '' || isNaN(parseFloat(r.indicatedValue)))) {
      errors.push('All 5 Eccentricity test position readings must be entered.');
    }

    const incRows = tests.weighing?.increasing || [];
    const decRows = tests.weighing?.decreasing || [];
    if (incRows.length === 0 || incRows.some(r => r.indicatedValue === '' || isNaN(parseFloat(r.indicatedValue)))) {
      errors.push('All Increasing Weighing test readings must be entered.');
    }
    if (decRows.length === 0 || decRows.some(r => r.indicatedValue === '' || isNaN(parseFloat(r.indicatedValue)))) {
      errors.push('All Decreasing Weighing test readings must be entered.');
    }

    const repRows = tests.repeatability?.rows || [];
    if (repRows.length < 5 || repRows.some(r => r.indicatedValue === '' || isNaN(parseFloat(r.indicatedValue)))) {
      errors.push('All 5 Repeatability test runs must be entered.');
    }

    return errors;
  };

  const validationErrors = getValidationErrors();

  // Reset Draft action
  const handleResetDraft = () => {
    if (window.confirm('Are you sure you want to clear this auto-saved draft and reset to default values?')) {
      clearDraft(activeReportId);
      setCurrentStep(1);
      setInstrument({
        manufacturer: '',
        model: '',
        serialNumber: '',
        capacity: '15',
        verificationInterval: '0.005',
        accuracyClass: 'Class III',
        type: 'Electronic Platform',
        minCapacity: '0.1'
      });
      setEnvironment({
        labName: 'National Legal Metrology Laboratory (NLML)',
        date: new Date().toISOString().split('T')[0],
        testerName: user?.name || '',
        temperature: '21.5',
        humidity: '50',
        pressure: '1013.25'
      });
      setTests({});
      setAttachments([]);
      setNotes('');
      setRestoredBanner(false);
      setSaveDraftMessage('Draft cleared');
      setTimeout(() => setSaveDraftMessage(''), 2500);
    }
  };

  const handleSaveReport = async (status = 'Completed') => {
    // If completing report, prevent generation if any required test row is empty
    if (status === 'Completed' && validationErrors.length > 0) {
      alert(`Cannot generate completed report due to missing requirements:\n\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        status,
        instrument,
        environment,
        tests,
        attachments,
        notes
      };

      const isEdit = Boolean(initialReport?.id || (activeReportId !== 'new' && !isNaN(Number(activeReportId))));
      const targetId = initialReport?.id || activeReportId;
      const url = isEdit ? apiUrl(`/api/reports/${targetId}`) : apiUrl('/api/reports');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save test report');
      }

      const savedReport = await res.json();

      if (status === 'Draft') {
        const newReportId = String(savedReport.id);
        // If this was a new draft, transfer localStorage key to the assigned numeric report ID
        if (activeReportId === 'new') {
          saveDraft(newReportId, {
            currentStep,
            instrument,
            environment,
            tests,
            attachments,
            notes
          });
          clearDraft('new');
          setActiveReportId(newReportId);
        } else {
          saveDraft(activeReportId, {
            currentStep,
            instrument,
            environment,
            tests,
            attachments,
            notes
          });
        }
        setSaveDraftMessage(`Report draft saved to database as ${savedReport.reportNumber || 'draft'}!`);
        setTimeout(() => setSaveDraftMessage(''), 3500);
      } else {
        // Once successfully completed, clear the local draft
        clearDraft(activeReportId);
        if (activeReportId !== 'new') {
          clearDraft(String(savedReport.id));
        }
        onSaveSuccess(savedReport);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving report');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Instrument Details', subtitle: 'Capacity & verification interval' },
    { number: 2, title: 'Lab & Environment', subtitle: 'Temperature & humidity conditions' },
    { number: 3, title: 'Test Observations', subtitle: 'Zero, Eccentricity, Weighing, Repeatability' },
    { number: 4, title: 'Attachments & Verdict', subtitle: 'Photos & final compliance check' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {initialReport?.id ? `Editing Report: ${initialReport.reportNumber}` : 'New Evaluation Report'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Draft ID: {activeReportId}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NAWI Type-Evaluation Wizard (OIML R 76)
          </h1>
        </div>

        {/* Action Controls & Auto-save Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Auto-save badge */}
          {lastAutoSavedAt && (
            <span
              title={`Draft automatically persisted in localStorage under key: nawi_draft_${activeReportId}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/90 border border-slate-200 px-2.5 py-1.5 rounded-lg"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auto-saved {lastAutoSavedAt}</span>
            </span>
          )}

          {saveDraftMessage && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fade">
              {saveDraftMessage}
            </span>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveReport('Draft')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <Save size={14} className="text-slate-500" />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={handleResetDraft}
            title="Clear saved draft from localStorage and reset fields"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
          >
            <Trash2 size={14} />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Restored from Draft Notice Banner */}
      {restoredBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs animate-fade shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              <strong>Draft Restored:</strong> All form fields have been restored exactly from your last auto-saved session (Draft Key: <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono">nawi_draft_{activeReportId}</code>).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRestoredBanner(false)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold ml-2 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Step Progress Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((st) => {
            const isActive = currentStep === st.number;
            const isCompleted = currentStep > st.number;
            return (
              <button
                key={st.number}
                type="button"
                onClick={() => setCurrentStep(st.number)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600/30'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? '✓' : st.number}
                  </span>
                  <span className={`text-xs font-bold ${isActive ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {st.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{st.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs min-h-[460px]">
        {currentStep === 1 && (
          <Step1Instrument
            data={instrument}
            onChange={(fields) => setInstrument(prev => ({ ...prev, ...fields }))}
          />
        )}

        {currentStep === 2 && (
          <Step2Environment
            data={environment}
            onChange={(fields) => setEnvironment(prev => ({ ...prev, ...fields }))}
          />
        )}

        {currentStep === 3 && (
          <Step3Observations
            instrument={instrument}
            tests={tests}
            onChange={(newTests) => setTests(newTests)}
          />
        )}

        {currentStep === 4 && (
          <Step4Attachments
            attachments={attachments}
            onChangeAttachments={setAttachments}
            notes={notes}
            onChangeNotes={setNotes}
            validationErrors={validationErrors}
            evaluation={evaluation}
          />
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> Previous Step
        </button>

        <div className="flex items-center gap-3">
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Next: Step {currentStep + 1} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSaveReport('Completed')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Generating Report...' : 'Finalize & Issue Test Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
