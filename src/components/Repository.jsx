import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportReportToDocx } from '../utils/docxExport';
import {
  Search,
  Calendar,
  FileCheck,
  FileDown,
  Download,
  Eye,
  Filter,
  RotateCcw,
  Scale
} from 'lucide-react';

export function Repository({ onPreviewReport }) {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('All');
  const [status, setStatus] = useState('All');

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = '/api/reports?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (startDate) url += `startDate=${encodeURIComponent(startDate)}&`;
      if (endDate) url += `endDate=${encodeURIComponent(endDate)}&`;
      if (status !== 'All') url += `status=${encodeURIComponent(status)}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let list = data.reports || [];
        if (accuracyClass !== 'All') {
          list = list.filter(r => r.accuracyClass === accuracyClass);
        }
        setReports(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [searchQuery, startDate, endDate, accuracyClass, status]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setAccuracyClass('All');
    setStatus('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Scale size={26} className="text-emerald-600" />
          Metrology Report Repository & Search
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Historical repository of all OIML R 76 Non-Automatic Weighing Instrument evaluation reports with instant search and download links.
        </p>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Filter size={16} className="text-emerald-600" />
            <span>Search & Query Filters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <RotateCcw size={13} />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* General Search */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Search by Manufacturer / Model / Serial No / Report No
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Mettler Toledo, MT-2026, LAB/R76..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Accuracy Class */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Accuracy Class
            </label>
            <select
              value={accuracyClass}
              onChange={(e) => setAccuracyClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Accuracy Classes</option>
              <option value="Class I">Class I (Special)</option>
              <option value="Class II">Class II (High)</option>
              <option value="Class III">Class III (Medium)</option>
              <option value="Class IIII">Class IIII (Ordinary)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Report Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed Reports</option>
              <option value="Draft">Drafts Only</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date Tested (From)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date Tested (To)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Stored Evaluations ({reports.length})
          </span>
          <span className="text-xs text-slate-500">
            Click any row to open full legal certificate
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Searching records...</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No reports matching your search criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Report No.</th>
                  <th className="py-3 px-4">Instrument Specification</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Date Tested</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4 text-center">Export Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onPreviewReport(r)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                      {r.reportNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{r.manufacturer} - {r.model}</div>
                      <div className="text-xs text-slate-500">Max: {r.capacity} kg | e = {r.verificationInterval} kg</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {r.serialNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                        {r.accuracyClass || 'Class III'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {r.testDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} verdict={r.verdict} />
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => exportReportToPDF(r)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 transition-colors"
                          title="Download Official PDF Report"
                        >
                          <Download size={13} />
                          PDF
                        </button>
                        <button
                          onClick={() => exportReportToDocx(r)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                          title="Download Word Document"
                        >
                          <FileDown size={13} />
                          DOCX
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
