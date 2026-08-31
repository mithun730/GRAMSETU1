import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Server, 
  ShieldCheck, 
  Layers, 
  RefreshCw,
  Sparkles,
  Key
} from 'lucide-react';
import { 
  getActiveSupabaseConfig, 
  saveCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  testSupabaseConnection, 
  ConnectionTestResult 
} from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { usePanchayat } from '../context/PanchayatContext';

interface SetupAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupAssistantModal: React.FC<SetupAssistantModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { refreshData } = usePanchayat();

  const config = getActiveSupabaseConfig();
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'guide'>('config');

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.connected) {
        refreshData();
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;
    saveCustomSupabaseConfig(url.trim(), anonKey.trim());
    await handleTestConnection();
  };

  const handleReset = async () => {
    clearCustomSupabaseConfig();
    const fresh = getActiveSupabaseConfig();
    setUrl(fresh.url);
    setAnonKey(fresh.anonKey);
    setTestResult(null);
  };

  const handleCopySql = () => {
    const sqlText = `-- GRAM SETU SCHEMA MIGRATION
-- Run this in your Supabase SQL Editor
-- (Check /supabase/schema.sql for the complete script)`;
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Supabase Backend Infrastructure</h2>
              <p className="text-xs text-slate-300">Real PostgreSQL, Row Level Security, Auth & Storage</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'config' 
                ? 'border-emerald-600 text-emerald-800 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            Credentials & Test
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide' 
                ? 'border-emerald-600 text-emerald-800 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            3-Step Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sql' 
                ? 'border-emerald-600 text-emerald-800 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            SQL Schema Migration
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">

          {/* TAB 1: Config & Live Test */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                testResult?.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                {testResult?.connected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="font-semibold text-base">
                    {testResult?.connected
                      ? 'Live Supabase Database Connected'
                      : 'Supabase Credentials Needed'}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    {testResult?.connected
                      ? testResult.message
                      : 'Connect your real Supabase project by providing your Project URL and Anon Public Key below or setting them in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).'}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveConfig} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="text"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys (anon public)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={testing}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-xs transition-colors flex items-center gap-2"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Save & Test Connection
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                    Test Again
                  </button>

                  {config.source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 text-rose-700 hover:text-rose-900 text-xs font-medium underline"
                    >
                      Clear Custom Overrides
                    </button>
                  )}
                </div>
              </form>

              {/* Verified Tables Checklist */}
              {testResult && testResult.connected && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Supabase PostgreSQL Tables Verification
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {Object.entries(testResult.tablesStatus).map(([table, ok]) => (
                      <div key={table} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                        {ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-mono">{table}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Setup Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="flex gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">Create a Free Supabase Project</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and create a new project. Select region (e.g. India - Mumbai <code>ap-south-1</code>).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900">Run the SQL Migration in SQL Editor</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      In your Supabase dashboard, click <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>. Copy the full contents from the <strong>SQL Schema Migration</strong> tab in this dialog and click <strong>Run</strong>.
                    </p>
                    <p className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      ✓ This automatically creates all tables, RLS policies, trigger functions, storage buckets, and seeds Sriramnagar Gram Panchayat data.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">Copy URL & Anon Key into Gram Setu</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      In Supabase, go to <strong>Project Settings &rarr; API</strong>. Copy the Project URL and <code>anon</code> <code>public</code> key into the Credentials tab of this assistant.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SQL Migration */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">PostgreSQL DDL & RLS Policies (schema.sql)</h4>
                  <p className="text-xs text-slate-500">Run this once in Supabase SQL Editor to provision the complete database.</p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
{`-- Run this full script in Supabase SQL Editor:
-- File: /supabase/schema.sql

-- 1. Tables: panchayats, profiles, funds, projects, expenditures,
--    complaints, questions, documents, announcements, notifications, audit_logs
-- 2. Row Level Security (RLS) policies on all tables
-- 3. Trigger functions for complaint/question ref numbers & project spent sum
-- 4. Supabase Storage buckets (panchayat-documents, complaint-attachments, expenditure-bills)
-- 5. Seed data for Sriramnagar Gram Panchayat (Jagityal Dist, Telangana)`}
              </pre>

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>The complete migration script is stored in <code>/supabase/schema.sql</code> inside the workspace.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Gram Setu &bull; Production Supabase Architecture
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
