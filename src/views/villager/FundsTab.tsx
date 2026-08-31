import React, { useState, useEffect } from 'react';
import { Coins, Search, Filter, Calendar, FileText, CheckCircle2, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Fund } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';

export const FundsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat } = usePanchayat();

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  const fetchFunds = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('funds')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        setFunds(data as Fund[]);
      }
    } catch (err) {
      console.warn('Error fetching funds from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [panchayat.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredFunds = funds.filter(f => {
    const matchesSearch = f.scheme_name.toLowerCase().includes(search.toLowerCase()) ||
      f.funding_source.toLowerCase().includes(search.toLowerCase()) ||
      f.reference_number.toLowerCase().includes(search.toLowerCase()) ||
      f.purpose.toLowerCase().includes(search.toLowerCase());

    const matchesYear = yearFilter === 'all' || f.financial_year === yearFilter;

    return matchesSearch && matchesYear;
  });

  const totalSanctioned = filteredFunds.reduce((acc, curr) => acc + Number(curr.sanctioned_amount || 0), 0);
  const totalReceived = filteredFunds.reduce((acc, curr) => acc + Number(curr.received_amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_utilized':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Fully Utilized</span>;
      case 'partially_utilized':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Partially Utilized</span>;
      case 'received':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Received in Treasury</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">Sanctioned</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Description */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>{language === 'te' ? 'ప్రభుత్వ నిధుల పారదర్శక సమాచారం' : 'Government Grants & Scheme Allocations'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.funds.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'కేంద్ర ఆర్థిక సంఘం గ్రాంట్లు, రాష్ట్ర పంచాయతీ రాజ్ నిధులు మరియు గ్రామ పంచాయతీ సొంత ఆదాయ వివరాల ప్రత్యక్ష లెక్కలు.'
              : 'Live tracking of Central Finance Commission grants, State Government welfare schemes, and Gram Panchayat own revenue.'}
          </p>
        </div>

        <button
          onClick={fetchFunds}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sanctioned (Filtered)</span>
            <p className="text-2xl font-bold text-white mt-1 tracking-tight">{formatCurrency(totalSanctioned)}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Received in GP Account</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1 tracking-tight">{formatCurrency(totalReceived)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'te' ? 'పథకం పేరు లేదా నిధుల మూలం వెతకండి...' : 'Search by scheme name, funding body, reference no...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-700"
          >
            <option value="all">All Financial Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
          </select>
        </div>
      </div>

      {/* Funds Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading verified fund records from Supabase...</span>
          </div>
        ) : filteredFunds.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            {t.common.noData}
          </div>
        ) : (
          filteredFunds.map((fund) => (
            <div
              key={fund.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 border border-emerald-100">
                      {fund.financial_year} &bull; {fund.funding_source}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {fund.scheme_name}
                    </h3>
                  </div>
                  {getStatusBadge(fund.status)}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="font-mono text-[11px] text-slate-500">
                    Ref No: <strong className="text-slate-800">{fund.reference_number}</strong>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {fund.purpose}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">{t.funds.sanctionedAmount}</span>
                  <strong className="text-slate-900 text-sm">{formatCurrency(fund.sanctioned_amount)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{t.funds.receivedAmount}</span>
                  <strong className="text-emerald-700 text-sm">{formatCurrency(fund.received_amount)}</strong>
                </div>
                {fund.date_received && (
                  <div className="col-span-2 text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Received Date: {new Date(fund.date_received).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
