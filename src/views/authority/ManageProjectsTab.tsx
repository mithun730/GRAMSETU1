import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Edit2, Trash2, CheckCircle2, RefreshCw, AlertCircle, MapPin, Upload } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Project, ProjectStatus } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { logAuditEvent } from '../../lib/audit';

export const ManageProjectsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [category, setCategory] = useState('Roads & Drains');
  const [wardNumber, setWardNumber] = useState<number>(1);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [contractorName, setContractorName] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data as Project[]);
      }
    } catch (err) {
      console.warn('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [panchayat.id]);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setNameTe('');
    setCategory('Roads & Drains');
    setWardNumber(1);
    setLocation('');
    setDescription('');
    setApprovedAmount('');
    setAmountSpent('0');
    setProgressPercentage(0);
    setStatus('in_progress');
    setContractorName('');
    setExpectedCompletionDate('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setNameTe(project.name_te || '');
    setCategory(project.category);
    setWardNumber(project.ward_number || 1);
    setLocation(project.location);
    setDescription(project.description || '');
    setApprovedAmount(String(project.approved_amount));
    setAmountSpent(String(project.amount_spent));
    setProgressPercentage(project.progress_percentage || 0);
    setStatus(project.status);
    setContractorName(project.contractor_name || '');
    setExpectedCompletionDate(project.expected_completion_date || '');
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
      name: name.trim(),
      name_te: nameTe.trim() || null,
      category,
      ward_number: Number(wardNumber),
      location: location.trim(),
      description: description.trim(),
      approved_amount: Number(approvedAmount) || 0,
      amount_spent: Number(amountSpent) || 0,
      progress_percentage: Number(progressPercentage),
      status,
      contractor_name: contractorName.trim() || null,
      expected_completion_date: expectedCompletionDate || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', editingProject.id);

        if (error) throw error;
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'UPDATE_PROJECT',
          entityType: 'projects',
          entityId: editingProject.id,
          newData: payload,
        });
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            ...payload,
            start_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'CREATE_PROJECT',
          entityType: 'projects',
          entityId: data?.id,
          newData: payload,
        });
      }

      setIsModalOpen(false);
      fetchProjects();
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this development work?')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (!error) {
        fetchProjects();
        refreshData();
        logAuditEvent({
          panchayatId: panchayat.id,
          action: 'DELETE_PROJECT',
          entityType: 'projects',
          entityId: projectId,
        });
      }
    } catch (err) {
      console.warn('Error deleting project:', err);
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
            <HardHat className="w-4 h-4 text-emerald-600" />
            <span>Infrastructure Works Administration</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'అభివృద్ధి పనుల నిర్వహణ & పురోగతి' : 'Development Works & Physical Milestones'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create infrastructure works, update contractor info, log physical completion percentage, and manage budgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
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
            <span>New Development Work</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading projects from Supabase...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            No development works created yet. Click "New Development Work" to record one.
          </div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                      {p.category} &bull; Ward {p.ward_number || 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                    {p.name_te && <p className="text-xs text-slate-500 mt-0.5">{p.name_te}</p>}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 uppercase">
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.location}</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Physical Progress</span>
                    <span className="text-emerald-700">{p.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${p.progress_percentage}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Approved Budget</span>
                  <strong className="text-slate-900">{formatCurrency(p.approved_amount)}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit / Progress</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors"
                    title="Delete Project"
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                {editingProject ? 'Edit Development Work & Progress' : 'Record New Infrastructure Work'}
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Project Name (English) *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Construction of CC Road in SC Colony"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Project Name (Telugu)</label>
                <input
                  type="text"
                  value={nameTe}
                  onChange={(e) => setNameTe(e.target.value)}
                  placeholder="ఉదా: ఎస్సీ కాలనీలో సీసీ రోడ్డు నిర్మాణం"
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
                    <option value="Roads & Drains">Roads & Drains</option>
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Street Lighting">Street Lighting</option>
                    <option value="Sanitation">Sanitation & Garbage</option>
                    <option value="Community Hall">Community Hall</option>
                    <option value="Education / Anganwadi">Anganwadi & Schools</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ward Number *</label>
                  <select
                    value={wardNumber}
                    onChange={(e) => setWardNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>Ward {w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Approved Budget (₹) *</label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    placeholder="1200000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Amount Disbursed (₹)</label>
                  <input
                    type="number"
                    value={amountSpent}
                    onChange={(e) => setAmountSpent(e.target.value)}
                    placeholder="450000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Exact Location / Landmark *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near Ramalayam to Hanuman Temple stretch"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                />
              </div>

              {/* Progress Slider */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Physical Completion Progress:</span>
                  <span className="text-emerald-700 font-bold text-sm">{progressPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                  >
                    <option value="proposed">Proposed in Gram Sabha</option>
                    <option value="approved">Approved & Sanctioned</option>
                    <option value="in_progress">Work in Progress</option>
                    <option value="completed">100% Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Contractor / Agency</label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="e.g. Sri Lakshmi Infra / Direct GP"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description & Scope</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detailed dimensions, cement grade, drain depth..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
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
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {submitting ? 'Saving to Supabase...' : editingProject ? 'Update Work' : 'Save New Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
