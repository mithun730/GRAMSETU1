import React from 'react';
import { 
  HardHat, 
  Coins, 
  Receipt, 
  AlertCircle, 
  HelpCircle, 
  Megaphone, 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { AuthorityTab } from '../../types';

interface OverviewAuthorityTabProps {
  onNavigate: (tab: AuthorityTab) => void;
}

export const OverviewAuthorityTab: React.FC<OverviewAuthorityTabProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { panchayat, stats, complaints, questions } = usePanchayat();
  const { profile } = useAuth();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const pendingComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'under_review');
  const pendingQuestions = questions.filter(q => q.status === 'submitted' || !q.authority_response);

  return (
    <div className="space-y-6">
      
      {/* Authority Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            {profile?.designation || 'Gram Panchayat Administration Desk'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {language === 'te' ? 'పంచాయతీ పరిపాలనా డ్యాష్‌బోర్డ్' : 'Panchayat Governance & Work Desk'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'గ్రామ అభివృద్ధి పనుల నిర్వహణ, నిధుల వినియోగ ధృవీకరణ, ప్రజా సమస్యల పరిష్కారం మరియు గ్రామసభ పత్రాల నిర్వహణ.'
              : 'Direct administrative control for Sarpanch & Panchayat Secretary to manage grant releases, post verified expense vouchers, update project physical milestones, and resolve citizen grievances.'}
          </p>
        </div>

        {/* Quick Create Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('projects')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'te' ? 'కొత్త పని నమోదు' : 'New Project'}</span>
          </button>
          <button
            onClick={() => onNavigate('expenditures')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'te' ? 'ఖర్చు పద్దు నమోదు' : 'Record Voucher'}</span>
          </button>
        </div>
      </div>

      {/* Actionable KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div 
          onClick={() => onNavigate('complaints')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Grievances</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {pendingComplaints.length}
          </p>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>Needs verification & resolution</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('questions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Citizen Questions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {pendingQuestions.length}
          </p>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>Awaiting official Sarpanch reply</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.activeProjects}
          </p>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>In progress or approved</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('funds')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Balance</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(stats.remainingBalance)}
          </p>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>Unutilized funds balance</span>
          </div>
        </div>

      </div>

      {/* Direct Management Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div 
          onClick={() => onNavigate('complaints')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'te' ? 'ఫిర్యాదుల పరిష్కారం' : 'Grievance Redressal Desk'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review filed complaints, assign ward staff, update resolution remarks, and mark status as resolved.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
            <span>Open Redressal Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'te' ? 'పనుల నమోదు & మైల్‌స్టోన్స్' : 'Development Works Manager'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add newly sanctioned CC roads, water tanks, enter contractor bids, and update physical progress % with photos.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
            <span>Manage Works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('expenditures')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'te' ? 'ఖర్చుల నమోదు & బిల్లులు' : 'Expenditure Voucher Entry'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Record new vendor payments, cement/pipe purchases, upload scanned receipts to Supabase Storage.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
            <span>Record Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('funds')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'te' ? 'నిధుల కేటాయింపు & రికార్డులు' : 'Grants & Scheme Allocator'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Record 15th Finance Commission releases, State SFC grants, and own panchayat taxes collected.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
            <span>Manage Funds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('announcements')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'te' ? 'అధికారిక ప్రకటనలు' : 'Village Notice Publisher'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Publish Gram Sabha meeting dates, drinking water maintenance schedules, and public notices in Telugu & English.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
            <span>Publish Notices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('documents')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'te' ? 'రికార్డుల అప్‌లోడ్' : 'Official Document Repository'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload signed Gram Sabha resolutions and annual audit statements to Supabase Storage.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
            <span>Upload Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};
