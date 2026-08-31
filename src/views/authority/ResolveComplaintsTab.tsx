import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, RefreshCw, MessageSquare, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Complaint, ComplaintStatus } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../lib/audit';

export const ResolveComplaintsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();
  const { user, profile } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Selected complaint for resolution dialog
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComplaints(data as Complaint[]);
      }
    } catch (err) {
      console.warn('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [panchayat.id]);

  const openResolutionModal = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setNewStatus(complaint.status);
    setResolutionNotes(complaint.resolution_notes || '');
    setErrorMsg(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    const payload: any = {
      status: newStatus,
      resolution_notes: resolutionNotes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'resolved') {
      payload.resolved_at = new Date().toISOString();
      payload.resolved_by = user?.id || null;
    }

    try {
      const { error } = await supabase
        .from('complaints')
        .update(payload)
        .eq('id', activeComplaint.id);

      if (error) throw error;

      // Also create a notification for the citizen if citizen_id exists
      if (activeComplaint.citizen_id) {
        try {
          await supabase.from('notifications').insert({
            panchayat_id: panchayat.id,
            user_id: activeComplaint.citizen_id,
            title: `Grievance ${activeComplaint.reference_number} Updated`,
            message: `Your grievance "${activeComplaint.title}" status has been updated to ${newStatus.toUpperCase()}.${resolutionNotes ? ` Remarks: ${resolutionNotes}` : ''}`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch (nErr) {
          console.warn('Could not insert notification:', nErr);
        }
      }

      logAuditEvent({
        panchayatId: panchayat.id,
        action: 'UPDATE_COMPLAINT_STATUS',
        entityType: 'complaints',
        entityId: activeComplaint.id,
        newData: { status: newStatus, resolution_notes: resolutionNotes },
      });

      setActiveComplaint(null);
      fetchComplaints();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>Executive Grievance Redressal</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'ఫిర్యాదుల పరిష్కారం & ప్రత్యుత్తరం' : 'Citizen Grievances Redressal Desk'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Review public complaints, update investigation status, and post certified resolution reports with timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['all', 'pending', 'under_review', 'in_progress', 'resolved', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              filter === st ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'all' ? 'All Grievances' : st.replace('_', ' ').toUpperCase()} (
            {st === 'all' ? complaints.length : complaints.filter(c => c.status === st).length})
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading grievances from Supabase database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            No complaints matching filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5 hover:border-emerald-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                    {item.reference_number}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    By {item.citizen_name || 'Citizen'} &bull; Phone: {item.citizen_phone || 'N/A'}
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 uppercase">
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{item.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <div><strong className="text-slate-900">Category:</strong> {item.category}</div>
                <div><strong className="text-slate-900">Ward:</strong> Ward {item.ward_number || 1}</div>
                <div><strong className="text-slate-900">Location:</strong> {item.location}</div>
                <div><strong className="text-slate-900">Priority:</strong> <span className="uppercase font-bold text-emerald-800">{item.priority}</span></div>
              </div>

              {item.attachment_urls && item.attachment_urls.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={item.attachment_urls[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline inline-flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>View Submitted Proof Photo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {item.resolution_notes && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <strong className="text-emerald-950 font-bold">Current Official Remarks:</strong>
                  <p className="text-emerald-900 leading-relaxed">{item.resolution_notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Registered: {new Date(item.created_at).toLocaleString()}
                </span>

                <button
                  onClick={() => openResolutionModal(item)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Resolution & Status</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Dialog Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Grievance Redressal Action
                </h3>
                <p className="text-xs font-mono text-emerald-700 font-bold mt-0.5">{activeComplaint.reference_number}</p>
              </div>
              <button onClick={() => setActiveComplaint(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{activeComplaint.title}</p>
              <p className="text-slate-600">{activeComplaint.description}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Update Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review / Inspection</option>
                  <option value="assigned">Assigned to Ward Worker</option>
                  <option value="in_progress">Work In Progress</option>
                  <option value="resolved">Resolved & Closed</option>
                  <option value="rejected">Rejected (Out of Scope / Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Official Resolution Remarks & Action Taken *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  placeholder="Explain what steps were taken (e.g. Line repair team dispatched, pipeline joint welded, water restored)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveComplaint(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {submitting ? 'Updating Supabase...' : 'Save & Publish Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
