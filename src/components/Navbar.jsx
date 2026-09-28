import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Scale, PlusCircle, LayoutDashboard, Search, Users, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, onNewReport }) {
  const { user, logout, login } = useAuth();

  const handleRoleToggle = async () => {
    // Quick demo role switcher to easily test both Tester and Admin roles
    if (user?.role === 'Tester') {
      try {
        await login('admin@metrology.lab', 'admin123');
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await login('tester@metrology.lab', 'tester123');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <Scale size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">NAWI Test Report Generator</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  OIML R 76
                </span>
              </div>
              <p className="text-xs text-slate-400">Legal Metrology Type-Evaluation Suite</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>

            <button
              onClick={onNewReport}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'wizard'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <PlusCircle size={16} />
              New Report
            </button>

            <button
              onClick={() => setActiveTab('repository')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'repository'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Search size={16} />
              Repository & Search
            </button>

            {user?.role === 'Admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Users size={16} />
                User Management
              </button>
            )}
          </nav>

          {/* User profile & quick role switch */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
              <div className="flex items-center justify-end gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    user?.role === 'Admin'
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                      : 'bg-blue-900/60 text-blue-300 border border-blue-700/60'
                  }`}
                >
                  {user?.role === 'Admin' ? <ShieldCheck size={11} /> : <UserCheck size={11} />}
                  {user?.role}
                </span>
                <button
                  onClick={handleRoleToggle}
                  title={`Click to switch to ${user?.role === 'Admin' ? 'Tester' : 'Admin'} account`}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 underline transition-colors"
                >
                  Switch to {user?.role === 'Admin' ? 'Tester' : 'Admin'}
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
