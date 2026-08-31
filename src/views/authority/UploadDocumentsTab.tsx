import React, { useState, useEffect } from 'react';
import { FolderLock, Plus, Trash2, Upload, FileText, Download, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { uploadFileToSupabase } from '../../lib/storage';
import { OfficialDocument } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../../lib/audit';

export const UploadDocumentsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gram Sabha Resolution');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data as OfficialDocument[]);
      }
    } catch (err) {
      console.warn('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [panchayat.id]);

  const openCreateModal = () => {
    setTitle('');
    setCategory('Gram Sabha Resolution');
    setDocumentNumber(`RES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setSelectedFile(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please choose a document file (PDF/Image) to upload.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    try {
      // 1. Upload to Supabase Storage bucket 'panchayat-documents'
      const uploadRes = await uploadFileToSupabase('panchayat-documents', selectedFile, 'resolutions');
      if (uploadRes.error || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Failed to upload document file to Supabase Storage');
      }

      // 2. Insert into documents table
      const payload = {
        panchayat_id: panchayat.id,
        title: title.trim(),
        category,
        document_number: documentNumber.trim() || null,
        file_url: uploadRes.url,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        issue_date: issueDate,
        is_public: true,
        uploaded_by: user?.id || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      logAuditEvent({
        panchayatId: panchayat.id,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'documents',
        entityId: data?.id,
        newData: payload,
      });

      setIsModalOpen(false);
      fetchDocuments();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this official document?')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (!error) {
        fetchDocuments();
        refreshData();
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'DELETE_DOCUMENT',
          entityType: 'documents',
          entityId: id,
        });
      }
    } catch (err) {
      console.warn('Error deleting document:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <FolderLock className="w-4 h-4 text-emerald-600" />
            <span>Official Records & Gram Sabha Resolutions</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'పంచాయతీ రికార్డుల అప్‌లోడ్' : 'Official Document Management & Archival'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Upload certified Gram Sabha minutes, annual village budgets, audit statements, and policy circulars to Supabase Storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocuments}
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
            <span>Upload Official Record</span>
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading records from Supabase Storage...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            No official records uploaded yet. Click "Upload Official Record" to add the first PDF.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[11px]">
                    {doc.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">
                    {doc.document_number}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{doc.title}</h3>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(doc.issue_date || doc.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                Upload Signed Resolution or Budget Record
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Document Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gram Sabha Resolution No. 04/2026 on CC Roads & Water Supply"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
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
                    <option value="Gram Sabha Resolution">Gram Sabha Resolution</option>
                    <option value="Annual Budget">Annual Village Budget</option>
                    <option value="Audit Report">Audit Report (Social Audit)</option>
                    <option value="Citizen Charter">Citizen Charter (Poura Seva)</option>
                    <option value="Government Order">Government Order / Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Document / Ref Number</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="RES-2026-04"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Date of Issue / Gram Sabha *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Select PDF / Scanned Record (Supabase Storage) *
                </label>
                <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50 text-center relative cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-600">
                    <Upload className="w-6 h-6 text-emerald-600" />
                    {selectedFile ? (
                      <span className="font-bold text-slate-900">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    ) : (
                      <span>Click to select PDF or Image file up to 25MB</span>
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
                  {submitting ? 'Uploading to Supabase Storage...' : 'Upload & Publish Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
