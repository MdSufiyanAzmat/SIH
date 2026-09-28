import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportReportToDocx } from '../utils/docxExport';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit,
  Download,
  Trash2,
  RefreshCw,
  FileDown
} from 'lucide-react';

export function Dashboard({ onNewReport, onEditReport, onPreviewReport }) {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, draft: 0, failed: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verdictFilter, setVerdictFilter] = useState('All');

  const fetchReportsAndStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/reports/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Reports
      let url = '/api/reports?';
      if (searchTerm) url += `q=${encodeURIComponent(searchTerm)}&`;
      if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (verdictFilter !== 'All') url += `verdict=${encodeURIComponent(verdictFilter)}&`;

      const repRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData.reports || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndStats();
  }, [searchTerm, statusFilter, verdictFilter]);

  const handleDelete = async (e, reportId, reportNumber) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete test report ${reportNumber}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchReportsAndStats();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Metrology Test Reports Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'Admin'
              ? 'Administrator Overview: All NAWI OIML R 76 evaluation certificates across the laboratory'
              : `Verification Officer Workspace: Viewing reports issued by ${user?.name}`}
          </p>
        </div>
        <button
          onClick={onNewReport}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm self-start sm:self-auto"
        >
          <PlusCircle size={18} />
          Create Test Report
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Reports</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-xs text-slate-400 mt-0.5">All registered tests</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText size={24} />
          </div>
        </div>

        {/* Card 2: Completed / Passed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Completed (Pass)</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</h3>
            <p className="text-xs text-emerald-600/80 mt-0.5">Compliant with R 76</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Card 3: Drafts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Draft In-Progress</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{stats.draft}</h3>
            <p className="text-xs text-amber-600/80 mt-0.5">Saved evaluations</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Failed / Rejected</p>
            <h3 className="text-2xl font-bold text-red-700 mt-1">{stats.failed}</h3>
            <p className="text-xs text-red-600/80 mt-0.5">Exceeded mpe tolerances</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Reports Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Report No, Model, Manufacturer, Serial..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter size={13} /> Filter:
            </span>

            {['All', 'Completed', 'Draft'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}

            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Verdicts</option>
              <option value="PASS">PASS only</option>
              <option value="FAIL">FAIL only</option>
            </select>

            <button
              onClick={fetchReportsAndStats}
              title="Refresh"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading metrology reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-14 text-center">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-medium text-slate-700">No test reports found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No matching OIML R 76 evaluation reports were found. Click below to start a new instrument evaluation wizard.
              </p>
              <button
                onClick={onNewReport}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <PlusCircle size={14} /> Start New Test Report
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Report Number</th>
                  <th className="py-3.5 px-4">Instrument / Model</th>
                  <th className="py-3.5 px-4">Serial No.</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Tester / Officer</th>
                  <th className="py-3.5 px-4">Verdict</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => {
                      if (report.status === 'Draft') {
                        onEditReport(report);
                      } else {
                        onPreviewReport(report);
                      }
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                      {report.reportNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{report.manufacturer}</div>
                      <div className="text-xs text-slate-500">{report.model} ({report.accuracyClass})</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {report.serialNumber || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {report.testDate || report.createdAt?.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {report.testerName || report.userName}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} verdict={report.verdict} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        report.status === 'Completed' ? 'bg-slate-100 text-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPreviewReport(report)}
                          title="Preview Printable Certificate"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => onEditReport(report)}
                          title="Edit Report"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => exportReportToPDF(report)}
                          title="Export PDF"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Download size={16} />
                        </button>

                        <button
                          onClick={() => exportReportToDocx(report)}
                          title="Export Word (.docx)"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <FileDown size={16} />
                        </button>

                        {(user?.role === 'Admin' || report.userId === user?.id) && (
                          <button
                            onClick={(e) => handleDelete(e, report.id, report.reportNumber)}
                            title="Delete Report"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
