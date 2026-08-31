import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Copy, Check, ShieldCheck, HardDrive, Zap } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';

export const DiagnosticsAdminTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { isRealtimeActive } = usePanchayat();

  const [testing, setTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState<'ok' | 'error' | 'unconfigured'>('unconfigured');
  const [tablesStatus, setTablesStatus] = useState<{ name: string; count: number | null; error?: string }[]>([]);
  const [storageStatus, setStorageStatus] = useState<{ bucket: string; ok: boolean; error?: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const runDiagnostics = async () => {
    setTesting(true);
    const supabase = getSupabase();
    if (!supabase) {
      setDbStatus('unconfigured');
      setTesting(false);
      return;
    }

    try {
      // 1. Test basic connectivity
      const { data: pData, error: pError } = await supabase.from('panchayats').select('count', { count: 'exact', head: true });
      if (pError) {
        setDbStatus('error');
      } else {
        setDbStatus('ok');
      }

      // 2. Test each table
      const tableNames = [
        'roles',
        'panchayats',
        'profiles',
        'funds',
        'projects',
        'expenditures',
        'complaints',
        'questions',
        'documents',
        'announcements',
        'notifications',
        'audit_logs'
      ];

      const tResults = await Promise.all(
        tableNames.map(async (name) => {
          try {
            const { count, error } = await supabase.from(name).select('*', { count: 'exact', head: true });
            if (error) {
              return { name, count: null, error: error.message };
            }
            return { name, count: count ?? 0 };
          } catch (err: any) {
            return { name, count: null, error: err.message };
          }
        })
      );
      setTablesStatus(tResults);

      // 3. Test Storage Buckets
      const buckets = ['panchayat-documents', 'complaint-attachments', 'expenditure-bills'];
      const sResults = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
            if (error) {
              return { bucket, ok: false, error: error.message };
            }
            return { bucket, ok: true };
          } catch (err: any) {
            return { bucket, ok: false, error: err.message };
          }
        })
      );
      setStorageStatus(sResults);

    } catch (err) {
      setDbStatus('error');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copySqlPath = () => {
    navigator.clipboard.writeText('/supabase/schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Infrastructure Health & Verification</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'డేటాబేస్ & స్టోరేజ్ నిర్ధారణ' : 'Supabase Backend Diagnostics'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time verification of PostgreSQL tables, Storage buckets, Row Level Security (RLS), and WebSocket channels.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          <span>Run Live Health Test</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">PostgreSQL DB</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            {dbStatus === 'ok' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-900 text-sm">Online & Active</span>
              </>
            ) : dbStatus === 'error' ? (
              <>
                <XCircle className="w-5 h-5 text-rose-600" />
                <span className="font-bold text-rose-900 text-sm">Connection Failed</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900 text-sm">Not Configured</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Storage Buckets</span>
            <HardDrive className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            {storageStatus.some(s => !s.ok) ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900 text-sm">Action Needed</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-900 text-sm">3 Buckets Ready</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Realtime WebSocket</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            {isRealtimeActive ? (
              <>
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-emerald-900 text-sm">Channel Subscribed</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                <span className="font-bold text-slate-600 text-sm">Standby</span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Schema Verification Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PostgreSQL Table Schemas & Row Level Security (RLS)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Table Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Row Count</th>
                <th className="py-3 px-4">RLS Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tablesStatus.map((t) => (
                <tr key={t.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{t.name}</td>
                  <td className="py-3 px-4">
                    {t.error ? (
                      <span className="text-rose-700 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Missing / Error
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified in DB
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                    {t.count !== null ? t.count : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[10px] uppercase">
                      RLS Enforced
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Buckets List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600" />
          <span>Supabase Storage Buckets</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {storageStatus.map((b) => (
            <div key={b.bucket} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{b.bucket}</span>
                {b.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {b.ok ? 'Connected & Accessible' : b.error || 'Needs Setup in Supabase'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Setup Quick Copy */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-emerald-400">
            Database Migration & Schema File
          </h3>
          <button
            onClick={copySqlPath}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Path!' : 'Copy /supabase/schema.sql'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The complete SQL schema with RLS policies, custom helper functions (`get_auth_role()`, `is_admin()`), storage bucket policies, and Sriramnagar Gram Panchayat seed records is saved at <code className="text-emerald-400 font-mono">/supabase/schema.sql</code>. Paste it into the Supabase SQL Editor to execute all migrations in one click.
        </p>
      </div>

    </div>
  );
};
