import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  Coins, 
  HardHat, 
  Receipt, 
  Building, 
  Trash2, 
  Plus, 
  Check, 
  Layers, 
  Info, 
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Database
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { 
  parseCSV, 
  validateFundsCSV, 
  validateProjectsCSV, 
  validateExpendituresCSV, 
  validateDemographicsCSV,
  getSampleFundsTemplate,
  getSampleProjectsTemplate,
  getSampleExpendituresTemplate,
  getSampleDemographicsTemplate,
  downloadCSV,
  FundImportRow,
  ProjectImportRow,
  ExpenditureImportRow,
  DemographicsImportRow
} from '../../utils/csvHelper';

type ImportCategory = 'funds' | 'projects' | 'expenditures' | 'demographics';

export const DataImportAdminTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, stats, refreshData } = usePanchayat();
  const { role, user, isAuthenticated } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ImportCategory>('funds');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Direct quick-edit demographics state
  const [demoForm, setDemoForm] = useState({
    name: panchayat.name || '',
    name_te: panchayat.name_te || '',
    mandal: panchayat.mandal || '',
    district: panchayat.district || '',
    state: panchayat.state || 'Telangana',
    population: panchayat.population || 0,
    total_wards: panchayat.total_wards || 0,
    sarpanch_name: panchayat.sarpanch_name || '',
    sarpanch_phone: panchayat.sarpanch_phone || '',
    secretary_name: panchayat.secretary_name || '',
    secretary_phone: panchayat.secretary_phone || '',
    office_address: panchayat.office_address || '',
    lgd_code: panchayat.lgd_code || '',
  });
  const [savingDemo, setSavingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === 'admin' || role === 'administrator' || role === 'authority' || role === 'panchayat_authority';

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Download appropriate CSV sample template
  const handleDownloadTemplate = (cat: ImportCategory) => {
    let content = '';
    let fname = '';
    if (cat === 'funds') {
      content = getSampleFundsTemplate();
      fname = 'panchayat_funds_grants_template.csv';
    } else if (cat === 'projects') {
      content = getSampleProjectsTemplate();
      fname = 'panchayat_projects_template.csv';
    } else if (cat === 'expenditures') {
      content = getSampleExpendituresTemplate();
      fname = 'panchayat_expenditures_template.csv';
    } else if (cat === 'demographics') {
      content = getSampleDemographicsTemplate();
      fname = 'panchayat_demographics_template.csv';
    }

    downloadCSV(fname, content);
  };

  // Handle file select and client-side CSV validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadSuccess(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setValidationErrors(['The selected file is empty.']);
        setParsedData(null);
        return;
      }

      const rows = parseCSV(text);
      if (rows.length < 2) {
        setValidationErrors(['File contains no data rows. Must contain at least 1 header line and 1 data row.']);
        setParsedData(null);
        return;
      }

      if (selectedCategory === 'funds') {
        const result = validateFundsCSV(rows);
        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);
        setParsedData(result.isValid ? result.data : null);
      } else if (selectedCategory === 'projects') {
        const result = validateProjectsCSV(rows);
        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);
        setParsedData(result.isValid ? result.data : null);
      } else if (selectedCategory === 'expenditures') {
        const result = validateExpendituresCSV(rows);
        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);
        setParsedData(result.isValid ? result.data : null);
      } else if (selectedCategory === 'demographics') {
        const result = validateDemographicsCSV(rows);
        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);
        setParsedData(result.isValid ? result.data : null);
      }
    };

    reader.readAsText(file);
  };

  // Execute database import to Supabase
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const supabase = getSupabase();
    if (!supabase) {
      setUploadError('Supabase client is not connected. Please check your Supabase credentials.');
      setIsUploading(false);
      return;
    }

    try {
      const activePId = panchayat.id;

      if (selectedCategory === 'funds') {
        if (importMode === 'replace') {
          // Delete existing funds for this panchayat
          await supabase.from('funds').delete().eq('panchayat_id', activePId);
        }

        const rowsToInsert = (parsedData as FundImportRow[]).map(r => ({
          panchayat_id: activePId,
          scheme_name: r.scheme_name,
          funding_source: r.funding_source,
          financial_year: r.financial_year,
          sanctioned_amount: r.sanctioned_amount,
          received_amount: r.received_amount,
          reference_number: r.reference_number,
          purpose: r.purpose || r.scheme_name,
          status: r.status || 'received',
          date_sanctioned: r.date_sanctioned || new Date().toISOString().split('T')[0],
          date_received: r.date_received || new Date().toISOString().split('T')[0],
          created_by: user?.id || null,
        }));

        const { error } = await supabase.from('funds').insert(rowsToInsert);
        if (error) throw error;

        setUploadSuccess(`Successfully imported ${rowsToInsert.length} Financial Grant records into Supabase!`);
      } else if (selectedCategory === 'projects') {
        if (importMode === 'replace') {
          await supabase.from('projects').delete().eq('panchayat_id', activePId);
        }

        const rowsToInsert = (parsedData as ProjectImportRow[]).map(r => ({
          panchayat_id: activePId,
          name: r.name,
          name_te: r.name_te || null,
          category: r.category,
          location: r.location,
          ward_number: r.ward_number || null,
          estimated_cost: r.estimated_cost,
          approved_amount: r.approved_amount,
          amount_spent: r.amount_spent || 0,
          progress_percentage: r.progress_percentage || 0,
          status: r.status || 'in_progress',
          contractor_name: r.contractor_name || null,
          description: r.description || null,
          start_date: r.start_date || new Date().toISOString().split('T')[0],
          expected_completion_date: r.expected_completion_date || null,
          created_by: user?.id || null,
        }));

        const { error } = await supabase.from('projects').insert(rowsToInsert);
        if (error) throw error;

        setUploadSuccess(`Successfully imported ${rowsToInsert.length} Development Projects into Supabase!`);
      } else if (selectedCategory === 'expenditures') {
        if (importMode === 'replace') {
          await supabase.from('expenditures').delete().eq('panchayat_id', activePId);
        }

        const rowsToInsert = (parsedData as ExpenditureImportRow[]).map(r => ({
          panchayat_id: activePId,
          description: r.description,
          category: r.category,
          amount: r.amount,
          expense_date: r.expense_date,
          vendor_name: r.vendor_name || null,
          bill_number: r.bill_number || null,
          payment_mode: r.payment_mode || 'PFMS / Bank Transfer',
          approval_status: r.approval_status || 'approved',
          created_by: user?.id || null,
        }));

        const { error } = await supabase.from('expenditures').insert(rowsToInsert);
        if (error) throw error;

        setUploadSuccess(`Successfully imported ${rowsToInsert.length} Expenditure Vouchers into Supabase!`);
      } else if (selectedCategory === 'demographics') {
        const demoRow = parsedData[0] as DemographicsImportRow;
        if (demoRow) {
          const { error } = await supabase
            .from('panchayats')
            .upsert({
              id: activePId,
              name: demoRow.name,
              name_te: demoRow.name_te || null,
              mandal: demoRow.mandal,
              district: demoRow.district,
              state: demoRow.state,
              population: demoRow.population,
              total_wards: demoRow.total_wards,
              lgd_code: demoRow.lgd_code || null,
              sarpanch_name: demoRow.sarpanch_name || null,
              sarpanch_phone: demoRow.sarpanch_phone || null,
              secretary_name: demoRow.secretary_name || null,
              secretary_phone: demoRow.secretary_phone || null,
              office_address: demoRow.office_address || null,
              contact_email: demoRow.contact_email || null,
              pin_code: demoRow.pin_code || '505531',
              is_active: true,
              updated_at: new Date().toISOString(),
            });

          if (error) throw error;
          setUploadSuccess(`Successfully updated Panchayat Demographics & Office details!`);
        }
      }

      // Log audit
      try {
        await supabase.from('audit_logs').insert({
          panchayat_id: activePId,
          user_id: user?.id || null,
          user_email: user?.email || 'admin@gramsetu.in',
          action: `CSV_IMPORT_${selectedCategory.toUpperCase()}`,
          entity_type: selectedCategory,
          new_data: { rowCount: parsedData.length, mode: importMode },
        });
      } catch (logErr) {
        // non-blocking
      }

      // Refresh live application state
      await refreshData();

      // Clear selection
      setParsedData(null);
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setUploadError(err.message || 'Failed to save imported records to database.');
    } finally {
      setIsUploading(false);
    }
  };

  // Quick direct save for Demographics
  const handleSaveDemoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDemo(true);
    setDemoSuccess(false);

    const supabase = getSupabase();
    if (!supabase) {
      setSavingDemo(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('panchayats')
        .upsert({
          id: panchayat.id,
          name: demoForm.name,
          name_te: demoForm.name_te || null,
          mandal: demoForm.mandal,
          district: demoForm.district,
          state: demoForm.state,
          population: Number(demoForm.population) || 0,
          total_wards: Number(demoForm.total_wards) || 0,
          sarpanch_name: demoForm.sarpanch_name || null,
          sarpanch_phone: demoForm.sarpanch_phone || null,
          secretary_name: demoForm.secretary_name || null,
          secretary_phone: demoForm.secretary_phone || null,
          office_address: demoForm.office_address || null,
          lgd_code: demoForm.lgd_code || null,
          country: 'India',
          pin_code: panchayat.pin_code || '505531',
          is_active: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setDemoSuccess(true);
      await refreshData();
      setTimeout(() => setDemoSuccess(false), 4000);
    } catch (err: any) {
      alert(`Error saving details: ${err.message}`);
    } finally {
      setSavingDemo(false);
    }
  };

  // Purge/clear specific table
  const handlePurgeCategory = async (cat: ImportCategory) => {
    if (!window.confirm(`Are you sure you want to delete all uploaded ${cat} records for this Panchayat? The dashboard will reset this metric to "Not available".`)) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      if (cat === 'funds') {
        await supabase.from('funds').delete().eq('panchayat_id', panchayat.id);
      } else if (cat === 'projects') {
        await supabase.from('projects').delete().eq('panchayat_id', panchayat.id);
      } else if (cat === 'expenditures') {
        await supabase.from('expenditures').delete().eq('panchayat_id', panchayat.id);
      }

      await refreshData();
      alert(`Cleared all ${cat} records. Dashboard updated.`);
    } catch (err: any) {
      alert(`Error clearing data: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <UploadCloud className="w-3.5 h-3.5" />
            {language === 'te' ? 'అడ్మినిస్ట్రేటర్ డేటా నిర్వహణ' : 'Admin Data Management & Dynamic Import'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {language === 'te' ? 'పంచాయతీ డేటా అప్‌లోడ్ & నిర్వహణ' : 'Upload & Manage Panchayat Data'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'గ్రామ పంచాయతీకి సంబంధించిన నిజమైన నిధులు, ఖర్చులు, అభివృద్ధి పనులు మరియు జనాభా గణాంకాల CSV/Excel ఫైళ్లను అప్‌లోడ్ చేయండి. డాష్‌బోర్డ్ స్వయంచాలకంగా అప్‌డేట్ అవుతుంది.'
              : 'Upload real Panchayat statistics and financial datasets via CSV or Excel templates. The citizen dashboard updates dynamically with live calculations.'}
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shrink-0 shadow-xs"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>{language === 'te' ? 'తాజాకరించు' : 'Sync Live Data'}</span>
        </button>
      </div>

      {/* Live Financial & Statistical Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sanctioned Grants</span>
          <p className="text-xl font-bold text-slate-900">
            {stats.hasFinancialData && stats.totalFundsSanctioned !== null ? formatCurrency(stats.totalFundsSanctioned) : '—'}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {stats.hasFinancialData ? 'Live in Database' : 'No records uploaded'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grants Received</span>
          <p className="text-xl font-bold text-slate-900">
            {stats.hasFinancialData && stats.totalFundsReceived !== null ? formatCurrency(stats.totalFundsReceived) : '—'}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {stats.hasFinancialData ? 'Live in Database' : 'Awaiting upload'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Public Expenditures</span>
          <p className="text-xl font-bold text-slate-900">
            {stats.hasFinancialData && stats.totalExpenditure !== null ? formatCurrency(stats.totalExpenditure) : '—'}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            {stats.hasFinancialData ? 'Vouchers verified' : 'No vouchers recorded'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Treasury Balance</span>
          <p className="text-xl font-bold text-emerald-700">
            {stats.hasFinancialData && stats.remainingBalance !== null ? formatCurrency(stats.remainingBalance) : '—'}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {stats.hasFinancialData ? 'Remaining Balance' : 'Not available'}
          </span>
        </div>

      </div>

      {/* Main CSV / Excel Import Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        
        <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>{language === 'te' ? 'CSV / ఎక్సెల్ డేటా దిగుమతి' : 'CSV / Spreadsheet Data Importer'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select the data entity to import, download the pre-formatted template, and upload your validated records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate(selectedCategory)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Download {selectedCategory.toUpperCase()} Template (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedCategory('funds');
              setParsedData(null);
              setValidationErrors([]);
              setFileName(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedCategory === 'funds'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>1. Financial Grants & Funds</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('projects');
              setParsedData(null);
              setValidationErrors([]);
              setFileName(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedCategory === 'projects'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HardHat className="w-4 h-4 text-emerald-400" />
            <span>2. Development Projects</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('expenditures');
              setParsedData(null);
              setValidationErrors([]);
              setFileName(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedCategory === 'expenditures'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>3. Expenditure Vouchers</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('demographics');
              setParsedData(null);
              setValidationErrors([]);
              setFileName(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedCategory === 'demographics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-400" />
            <span>4. Demographics & Profile</span>
          </button>
        </div>

        {/* Upload Box & Mode Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* File Upload Zone */}
          <div className="lg:col-span-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-all flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            
            <div>
              <p className="font-bold text-sm text-slate-900">
                {fileName ? fileName : `Select ${selectedCategory.toUpperCase()} CSV File`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag and drop your file here, or click Browse to choose from your computer (.csv, .txt)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />

            <div className="flex items-center gap-3 pt-2">
              <label
                htmlFor="csv-file-input"
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Browse CSV File
              </label>

              {fileName && (
                <button
                  onClick={() => {
                    setParsedData(null);
                    setValidationErrors([]);
                    setFileName(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Import Settings & Actions */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Import Mode</span>
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Replace Existing</span>
                    <span className="text-[11px] text-slate-500">Clears current {selectedCategory} and loads new records cleanly.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Append to Existing</span>
                    <span className="text-[11px] text-slate-500">Adds new records alongside existing entries.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExecuteImport}
                disabled={!parsedData || parsedData.length === 0 || isUploading}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  parsedData && parsedData.length > 0 && !isUploading
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading to Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commit {parsedData?.length || 0} Records to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Validation Errors Feedback */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>CSV Format / Validation Issues Detected ({validationErrors.length})</span>
            </div>
            <p className="text-xs text-rose-700">
              Please fix the following issues in your CSV and re-upload:
            </p>
            <ul className="list-disc pl-5 text-xs space-y-1 font-mono text-[11px]">
              {validationErrors.slice(0, 8).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {validationErrors.length > 8 && (
                <li>... and {validationErrors.length - 8} more errors</li>
              )}
            </ul>
          </div>
        )}

        {/* Success Feedback */}
        {uploadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{uploadSuccess}</span>
          </div>
        )}

        {/* Error Feedback */}
        {uploadError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-bold">{uploadError}</span>
          </div>
        )}

        {/* Data Preview Table (When CSV is validated) */}
        {parsedData && parsedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Validated Data Preview ({parsedData.length} rows ready for import)</span>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3">#</th>
                    {Object.keys(parsedData[0]).slice(0, 6).map((key) => (
                      <th key={key} className="p-3 capitalize">{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      {Object.values(row).slice(0, 6).map((val: any, vIdx) => (
                        <td key={vIdx} className="p-3 truncate max-w-xs">
                          {typeof val === 'number' && val > 1000 ? formatCurrency(val) : String(val ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Danger Zone: Purge Category */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700">Clear Records in Database</span>
            <p className="text-[11px] text-slate-500">Permanently reset the current {selectedCategory} table in Supabase.</p>
          </div>

          <button
            onClick={() => handlePurgeCategory(selectedCategory)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear {selectedCategory.toUpperCase()}</span>
          </button>
        </div>

      </div>

      {/* Direct Demographics & Profile Quick Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              <span>{language === 'te' ? 'పంచాయతీ జనాభా & అధికారుల వివరాల ప్రత్యక్ష సవరణ' : 'Direct Panchayat Demographics & Office Settings'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Quickly edit key Panchayat information without needing a CSV file.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveDemoForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Panchayat Name (English)</label>
              <input
                type="text"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Panchayat Name (Telugu)</label>
              <input
                type="text"
                value={demoForm.name_te}
                onChange={(e) => setDemoForm({ ...demoForm, name_te: e.target.value })}
                placeholder="ఉదా: శ్రీరాంనగర్ గ్రామ పంచాయతీ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mandal</label>
              <input
                type="text"
                value={demoForm.mandal}
                onChange={(e) => setDemoForm({ ...demoForm, mandal: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">District</label>
              <input
                type="text"
                value={demoForm.district}
                onChange={(e) => setDemoForm({ ...demoForm, district: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Total Population</label>
              <input
                type="number"
                value={demoForm.population}
                onChange={(e) => setDemoForm({ ...demoForm, population: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Total Wards</label>
              <input
                type="number"
                value={demoForm.total_wards}
                onChange={(e) => setDemoForm({ ...demoForm, total_wards: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Sarpanch Name</label>
              <input
                type="text"
                value={demoForm.sarpanch_name}
                onChange={(e) => setDemoForm({ ...demoForm, sarpanch_name: e.target.value })}
                placeholder="K. Anjaiah"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Sarpanch Phone</label>
              <input
                type="text"
                value={demoForm.sarpanch_phone}
                onChange={(e) => setDemoForm({ ...demoForm, sarpanch_phone: e.target.value })}
                placeholder="+91 94401 XXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Secretary Name</label>
              <input
                type="text"
                value={demoForm.secretary_name}
                onChange={(e) => setDemoForm({ ...demoForm, secretary_name: e.target.value })}
                placeholder="M. Srinivas"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Secretary Phone</label>
              <input
                type="text"
                value={demoForm.secretary_phone}
                onChange={(e) => setDemoForm({ ...demoForm, secretary_phone: e.target.value })}
                placeholder="+91 98480 XXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700">Gram Panchayat Office Address</label>
              <input
                type="text"
                value={demoForm.office_address}
                onChange={(e) => setDemoForm({ ...demoForm, office_address: e.target.value })}
                placeholder="Gram Panchayat Office, Main Road..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingDemo}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs"
            >
              {savingDemo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Demographic Information</span>
                </>
              )}
            </button>

            {demoSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Updated live in Supabase!
              </span>
            )}
          </div>
        </form>
      </div>

    </div>
  );
};
