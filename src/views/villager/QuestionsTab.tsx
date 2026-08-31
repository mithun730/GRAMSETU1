import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, CheckCircle2, Clock, MessageSquare, RefreshCw, AlertCircle, Shield, User } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Question } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { logAuditEvent } from '../../lib/audit';

export const QuestionsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const { panchayat, refreshData } = usePanchayat();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'public' | 'ask' | 'my'>('public');

  // Form State
  const [subject, setSubject] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [wardNumber, setWardNumber] = useState<number>(profile?.ward_number || 1);
  const [citizenName, setCitizenName] = useState(profile?.full_name || '');
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
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
      console.warn('Error fetching questions from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [panchayat.id]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessRef(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    if (!user) {
      setErrorMsg(language === 'te' ? 'దయచేసి ప్రశ్న అడగడానికి ముందుగా లాగిన్ చేయండి.' : 'Please sign in to submit a question.');
      setSubmitting(false);
      return;
    }

    try {
      const refNo = `QST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from('questions')
        .insert({
          reference_number: refNo,
          panchayat_id: panchayat.id,
          citizen_id: user.id,
          citizen_name: citizenName || profile?.full_name || 'Citizen',
          ward_number: Number(wardNumber),
          subject: subject.trim(),
          question_text: questionText.trim(),
          status: 'submitted',
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessRef(refNo);
        setSubject('');
        setQuestionText('');
        fetchQuestions();
        refreshData();

        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'ASK_QUESTION',
          entityType: 'questions',
          entityId: data?.id,
          newData: { reference_number: refNo, subject },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const publicQuestions = questions.filter(q => q.is_public);
  const myQuestions = user ? questions.filter(q => q.citizen_id === user.id) : [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>{language === 'te' ? 'ప్రజా ప్రశ్నల వేదిక' : 'Citizen Q&A & Governance Forum'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.questions.askTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t.questions.askDesc}
          </p>
        </div>

        {/* Subtab navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('public')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'public' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.questions.answeredQuestions}
          </button>
          <button
            onClick={() => setActiveSubTab('ask')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'ask' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'te' ? 'ప్రశ్న అడగండి' : 'Ask Question'}
          </button>
          {user && (
            <button
              onClick={() => setActiveSubTab('my')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.questions.myQuestions} ({myQuestions.length})
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB: ASK QUESTION */}
      {activeSubTab === 'ask' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          
          {successRef && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Question Submitted to Panchayat Secretary & Sarpanch!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Reference ID: <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-950">{successRef}</strong>
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAskQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.questions.subjectLabel} *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Status of drinking water tap connections in Ward 5"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Citizen Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ward Number
                </label>
                <select
                  value={wardNumber}
                  onChange={(e) => setWardNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Ward {w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.questions.questionLabel} *
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={5}
                placeholder="Type your question clearly..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Question to Panchayat'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB: PUBLIC QUESTIONS */}
      {(activeSubTab === 'public' || activeSubTab === 'my') && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <span>Loading citizen Q&A from Supabase...</span>
            </div>
          ) : (activeSubTab === 'public' ? publicQuestions : myQuestions).length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              No questions found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(activeSubTab === 'public' ? publicQuestions : myQuestions).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
                        {item.reference_number}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        By {item.citizen_name} (Ward {item.ward_number || 1})
                      </span>
                    </div>

                    {item.status === 'answered' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending Response
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{item.subject}</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{item.question_text}</p>
                  </div>

                  {item.authority_response ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 mt-2">
                      <strong className="text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        {t.questions.sarpanchResponse}:
                      </strong>
                      <p className="text-slate-800 leading-relaxed">{item.authority_response}</p>
                      {item.responded_at && (
                        <p className="text-[11px] text-slate-500 pt-1">
                          Official Reply Date: {new Date(item.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                      Panchayat officials have received this inquiry and will publish response shortly.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
