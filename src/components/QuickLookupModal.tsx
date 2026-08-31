import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, XCircle, FileText, ArrowRight, Shield } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { Complaint, Question } from '../types/database';
import { useLanguage } from '../context/LanguageContext';

interface QuickLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLookupModal: React.FC<QuickLookupModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [complaintResult, setComplaintResult] = useState<Complaint | null>(null);
  const [questionResult, setQuestionResult] = useState<Question | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toUpperCase();
    if (!clean) return;

    setSearching(true);
    setErrorMsg(null);
    setComplaintResult(null);
    setQuestionResult(null);
    setSearched(true);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase backend not connected. Please set up Supabase connection.');
      setSearching(false);
      return;
    }

    try {
      if (clean.startsWith('CMP') || clean.includes('-')) {
        // Query complaints
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .ilike('reference_number', `%${clean}%`)
          .limit(1);

        if (data && data.length > 0) {
          setComplaintResult(data[0] as Complaint);
          setSearching(false);
          return;
        }
      }

      if (clean.startsWith('QST') || clean.includes('-') || !complaintResult) {
        // Query questions
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .ilike('reference_number', `%${clean}%`)
          .limit(1);

        if (qData && qData.length > 0) {
          setQuestionResult(qData[0] as Question);
          setSearching(false);
          return;
        }
      }

      // If not found in either
      setErrorMsg(language === 'te' ? 'ఈ రిఫరెన్స్ నంబర్‌తో రికార్డు కనుగొనబడలేదు.' : 'No grievance or question found matching this reference number.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing search');
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'in_progress':
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-200 text-stone-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">
                {language === 'te' ? 'ఫిర్యాదు / ప్రశ్న స్థితి ట్రాకింగ్' : 'Citizen Grievance & Question Status'}
              </h3>
              <p className="text-xs text-slate-300">
                {language === 'te' ? 'రిఫరెన్స్ నంబర్ ఎంటర్ చేసి ప్రత్యక్ష స్థితిని తెలుసుకోండి' : 'Enter reference number for real-time Panchayat resolution status'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CMP-202608-1001 or QST-202608-1001"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-xs transition-colors flex items-center gap-2"
            >
              {searching ? '...' : (language === 'te' ? 'వెతకండి' : 'Track')}
            </button>
          </form>

          {/* Results Display */}
          {searched && (
            <div className="space-y-4">
              {complaintResult && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                      {complaintResult.reference_number}
                    </span>
                    {getStatusBadge(complaintResult.status)}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{complaintResult.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{complaintResult.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    <div><strong>Category:</strong> {complaintResult.category}</div>
                    <div><strong>Ward:</strong> Ward No. {complaintResult.ward_number || 1}</div>
                    <div><strong>Location:</strong> {complaintResult.location}</div>
                    <div><strong>Submitted On:</strong> {new Date(complaintResult.created_at).toLocaleDateString()}</div>
                  </div>

                  {complaintResult.resolution_notes && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <strong className="text-emerald-900 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        Panchayat Official Resolution Remarks:
                      </strong>
                      <p className="text-emerald-800">{complaintResult.resolution_notes}</p>
                      {complaintResult.resolved_at && (
                        <p className="text-[11px] text-emerald-700 pt-1">
                          Resolved Date: {new Date(complaintResult.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {questionResult && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                      {questionResult.reference_number}
                    </span>
                    {getStatusBadge(questionResult.status)}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{questionResult.subject}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{questionResult.question_text}</p>
                  </div>

                  {questionResult.authority_response ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                      <strong className="text-blue-900">Panchayat Official Answer:</strong>
                      <p className="text-blue-800 leading-relaxed">{questionResult.authority_response}</p>
                      {questionResult.responded_at && (
                        <p className="text-[11px] text-blue-600 pt-1">
                          Responded on: {new Date(questionResult.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2.5 bg-slate-100 rounded-xl">
                      Pending official reply from Sarpanch/Secretary.
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
