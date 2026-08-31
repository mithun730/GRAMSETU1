import React, { useState, useEffect } from 'react';
import { HardHat, Search, Filter, Calendar, MapPin, CheckCircle2, Clock, AlertTriangle, RefreshCw, UserCheck } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Project } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';

export const ProjectsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat } = usePanchayat();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      console.warn('Error fetching projects from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [panchayat.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.name_te && p.name_te.toLowerCase().includes(search.toLowerCase())) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Approved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">Proposed</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <HardHat className="w-4 h-4 text-emerald-600" />
            <span>{language === 'te' ? 'గ్రామ మౌలిక సదుపాయాల అభివృద్ధి' : 'Village Infrastructure Works'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.projects.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'గ్రామంలో మంజూరైన మరియు కొనసాగుతున్న సీసీ రోడ్లు, డ్రైనేజీలు, మంచినీటి పైప్‌లైన్లు మరియు అభివృద్ధి పనుల సమాచారం.'
              : 'Detailed tracking of sanctioned CC roads, drainage works, drinking water network expansion, and sanitation sheds.'}
          </p>
        </div>

        <button
          onClick={fetchProjects}
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
            placeholder={language === 'te' ? 'పని పేరు లేదా వార్డు వెతకండి...' : 'Search by project name, ward or location...'}
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
            <option value="all">All Categories</option>
            <option value="Roads & Drains">Roads & Drains</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Street Lighting">Street Lighting</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Community Hall">Community Hall</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading development works from Supabase database...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            {t.common.noData}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const spent = Number(project.amount_spent || 0);
            const approved = Number(project.approved_amount || 0);
            const percentSpent = approved > 0 ? Math.min(100, Math.round((spent / approved) * 100)) : 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 border border-emerald-100">
                        {project.category} {project.ward_number ? `&bull; Ward ${project.ward_number}` : ''}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {language === 'te' && project.name_te ? project.name_te : project.name}
                      </h3>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{project.location}</span>
                  </div>

                  {/* Physical Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{t.projects.progress}</span>
                      <span className="text-emerald-700 font-bold">{project.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t.projects.estimatedCost}</span>
                    <strong className="text-slate-900 text-sm">{formatCurrency(approved)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t.projects.amountSpent}</span>
                    <strong className="text-rose-700 text-sm">{formatCurrency(spent)}</strong>
                  </div>

                  {project.contractor_name && (
                    <div className="col-span-2 text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contractor: <strong className="text-slate-800">{project.contractor_name}</strong></span>
                    </div>
                  )}

                  {project.expected_completion_date && (
                    <div className="col-span-2 text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Target Completion: {new Date(project.expected_completion_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
