import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, RefreshCw, AlertCircle, CheckCircle2, Edit2, Search } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Profile, UserRole } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../lib/audit';

export const UsersAdminTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat } = usePanchayat();
  const { user: currentAuthUser } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Edit fields
  const [role, setRole] = useState<UserRole>('villager');
  const [designation, setDesignation] = useState('');
  const [wardNumber, setWardNumber] = useState<number>(1);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data as Profile[]);
      }
    } catch (err) {
      console.warn('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openEditModal = (p: Profile) => {
    setSelectedProfile(p);
    setRole(p.role);
    setDesignation(p.designation || '');
    setWardNumber(p.ward_number || 1);
    setPhone(p.phone || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    const payload = {
      role,
      designation: designation.trim() || null,
      ward_number: Number(wardNumber),
      phone: phone.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', selectedProfile.id);

      if (error) throw error;

      logAuditEvent({
        panchayatId: panchayat.id,
        action: 'UPDATE_USER_ROLE',
        entityType: 'profiles',
        entityId: selectedProfile.id,
        newData: payload,
      });

      setSuccessMsg(`Successfully updated role for ${selectedProfile.full_name} to ${role.toUpperCase()}`);
      fetchProfiles();
      setTimeout(() => setSelectedProfile(null), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search)) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'వినియోగదారుల పాత్రల నిర్వహణ' : 'User Accounts & Role Permissions'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Assign and promote users between Villager, Panchayat Authority (Sarpanch, Secretary, Ward Member), and Admin roles.
          </p>
        </div>

        <button
          onClick={fetchProfiles}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, phone or role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading user profiles from Supabase...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No registered profiles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Full Name</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Designation / Ward</th>
                  <th className="py-3.5 px-5">Phone</th>
                  <th className="py-3.5 px-5">Created At</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{p.full_name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.id}</p>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        p.role === 'admin'
                          ? 'bg-purple-50 text-purple-900 border border-purple-200'
                          : p.role === 'authority'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 font-medium">
                      {p.designation || (p.ward_number ? `Ward ${p.ward_number}` : 'Citizen')}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600">
                      {p.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 ml-auto text-xs transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Manage Role</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                Manage User Access & Role
              </h3>
              <button onClick={() => setSelectedProfile(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-0.5 border border-slate-200">
              <p className="font-bold text-slate-900">{selectedProfile.full_name}</p>
              <p className="font-mono text-slate-500 text-[11px]">{selectedProfile.id}</p>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">System Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 text-slate-900"
                >
                  <option value="villager">Villager / Citizen (Standard Citizen Access)</option>
                  <option value="authority">Panchayat Authority (Sarpanch, Secretary, Ward Member)</option>
                  <option value="admin">System Administrator (Full Control & Audit Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Sarpanch, Panchayat Secretary, Ward Member..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ward Number</label>
                  <select
                    value={wardNumber}
                    onChange={(e) => setWardNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>Ward {w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9440123456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {submitting ? 'Saving...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
