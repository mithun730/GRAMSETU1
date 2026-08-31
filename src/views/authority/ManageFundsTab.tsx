import React, { useState, useEffect } from 'react';
import { Coins, Plus, Edit2, Trash2, CheckCircle2, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Fund } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../lib/audit';

export const ManageFundsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();
  const { user } = useAuth();

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);

  // Form fields
  const [schemeName, setSchemeName] = useState('');
  const [fundingSource, setFundingSource] = useState('Central Government (15th FC)');
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [sanctionedAmount, setSanctionedAmount] = useState<string>('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [status, setStatus] = useState<Fund['status']>('received');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFunds = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setFunds(data as Fund[]);
      }
    } catch (err) {
      console.warn('Error fetching funds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [panchayat.id]);

  const openCreateModal = () => {
    setEditingFund(null);
    setSchemeName('');
    setFundingSource('Central Government (15th FC)');
    setFinancialYear('2025-2026');
    setSanctionedAmount('');
    setReceivedAmount('');
    setPurpose('');
    setReferenceNumber(`GO-PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setStatus('received');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (fund: Fund) => {
    setEditingFund(fund);
    setSchemeName(fund.scheme_name);
    setFundingSource(fund.funding_source);
    setFinancialYear(fund.financial_year);
    setSanctionedAmount(String(fund.sanctioned_amount));
    setReceivedAmount(String(fund.received_amount));
    setPurpose(fund.purpose);
    setReferenceNumber(fund.reference_number);
    setStatus(fund.status);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    const payload = {
      panchayat_id: panchayat.id,
      scheme_name: schemeName.trim(),
      funding_source: fundingSource,
      financial_year: financialYear,
      sanctioned_amount: Number(sanctionedAmount) || 0,
      received_amount: Number(receivedAmount) || 0,
      purpose: purpose.trim(),
      reference_number: referenceNumber.trim(),
      status,
      date_received: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingFund) {
        const { error } = await supabase
          .from('funds')
          .update(payload)
          .eq('id', editingFund.id);

        if (error) throw error;
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'UPDATE_FUND',
          entityType: 'funds',
          entityId: editingFund.id,
          newData: payload,
        });
      } else {
        const { data, error } = await supabase
          .from('funds')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'CREATE_FUND',
          entityType: 'funds',
          entityId: data?.id,
          newData: payload,
        });
      }

      setIsModalOpen(false);
      fetchFunds();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save fund entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fundId: string) => {
    if (!window.confirm('Are you sure you want to delete this fund entry? This will update treasury balances.')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('funds').delete().eq('id', fundId);
      if (!error) {
        fetchFunds();
        refreshData();
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'DELETE_FUND',
          entityType: 'funds',
          entityId: fundId,
        });
      }
    } catch (err) {
      console.warn('Error deleting fund:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>Panchayat Treasury & Grants Management</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'నిధుల నిర్వహణ & కొత్త కేటాయింపులు' : 'Government Fund Grants & Scheme Allocator'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Record newly sanctioned 15th FC grants, State Finance grants, and Own Revenue in Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFunds}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fund Grant</span>
          </button>
        </div>
      </div>

      {/* Funds Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading treasury records from Supabase...</span>
          </div>
        ) : funds.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No funds recorded yet. Click "Add New Fund Grant" to create the first record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Scheme / Grant Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Source & Year</th>
                  <th className="py-3.5 px-4 sm:px-6">Ref Number</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Sanctioned</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Received</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {funds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-bold text-slate-900">{fund.scheme_name}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{fund.purpose}</p>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{fund.funding_source}</span>
                      <span className="block text-[11px] text-slate-500">{fund.financial_year}</span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {fund.reference_number}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right font-semibold text-slate-900">
                      {formatCurrency(fund.sanctioned_amount)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right font-black text-emerald-700">
                      {formatCurrency(fund.received_amount)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase">
                        {fund.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={() => openEditModal(fund)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900"
                        title="Edit Grant"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fund.id)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-800"
                        title="Delete Grant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                {editingFund ? 'Edit Fund Grant Record' : 'Record New Grant / Scheme Allocation'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scheme / Grant Name *</label>
                <input
                  type="text"
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder="e.g. 15th Finance Commission Basic Tied Grant"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Funding Body / Source *</label>
                  <select
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="Central Government (15th FC)">Central Government (15th FC)</option>
                    <option value="State Finance Commission (SFC)">State Finance Commission (SFC)</option>
                    <option value="Panchayat Own Revenue">Panchayat Own Revenue (Taxes)</option>
                    <option value="Special Development Fund (SDF)">Special Development Fund (SDF)</option>
                    <option value="MGNREGS / Rural Works">MGNREGS / Rural Works</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Financial Year *</label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Sanctioned Amount (₹) *</label>
                  <input
                    type="number"
                    value={sanctionedAmount}
                    onChange={(e) => setSanctionedAmount(e.target.value)}
                    placeholder="2500000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Received in Bank (₹) *</label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="2500000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GO / Sanction Ref No *</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="GO-PR-2025-102"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="sanctioned">Sanctioned</option>
                    <option value="received">Received in Treasury</option>
                    <option value="partially_utilized">Partially Utilized</option>
                    <option value="fully_utilized">Fully Utilized</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Specific Purpose & Guidelines *</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                  placeholder="e.g. For drinking water overhead tank maintenance, sanitation and CC road works..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {submitting ? 'Saving to Supabase...' : editingFund ? 'Update Grant' : 'Save Grant Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
