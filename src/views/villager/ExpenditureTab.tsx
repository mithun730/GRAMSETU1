import React, { useState, useEffect } from 'react';
import { Receipt, Search, Filter, Calendar, ExternalLink, ShieldCheck, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Expenditure } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';

export const ExpenditureTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat } = usePanchayat();

  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchExpenditures = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenditures')
        .select('*')
        .eq('panchayat_id', panchayat.id)
        .order('expense_date', { ascending: false });

      if (!error && data) {
        setExpenditures(data as Expenditure[]);
      }
    } catch (err) {
      console.warn('Error fetching expenditures from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenditures();
  }, [panchayat.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredExpenditures = expenditures.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.vendor_name && e.vendor_name.toLowerCase().includes(search.toLowerCase())) ||
      (e.bill_number && e.bill_number.toLowerCase().includes(search.toLowerCase())) ||
      e.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredAmount = filteredExpenditures.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>{language === 'te' ? 'పారదర్శక ప్రజా ఖర్చుల పద్దు' : 'Transparent Public Expenditure Ledger'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.expenditures.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t.expenditures.ledgerDesc}
          </p>
        </div>

        <button
          onClick={fetchExpenditures}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Verified Public Expenditure</span>
          <p className="text-3xl font-bold text-white mt-1 tracking-tight">{formatCurrency(totalFilteredAmount)}</p>
          <span className="text-xs text-emerald-400 font-medium">Showing {filteredExpenditures.length} voucher records from Supabase</span>
        </div>
        <div className="p-3.5 bg-white/10 rounded-2xl text-emerald-400">
          <ShieldCheck className="w-8 h-8" />
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
            placeholder={language === 'te' ? 'వివరణ, వ్యాపారి లేదా బిల్లు నంబర్ వెతకండి...' : 'Search by description, vendor, bill number...'}
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
            <option value="all">All Expense Categories</option>
            <option value="Material Purchase">Material Purchase</option>
            <option value="Labor Wages">Labor Wages</option>
            <option value="Equipment Purchase & Installation">Equipment Purchase</option>
            <option value="Construction Material">Construction Material</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Table / Ledger View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading verified vouchers from Supabase...</span>
          </div>
        ) : filteredExpenditures.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {t.common.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">{t.common.date}</th>
                  <th className="py-3.5 px-4">{t.common.category}</th>
                  <th className="py-3.5 px-4">Description & Purpose</th>
                  <th className="py-3.5 px-4">{t.expenditures.vendor} & Bill No.</th>
                  <th className="py-3.5 px-4">{t.expenditures.paymentMode}</th>
                  <th className="py-3.5 px-4 text-right">{t.common.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredExpenditures.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {new Date(item.expense_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-800 text-[11px] border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900">{item.description}</p>
                      {item.bill_document_url && (
                        <a
                          href={item.bill_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium underline inline-flex items-center gap-1 mt-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{t.expenditures.verifiedReceipt}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{item.vendor_name || 'Direct Contractor'}</p>
                      <p className="text-[11px] font-mono text-slate-500">{item.bill_number || 'Voucher'}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {item.payment_mode || 'Bank Transfer'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-black text-rose-700 text-sm">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
