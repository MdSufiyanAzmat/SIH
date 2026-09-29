import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { WizardContainer } from './components/ReportWizard/WizardContainer';
import { ReportPreview } from './components/ReportPreview';
import { Repository } from './components/Repository';
import { AdminUsersModal } from './components/AdminUsersModal';
import { Scale } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'wizard' | 'preview' | 'repository' | 'users'
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center animate-bounce mb-3 shadow-lg shadow-emerald-900/50">
          <Scale size={28} />
        </div>
        <p className="text-sm font-medium text-slate-300">Loading NAWI Metrology Suite...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleStartNewReport = () => {
    setEditingReport(null);
    setSelectedReport(null);
    setActiveTab('wizard');
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setSelectedReport(null);
    setActiveTab('wizard');
  };

  const handlePreviewReport = (report) => {
    setSelectedReport(report);
    setActiveTab('preview');
  };

  const handleSaveSuccess = (savedReport) => {
    setSelectedReport(savedReport);
    setActiveTab('preview');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewReport={handleStartNewReport}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNewReport={handleStartNewReport}
            onEditReport={handleEditReport}
            onPreviewReport={handlePreviewReport}
          />
        )}

        {activeTab === 'wizard' && (
          <WizardContainer
            key={editingReport?.id || 'new'}
            initialReport={editingReport}
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'preview' && selectedReport && (
          <ReportPreview
            report={selectedReport}
            onBack={() => setActiveTab('dashboard')}
            onEdit={() => handleEditReport(selectedReport)}
          />
        )}

        {activeTab === 'repository' && (
          <Repository
            onPreviewReport={handlePreviewReport}
          />
        )}

        {activeTab === 'users' && user.role === 'Admin' && (
          <AdminUsersModal />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NAWI Test Report Generator &mdash; Standard OIML R 76-1: 2006</span>
          <span className="font-mono text-slate-400">Legal Metrology Testing Automation MVP</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
