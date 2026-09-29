import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/api';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Plus
} from 'lucide-react';

export function Step4Attachments({
  attachments = [],
  onChangeAttachments,
  notes = '',
  onChangeNotes,
  validationErrors = [],
  evaluation
}) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e, type = 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FormData for `/api/upload`
    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    try {
      const res = await fetch(apiUrl('/api/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newAttachment = {
          url: data.url,
          name: file.name,
          caption: type === 'stamped_plate' ? 'Stamped Metrological Data Plate' : 'Instrument Front Overview',
          type
        };
        onChangeAttachments([...attachments, newAttachment]);
      } else {
        // Fallback to base64 if server upload encounters issue
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const newAttachment = {
            url: uploadEvent.target.result,
            name: file.name,
            caption: type === 'stamped_plate' ? 'Stamped Metrological Data Plate' : 'Instrument Front Overview',
            type
          };
          onChangeAttachments([...attachments, newAttachment]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback base64
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newAttachment = {
          url: uploadEvent.target.result,
          name: file.name,
          caption: type === 'stamped_plate' ? 'Stamped Metrological Data Plate' : 'Instrument Front Overview',
          type
        };
        onChangeAttachments([...attachments, newAttachment]);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    const list = [...attachments];
    list.splice(index, 1);
    onChangeAttachments(list);
  };

  const handleCaptionChange = (index, val) => {
    const list = [...attachments];
    list[index] = { ...list[index], caption: val };
    onChangeAttachments(list);
  };

  const isPass = evaluation?.overallPass;

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Step 4 — Photographic Evidence & Metrological Verdict</h2>
        <p className="text-xs text-slate-500">
          Attach verification plates, physical seal photos, and review final evaluation compliance.
        </p>
      </div>

      {/* Pre-submission Validation Checklist */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileCheck size={16} className="text-emerald-600" />
          Pre-Issuance Metrological Validation Check
        </h3>

        {validationErrors.length > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <XCircle size={15} className="text-red-600" />
              <span>Please resolve the following required items before completing report:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-red-700 pl-4 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>All required instrument characteristics and test observations have been completed and verified.</span>
          </div>
        )}

        {/* Live Verdict Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isPass ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-red-600 text-white border-red-700 shadow-sm'
        }`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Computed Overall Verdict per OIML R 76
            </span>
            <div className="text-xl font-extrabold tracking-tight mt-0.5">
              {isPass ? 'PASS — COMPLIANT WITH OIML R 76-1' : 'FAIL — NON-COMPLIANT (EXCEEDS MPE)'}
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isPass
                ? 'All tested points (zero, eccentricity, weighing, repeatability) satisfy legal tolerances.'
                : 'One or more observations exceed maximum permissible error (mpe) or repeatability criteria.'}
            </p>
          </div>
          <div className="hidden sm:block text-3xl font-black px-4 py-1 rounded-lg bg-black/20">
            {isPass ? 'PASS' : 'FAIL'}
          </div>
        </div>
      </div>

      {/* Uploads Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Photographic Evidence</h3>
          <span className="text-xs text-slate-500">Stored locally in laboratory system</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Upload Box 1: Instrument Overview */}
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'photo')}
            />
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 transition-colors mb-2">
              <Upload size={18} />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              Upload Instrument Overview Photo
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Shows platter, load receptor & main display
            </span>
          </label>

          {/* Upload Box 2: Stamped Data Plate */}
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'stamped_plate')}
            />
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 transition-colors mb-2">
              <ImageIcon size={18} />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              Upload Stamped Data Plate Photo
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Displays Max, Min, e, Class and official seals
            </span>
          </label>
        </div>

        {uploading && (
          <div className="text-center text-xs text-slate-500 py-2">
            Uploading attachment...
          </div>
        )}

        {/* Uploaded Gallery */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-2">
                <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {att.url ? (
                    <img
                      src={att.url.startsWith('http') || att.url.startsWith('data:') ? att.url : apiUrl(att.url)}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <ImageIcon size={32} />
                      <span className="text-[11px] mt-1">Photo Attached</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    {att.type === 'stamped_plate' ? 'Stamped Plate' : 'Instrument'}
                  </div>
                  <input
                    type="text"
                    value={att.caption || ''}
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    placeholder="Caption / Description..."
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrological Remarks & Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Metrological Remarks, Observations & Recommendations
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="e.g. Instrument leveling spirit bubble checked. Initial zero tracking deactivated during tests. All test standard weights are calibrated traceable to national standards..."
          className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
