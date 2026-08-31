import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit2, Calendar, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Announcement } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../lib/audit';

export const ManageAnnouncementsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [content, setContent] = useState('');
  const [contentTe, setContentTe] = useState('');
  const [category, setCategory] = useState('Gram Sabha');
  const [isUrgent, setIsUrgent] = useState(false);
  const [validUntil, setValidUntil] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data as Announcement[]);
      }
    } catch (err) {
      console.warn('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [panchayat.id]);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setTitleTe('');
    setContent('');
    setContentTe('');
    setCategory('Gram Sabha');
    setIsUrgent(false);
    setValidUntil('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingItem(item);
    setTitle(item.title);
    setTitleTe(item.title_te || '');
    setContent(item.content);
    setContentTe(item.content_te || '');
    setCategory(item.category);
    setIsUrgent(item.priority === 'urgent');
    setValidUntil(item.valid_until ? item.valid_until.split('T')[0] : '');
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
      title: title.trim(),
      title_te: titleTe.trim() || null,
      content: content.trim(),
      content_te: contentTe.trim() || null,
      category,
      is_active: true,
      priority: (isUrgent ? 'urgent' : 'normal') as 'urgent' | 'normal',
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      created_by: user?.id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'UPDATE_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: editingItem.id,
          newData: payload,
        });
      } else {
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'CREATE_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: data?.id,
          newData: payload,
        });
      }

      setIsModalOpen(false);
      fetchAnnouncements();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (!error) {
        fetchAnnouncements();
        refreshData();
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'DELETE_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: id,
        });
      }
    } catch (err) {
      console.warn('Error deleting announcement:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4 text-emerald-600" />
            <span>Official Panchayat Communications</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'గ్రామ అధికారిక ప్రకటనల ప్రచురణ' : 'Publish Village Notices & Announcements'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Broadcast Gram Sabha notices, tap water maintenance alerts, welfare camp dates, and public alerts in Telugu & English.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
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
            <span>Publish New Notice</span>
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading announcements from Supabase...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            No announcements published yet.
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[11px]">
                    {item.category}
                  </span>
                  {item.priority === 'urgent' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 font-bold text-[10px] uppercase">
                      Urgent Notice
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                {item.title_te && <p className="text-xs text-slate-600 font-semibold">{item.title_te}</p>}

                <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                {item.content_te && <p className="text-xs text-slate-500 leading-relaxed italic">{item.content_te}</p>}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Published: {new Date(item.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                {editingItem ? 'Edit Official Notice' : 'Publish Official Village Announcement'}
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
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Title (English) *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quarterly Gram Sabha Meeting on Sunday 10:00 AM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Title (Telugu)</label>
                <input
                  type="text"
                  value={titleTe}
                  onChange={(e) => setTitleTe(e.target.value)}
                  placeholder="ఉదా: ఆదివారం ఉదయం 10 గంటలకు గ్రామసభ సమావేశం"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="Gram Sabha">Gram Sabha Meeting</option>
                    <option value="Drinking Water">Drinking Water Alert</option>
                    <option value="Welfare Schemes">Welfare Schemes & Pensions</option>
                    <option value="Health & Vaccination">Health & Sanitation</option>
                    <option value="General Notice">General Public Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Content Details (English) *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder="Full announcement description, venue, agenda items..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Content Details (Telugu)</label>
                <textarea
                  value={contentTe}
                  onChange={(e) => setContentTe(e.target.value)}
                  rows={3}
                  placeholder="వివరాలు తెలుగులో నమోదు చేయండి..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent_cb"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-600"
                />
                <label htmlFor="urgent_cb" className="font-semibold text-rose-700 cursor-pointer">
                  Mark as High Priority / Urgent Alert
                </label>
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
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
