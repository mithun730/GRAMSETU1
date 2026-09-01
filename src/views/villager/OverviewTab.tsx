import React from 'react';
import { 
  Coins, 
  HardHat, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Megaphone, 
  Phone, 
  MapPin, 
  User, 
  ArrowRight,
  TrendingUp,
  FileCheck,
  Clock,
  Sparkles,
  Building2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { VillagerTab } from '../../types';

interface OverviewTabProps {
  onNavigate: (tab: VillagerTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { panchayat, stats, announcements } = usePanchayat();

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return '—';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const hasFinancialData = stats.hasFinancialData;

  return (
    <div className="space-y-6">
      
      {/* Panchayat Profile & Official Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'te' ? 'డిజిటల్ గ్రామ పంచాయతీ పోర్టల్' : 'Digital Gram Panchayat Portal'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {language === 'te' && panchayat.name_te ? panchayat.name_te : panchayat.name || 'Gram Panchayat'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {language === 'te'
              ? 'గ్రామ ప్రజలందరికీ నమస్కారం. పంచాయతీ నిధులు, అభివృద్ధి పనుల పురోగతి, ప్రజా ఖర్చులు మరియు గ్రామ సమస్యల పరిష్కారానికి పారదర్శక అధికారిక వేదిక.'
              : 'Welcome to the official public portal. View live sanctioned funds, progress of village development works, certified itemized expenditures, and lodge citizen grievances directly to Panchayat officials.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>
                {panchayat.mandal && panchayat.mandal !== '—' ? `${panchayat.mandal}, ` : ''}
                {panchayat.district && panchayat.district !== '—' ? `${panchayat.district} Dist, ` : ''}
                {panchayat.state || 'Telangana'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <User className="w-4 h-4 text-emerald-400" />
              <span>
                {panchayat.total_wards ? `${panchayat.total_wards} Wards` : 'Wards: Not configured'} 
                &bull; 
                Pop: {panchayat.population ? panchayat.population.toLocaleString() : 'Not available'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Financial Treasury Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.stats.totalFunds}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {hasFinancialData && stats.totalFundsSanctioned !== null ? formatCurrency(stats.totalFundsSanctioned) : '—'}
          </p>
          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{hasFinancialData ? 'Central & State Grants' : 'No grants uploaded'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.stats.receivedFunds}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {hasFinancialData && stats.totalFundsReceived !== null ? formatCurrency(stats.totalFundsReceived) : '—'}
          </p>
          <div className="text-[10px] text-slate-500 font-medium">
            {hasFinancialData ? 'Credited to GP Bank Account' : 'Awaiting treasury records'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.stats.totalExpenditure}</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {hasFinancialData && stats.totalExpenditure !== null ? formatCurrency(stats.totalExpenditure) : '—'}
          </p>
          <div className="text-[10px] text-slate-500 font-medium">
            {hasFinancialData ? '100% Verified Vouchers' : 'No vouchers recorded'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.stats.balanceAvailable}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 tracking-tight">
            {hasFinancialData && stats.remainingBalance !== null ? formatCurrency(stats.remainingBalance) : '—'}
          </p>
          <div className="text-[10px] text-slate-500 font-medium">
            {hasFinancialData ? 'Available for Ongoing Works' : 'Balance not available'}
          </div>
        </div>

      </div>

      {/* Announcements & Notices Board */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'te' ? 'గ్రామ పంచాయతీ అధికారిక ప్రకటనలు & నోటీసులు' : 'Official Gram Panchayat Announcements'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'te' ? 'గ్రామసభ, మంచినీటి సరఫరా మరియు తాజా సమాచారం' : 'Gram Sabha schedules, drinking water maintenance, and health drives'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              No current public notices in database.
            </div>
          ) : (
            announcements.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {item.category}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {language === 'te' && item.title_te ? item.title_te : item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'te' && item.content_te ? item.content_te : item.content}
                  </p>
                </div>

                {item.valid_until && (
                  <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-200/80 pt-2">
                    Valid Until: {new Date(item.valid_until).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div 
          onClick={() => onNavigate('complaints')}
          className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              {language === 'te' ? 'ఫిర్యాదు సమర్పించండి' : 'Lodge Grievance'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'te' ? 'మంచినీరు, రోడ్లు, డ్రైనేజీ, వీధి దీపాల సమస్యలను నేరుగా అధికారులకు నివేదించండి.' : 'Report civic issues directly with photo proofs and track status.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <span>{language === 'te' ? 'ఇప్పుడే సమర్పించండి' : 'Submit Issue'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('expenditures')}
          className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              {language === 'te' ? 'ఖర్చుల లెక్కల పద్దు' : 'Public Ledger'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'te' ? 'పంచాయతీ చేసిన ప్రతి రూపాయి ఖర్చు, సామగ్రి మరియు రసీదుల పారదర్శక పద్దు.' : 'Inspect transparent itemized bills, vouchers, and materials purchase.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <span>{language === 'te' ? 'పద్దు చూడండి' : 'Inspect Ledger'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('projects')}
          className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">
              {language === 'te' ? 'అభివృద్ధి పనులు' : 'Ongoing Works'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'te' ? 'గ్రామంలో జరుగుతున్న సీసీ రోడ్లు, ఓవర్‌హెడ్ ట్యాంకులు మరియు పారిశుధ్య పనుల పురోగతి.' : 'Check CC roads, drinking water pipelines, and smart street lights progress.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <span>{language === 'te' ? 'పనుల పురోగతి' : 'Track Works'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('questions')}
          className="p-5 rounded-2xl bg-emerald-900 text-white cursor-pointer hover:bg-emerald-950 transition-all shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">
              {language === 'te' ? 'ప్రజా ప్రశ్నలు (Q&A)' : 'Citizen Questions'}
            </h4>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {language === 'te' ? 'గ్రామ పాలన, ప్రభుత్వ పథకాలపై సర్పంచ్ మరియు కార్యదర్శిని నేరుగా అడగండి.' : 'Ask governance questions directly to the Sarpanch and Secretary.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-white">
            <span>{language === 'te' ? 'ప్రశ్న అడగండి' : 'Ask Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Panchayat Office & Key Officials Contact Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-700" />
          <span>{language === 'te' ? 'గ్రామ పంచాయతీ కార్యాలయం & ప్రజాప్రతినిధుల వివరాలు' : 'Gram Panchayat Office & Key Representatives'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {language === 'te' ? 'గ్రామ సర్పంచ్' : 'Sarpanch (Village Head)'}
            </span>
            <h4 className="font-bold text-sm text-slate-900">{panchayat.sarpanch_name || 'Not configured'}</h4>
            {panchayat.sarpanch_phone ? (
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{panchayat.sarpanch_phone}</span>
              </p>
            ) : (
              <p className="text-slate-400 text-[11px]">Phone not provided</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {language === 'te' ? 'పంచాయతీ కార్యదర్శి' : 'Panchayat Secretary'}
            </span>
            <h4 className="font-bold text-sm text-slate-900">{panchayat.secretary_name || 'Not configured'}</h4>
            {panchayat.secretary_phone ? (
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{panchayat.secretary_phone}</span>
              </p>
            ) : (
              <p className="text-slate-400 text-[11px]">Phone not provided</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full">
              {language === 'te' ? 'కార్యాలయ చిరునామా' : 'Gram Panchayat Office'}
            </span>
            <p className="text-slate-700 leading-relaxed">
              {panchayat.office_address || 'Panchayat office address pending upload.'}
            </p>
            {panchayat.contact_email && (
              <p className="text-slate-500 font-mono text-[11px]">
                {panchayat.contact_email}
              </p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
