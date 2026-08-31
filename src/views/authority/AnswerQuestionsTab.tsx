import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, CheckCircle2, RefreshCw, AlertCircle, Send, Shield } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Question } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../lib/audit';

export const AnswerQuestionsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setQuestions(data as Question[]);
      }
    } catch (err) {
      console.warn('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [panchayat.id]);

  const openReplyModal = (q: Question) => {
    setActiveQuestion(q);
    setReplyText(q.authority_response || '');
    setIsPublic(q.is_public ?? true);
    setErrorMsg(null);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestion) return;
    setSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    const payload = {
      authority_response: replyText.trim(),
      responded_by: user?.id || null,
      responded_at: new Date().toISOString(),
      status: 'answered',
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', activeQuestion.id);

      if (error) throw error;

      if (activeQuestion.citizen_id) {
        try {
          await supabase.from('notifications').insert({
            panchayat_id: panchayat.id,
            user_id: activeQuestion.citizen_id,
            title: `Question Answered by Panchayat`,
            message: `Your question "${activeQuestion.subject}" has received an official reply from the Sarpanch.`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch (nErr) {
          console.warn('Notification insert error:', nErr);
        }
      }

      logAuditEvent({
        panchayatId: panchayat.id,
        action: 'ANSWER_QUESTION',
        entityType: 'questions',
        entityId: activeQuestion.id,
        newData: { authority_response: replyText },
      });

      setActiveQuestion(null);
      fetchQuestions();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Citizen Inquiries & Governance Transparency</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'ప్రజా ప్రశ్నల పరిష్కారం & ప్రత్యుత్తరం' : 'Citizen Questions (Praja Prashnalu) Response Desk'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Publish official replies to citizen inquiries about welfare schemes, tap water, sanitation schedules, and development works.
          </p>
        </div>

        <button
          onClick={fetchQuestions}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Questions Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading citizen questions from Supabase...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            No citizen questions logged yet.
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5 hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                    {q.reference_number}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    By {q.citizen_name} (Ward {q.ward_number || 1})
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  q.status === 'answered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-100 text-slate-800'
                }`}>
                  {q.status === 'answered' ? 'Answered' : 'Awaiting Reply'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">{q.subject}</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{q.question_text}</p>
              </div>

              {q.authority_response && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <strong className="text-slate-900 flex items-center gap-1 font-bold">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Official Published Response:
                  </strong>
                  <p className="text-slate-800 leading-relaxed">{q.authority_response}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Received: {new Date(q.created_at).toLocaleString()}
                </span>

                <button
                  onClick={() => openReplyModal(q)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{q.authority_response ? 'Edit Response' : 'Write Official Reply'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Publish Official Reply to Citizen Question
                </h3>
                <p className="text-xs font-mono text-emerald-700 font-bold mt-0.5">{activeQuestion.reference_number}</p>
              </div>
              <button onClick={() => setActiveQuestion(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{activeQuestion.subject}</p>
              <p className="text-slate-600">{activeQuestion.question_text}</p>
              <span className="text-[11px] text-slate-400 block pt-1">Asked by {activeQuestion.citizen_name} (Ward {activeQuestion.ward_number || 1})</span>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Official Sarpanch / Panchayat Response *
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                  placeholder="Provide a clear, accurate, helpful official reply from the Panchayat..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public_cb"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-600"
                />
                <label htmlFor="is_public_cb" className="font-semibold text-slate-700 cursor-pointer">
                  Make this answer visible on the public Citizen Q&A Board
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveQuestion(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : 'Publish Official Response'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
