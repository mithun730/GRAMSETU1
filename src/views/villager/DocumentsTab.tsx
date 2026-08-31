import React, { useState, useEffect } from 'react';
import { FolderLock, Search, Filter, Download, FileText, Calendar, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { OfficialDocument } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';

export const DocumentsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat } = usePanchayat();

  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchDocuments = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data as OfficialDocument[]);
      }
    } catch (err) {
      console.warn('Error fetching documents from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [panchayat.id]);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.document_number && d.document_number.toLowerCase().includes(search.toLowerCase())) ||
      d.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <FolderLock className="w-4 h-4 text-emerald-600" />
            <span>{language === 'te' ? 'గ్రామ పంచాయతీ అధికారిక రికార్డులు' : 'Public Village Records & Certified Orders'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'గ్రామసభ తీర్మానాలు & బడ్జెట్ రికార్డులు' : 'Official Gram Sabha Resolutions & Budgets'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'ఆమోదించిన గ్రామసభ సమావేశ రికార్డులు, సామాజిక తనిఖీ (సోషల్ ఆడిట్) నివేదికలు మరియు పౌర సేవల చార్టర్ డౌన్‌లోడ్ చేసుకోండి.'
              : 'Download certified Gram Sabha minutes, annual development plans, financial audit reports, and citizen service charters.'}
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'te' ? 'పత్రం శీర్షిక లేదా జీవో నంబర్ వెతకండి...' : 'Search by document title or number...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-700"
          >
            <option value="all">All Document Types</option>
            <option value="Gram Sabha Resolution">Gram Sabha Resolutions</option>
            <option value="Annual Budget">Annual Budgets</option>
            <option value="Audit Report">Audit Reports</option>
            <option value="Citizen Charter">Citizen Charter</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading records from Supabase Storage & Database...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            {t.common.noData}
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-100">
                    {doc.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatFileSize(doc.file_size)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {doc.title}
                </h3>

                {doc.document_number && (
                  <p className="text-xs font-mono text-slate-500">
                    Doc Ref: <strong className="text-slate-800">{doc.document_number}</strong>
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(doc.issue_date || doc.created_at).toLocaleDateString()}</span>
                </div>

                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.common.download}</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
