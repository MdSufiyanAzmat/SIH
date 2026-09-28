import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scale, Lock, Mail, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('tester@metrology.lab');
  const [password, setPassword] = useState('tester123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Tester');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 mb-4">
          <Scale size={32} className="stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          NAWI Test Report Generator
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          OIML R 76 Type-Evaluation & Metrology Verification Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          {/* Tabs */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                isLogin
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                !isLogin
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New User
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-700/60 text-red-200 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name & Title
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Vance (Verification Officer)"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@metrology.lab"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Metrological Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Tester">Tester (Create/edit own test reports)</option>
                  <option value="Admin">Admin (Access all reports + manage metrologists)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to Laboratory' : 'Create Metrologist Account'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <p className="text-xs font-medium text-slate-400 text-center mb-3">
              Fast-Track Demo Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('tester@metrology.lab', 'tester123')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-600/80 transition-colors"
              >
                <CheckCircle2 size={13} className="text-blue-400" />
                <span>Tester (Officer)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@metrology.lab', 'admin123')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-600/80 transition-colors"
              >
                <CheckCircle2 size={13} className="text-purple-400" />
                <span>Admin (Chief)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Complies with OIML R 76-1 International Recommendation & Type Evaluation Rules
        </div>
      </div>
    </div>
  );
}
