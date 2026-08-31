import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Send, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Image as ImageIcon, 
  FileText, 
  RefreshCw,
  MapPin,
  Shield,
  ExternalLink
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { uploadFileToSupabase } from '../../lib/storage';
import { Complaint, ComplaintPriority } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { logAuditEvent } from '../../lib/audit';

export const ComplaintsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile, isAuthenticated } = useAuth();
  const { panchayat, refreshData } = usePanchayat();

  const [activeSubTab, setActiveSubTab] = useState<'submit' | 'list'>('submit');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Drinking Water');
  const [wardNumber, setWardNumber] = useState<number>(profile?.ward_number || 1);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [citizenName, setCitizenName] = useState(profile?.full_name || '');
  const [citizenPhone, setCitizenPhone] = useState(profile?.phone || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccessRef, setSubmitSuccessRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMyComplaints = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('complaints')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('citizen_id', user.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        setComplaints(data as Complaint[]);
      }
    } catch (err) {
      console.warn('Error fetching complaints from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'list') {
      fetchMyComplaints();
    }
  }, [activeSubTab, user, panchayat.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSubmitSuccessRef(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured. Please connect Supabase in settings.');
      setSubmitting(false);
      return;
    }

    if (!user) {
      setErrorMsg(language === 'te' ? 'దయచేసి ఫిర్యాదు సమర్పించడానికి ముందుగా లాగిన్ చేయండి.' : 'Please sign in to lodge an official complaint.');
      setSubmitting(false);
      return;
    }

    try {
      // 1. Upload photo proof to Supabase Storage if present
      let uploadedUrls: string[] = [];
      if (selectedFile) {
        const uploadRes = await uploadFileToSupabase('complaint-attachments', selectedFile, 'complaints');
        if (uploadRes.url) {
          uploadedUrls.push(uploadRes.url);
        } else if (uploadRes.error) {
          console.warn('Photo upload warning:', uploadRes.error);
        }
      }

      // 2. Insert into Supabase complaints table
      const refNo = `CMP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from('complaints')
        .insert({
          reference_number: refNo,
          panchayat_id: panchayat.id,
          citizen_id: user.id,
          citizen_name: citizenName || profile?.full_name || 'Citizen',
          citizen_phone: citizenPhone || profile?.phone || '',
          ward_number: Number(wardNumber),
          title: title.trim(),
          category,
          location: location.trim(),
          description: description.trim(),
          priority,
          attachment_urls: uploadedUrls,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSubmitSuccessRef(refNo);
        // Reset form
        setTitle('');
        setLocation('');
        setDescription('');
        setSelectedFile(null);
        refreshData();

        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'SUBMIT_COMPLAINT',
          entityType: 'complaints',
          entityId: data?.id,
          newData: { reference_number: refNo, category, title },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
      case 'in_progress':
      case 'assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      case 'under_review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Under Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-200 text-stone-700">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>{language === 'te' ? 'ప్రజా సమస్యల పరిష్కార విభాగం' : 'Citizen Grievance Redressal Cell'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.complaints.submitTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t.complaints.submitDesc}
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('submit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'submit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'te' ? 'ఫిర్యాదు దాఖలు చేయండి' : 'Lodge Grievance'}
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'te' ? 'నా ఫిర్యాదులు & స్థితి' : 'My Grievances'}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SUBMIT COMPLAINT */}
      {activeSubTab === 'submit' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          
          {submitSuccessRef && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{language === 'te' ? 'ఫిర్యాదు విజయవంతంగా నమోదైంది!' : 'Grievance Successfully Registered in Supabase!'}</span>
              </div>
              <p className="text-xs text-emerald-800">
                {language === 'te'
                  ? 'మీ అధికారిక రిఫరెన్స్ నంబర్:'
                  : 'Your official tracking reference number is:'}{' '}
                <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-950">
                  {submitSuccessRef}
                </strong>
              </p>
              <p className="text-[11px] text-emerald-700">
                Panchayat officials have been notified. You can track progress anytime using this reference number.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.complaints.titleLabel} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Drinking water pipeline leakage near school in Ward 3"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.complaints.categoryLabel} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="Drinking Water">Drinking Water (రక్షిత మంచినీరు)</option>
                  <option value="Roads & Drains">Roads & Drains (రోడ్లు & డ్రైనేజీ)</option>
                  <option value="Street Light">Street Lighting (వీధి దీపాలు)</option>
                  <option value="Sanitation & Garbage">Sanitation & Garbage (పారిశుధ్యం)</option>
                  <option value="Health & Hygiene">Health & Hygiene (ఆరోగ్యం)</option>
                  <option value="Other">Other Issues (ఇతర సమస్యలు)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.complaints.wardLabel} *
                </label>
                <select
                  value={wardNumber}
                  onChange={(e) => setWardNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                >
                  {Array.from({ length: panchayat.total_wards || 12 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Ward No. {w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.complaints.locationLabel} *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Ramalayam Temple Street, Pole No. 4"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.complaints.descriptionLabel} *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue clearly (e.g. how many days it has been pending, impact on residents)..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              ></textarea>
            </div>

            {/* Photo Upload with Supabase Storage */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.complaints.uploadPhoto} ({t.common.optional})
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100 transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5 text-xs text-slate-500">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  {selectedFile ? (
                    <span className="font-bold text-slate-900 text-sm">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-800">Click or drag photo proof here</span>
                      <span className="text-[11px] text-slate-400">Supports PNG, JPG, PDF up to 10MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>{language === 'te' ? 'నమోదు అవుతోంది...' : 'Submitting to Supabase...'}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'te' ? 'ఫిర్యాదు సమర్పించండి' : 'Submit Official Grievance'}</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* SUB-TAB 2: LIST COMPLAINTS */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'te' ? 'మీరు దాఖలు చేసిన ఫిర్యాదుల చరిత్ర' : 'My Registered Grievance History'}
            </h3>
            <button
              onClick={fetchMyComplaints}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <span>Loading complaints from Supabase database...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p>No complaints registered under your account yet.</p>
              <button
                onClick={() => setActiveSubTab('submit')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Lodge First Grievance
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {complaints.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      {item.reference_number}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><strong>Category:</strong> {item.category}</div>
                    <div><strong>Ward:</strong> Ward {item.ward_number || 1}</div>
                    <div><strong>Location:</strong> {item.location}</div>
                    <div><strong>Submitted:</strong> {new Date(item.created_at).toLocaleDateString()}</div>
                  </div>

                  {item.attachment_urls && item.attachment_urls.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-500">Attachment:</span>
                      <a
                        href={item.attachment_urls[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>View Photo Proof</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {item.resolution_notes && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <strong className="text-emerald-950 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        Panchayat Resolution & Remarks:
                      </strong>
                      <p className="text-emerald-800 leading-relaxed">{item.resolution_notes}</p>
                      {item.resolved_at && (
                        <p className="text-[11px] text-emerald-700 pt-1">
                          Resolved on: {new Date(item.resolved_at).toLocaleString()}
                        </p>
                      )}
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
