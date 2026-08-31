import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, CheckCircle2, RefreshCw, AlertCircle, Upload, FileText, ExternalLink } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { uploadFileToSupabase } from '../../lib/storage';
import { Expenditure, Project } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { logAuditEvent } from '../../lib/audit';

export const ManageExpenditureTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();

  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Material Purchase');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (CFMS/PFMS)');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState<string>('');
  const [selectedBillFile, setSelectedBillFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const [expRes, projRes] = await Promise.all([
        supabase.from('expenditures').select('*').eq('panchayat_id', panchayat.id).order('expense_date', { ascending: false }),
        supabase.from('projects').select('id, name').eq('panchayat_id', panchayat.id),
      ]);

      if (!expRes.error && expRes.data) {
        setExpenditures(expRes.data as Expenditure[]);
      }
      if (!projRes.error && projRes.data) {
        setProjects(projRes.data as Project[]);
      }
    } catch (err) {
      console.warn('Error fetching expenditures/projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [panchayat.id]);

  const openCreateModal = () => {
    setAmount('');
    setCategory('Material Purchase');
    setDescription('');
    setVendorName('');
    setBillNumber(`VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentMode('Bank Transfer (CFMS/PFMS)');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setProjectId('');
    setSelectedBillFile(null);
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

    try {
      // 1. Upload scanned bill to Supabase Storage if present
      let billDocUrl: string | null = null;
      if (selectedBillFile) {
        const uploadRes = await uploadFileToSupabase('expenditure-bills', selectedBillFile, 'vouchers');
        if (uploadRes.url) {
          billDocUrl = uploadRes.url;
        } else if (uploadRes.error) {
          console.warn('Storage upload error:', uploadRes.error);
        }
      }

      const payload = {
        panchayat_id: panchayat.id,
        project_id: projectId || null,
        amount: Number(amount) || 0,
        category,
        description: description.trim(),
        vendor_name: vendorName.trim() || null,
        bill_number: billNumber.trim() || null,
        payment_mode: paymentMode,
        expense_date: expenseDate,
        bill_document_url: billDocUrl,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('expenditures')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // If associated with a project, increment amount_spent on project
      if (projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          try {
            await supabase.from('projects').update({
              amount_spent: Number(project.amount_spent || 0) + (Number(amount) || 0)
            }).eq('id', projectId);
          } catch (pErr) {
            console.warn('Project amount update error:', pErr);
          }
        }
      }

      logAuditEvent({
        panchayatId: panchayat.id,
        action: 'RECORD_EXPENDITURE',
        entityType: 'expenditures',
        entityId: data?.id,
        newData: payload,
      });

      setIsModalOpen(false);
      fetchData();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expenditure record? This affects total public balances.')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('expenditures').delete().eq('id', id);
      if (!error) {
        fetchData();
        refreshData();
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'DELETE_EXPENDITURE',
          entityType: 'expenditures',
          entityId: id,
        });
      }
    } catch (err) {
      console.warn('Error deleting expenditure:', err);
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
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Public Expenditure Voucher Book</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'ఖర్చుల నమోదు & బిల్లుల నిర్వహణ' : 'Expenditure Voucher Management'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Record certified payments, purchase of cement/pipes, labor wages, and upload verifiable receipts to Supabase Storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
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
            <span>Record New Voucher</span>
          </button>
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading vouchers from Supabase...</span>
          </div>
        ) : expenditures.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No expenditure vouchers recorded yet. Click "Record New Voucher" to log the first payment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Date</th>
                  <th className="py-3.5 px-4 sm:px-6">Category & Description</th>
                  <th className="py-3.5 px-4 sm:px-6">Vendor & Bill No</th>
                  <th className="py-3.5 px-4 sm:px-6">Payment Mode</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {expenditures.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-medium text-slate-600">
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 max-w-sm">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
                        {exp.category}
                      </span>
                      <p className="font-semibold text-slate-900 mt-1">{exp.description}</p>
                      {exp.bill_document_url && (
                        <a
                          href={exp.bill_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-800 hover:text-emerald-950 underline inline-flex items-center gap-1 mt-0.5 font-medium"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Scanned Bill Proof</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{exp.vendor_name || 'N/A'}</p>
                      <p className="text-[11px] font-mono text-slate-500">{exp.bill_number}</p>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600">
                      {exp.payment_mode}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right font-black text-rose-700 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-800 transition-colors"
                        title="Delete Voucher"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                Record New Expenditure Voucher
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="75000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="Material Purchase">Material Purchase</option>
                    <option value="Labor Wages">Labor Wages</option>
                    <option value="Equipment Purchase & Installation">Equipment Purchase</option>
                    <option value="Construction Material">Construction Material</option>
                    <option value="Sanitation Chemicals">Sanitation Chemicals</option>
                    <option value="Maintenance">Maintenance & Repairs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Associated Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="">-- None / General Maintenance --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Itemized Description & Purpose *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Purchase of 50 bags UltraTech Cement for Ward 2 drain construction..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Vendor / Agency Name</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Sri Venkateshwara Enterprises"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Bill / Voucher Number *</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    placeholder="GST-INV-2026-904"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                >
                  <option value="Bank Transfer (CFMS/PFMS)">Direct Bank Transfer (CFMS / PFMS)</option>
                  <option value="Panchayat Account Cheque">Panchayat Account Cheque</option>
                  <option value="UPI / Government Portal">UPI / Online e-GramSwaraj Portal</option>
                  <option value="Cash Voucher">Cash Voucher (Minor Contingency)</option>
                </select>
              </div>

              {/* Scanned Bill upload with Supabase Storage */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Upload Scanned Bill / Invoice (Supabase Storage)
                </label>
                <div className="border border-dashed border-slate-300 rounded-2xl p-3.5 bg-slate-50 text-center relative cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setSelectedBillFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    {selectedBillFile ? (
                      <span className="font-bold text-slate-900">{selectedBillFile.name}</span>
                    ) : (
                      <span>Select Scanned Bill / GST Invoice PDF or JPG</span>
                    )}
                  </div>
                </div>
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
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {submitting ? 'Recording in Supabase...' : 'Save & Certify Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
