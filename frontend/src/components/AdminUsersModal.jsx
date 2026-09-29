import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, UserCheck, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { apiUrl } from '../utils/api';

export function AdminUsersModal() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/users'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(apiUrl(`/api/users/${userId}/role`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setMessage(`Role successfully updated to ${newRole}`);
        setTimeout(() => setMessage(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={26} className="text-purple-600" />
            Laboratory User & Access Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Admin console: Manage metrology personnel roles and permissions.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">User Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Registered Date</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4 text-right">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {u.name} {isSelf && <span className="text-xs text-purple-600 font-normal">(You)</span>}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {u.createdAt ? u.createdAt.split('T')[0] : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        u.role === 'Admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {u.role === 'Admin' ? <Shield size={12} /> : <UserCheck size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isSelf ? (
                      <span className="text-xs text-slate-400 italic">Self (Admin)</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Tester">Tester</option>
                        <option value="Admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
