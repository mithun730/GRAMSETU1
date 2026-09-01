import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PanchayatProvider, usePanchayat } from './context/PanchayatContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { VillagerTab, AuthorityTab, AdminTab } from './types';

// Villager Portal Views
import { OverviewTab } from './views/villager/OverviewTab';
import { FundsTab } from './views/villager/FundsTab';
import { ProjectsTab } from './views/villager/ProjectsTab';
import { ExpenditureTab } from './views/villager/ExpenditureTab';
import { ComplaintsTab } from './views/villager/ComplaintsTab';
import { QuestionsTab } from './views/villager/QuestionsTab';
import { DocumentsTab } from './views/villager/DocumentsTab';

// Authority Portal Views
import { OverviewAuthorityTab } from './views/authority/OverviewAuthorityTab';
import { ManageFundsTab } from './views/authority/ManageFundsTab';
import { ManageProjectsTab } from './views/authority/ManageProjectsTab';
import { ManageExpenditureTab } from './views/authority/ManageExpenditureTab';
import { ResolveComplaintsTab } from './views/authority/ResolveComplaintsTab';
import { AnswerQuestionsTab } from './views/authority/AnswerQuestionsTab';
import { ManageAnnouncementsTab } from './views/authority/ManageAnnouncementsTab';
import { UploadDocumentsTab } from './views/authority/UploadDocumentsTab';

// Administrator Portal Views
import { DataImportAdminTab } from './views/admin/DataImportAdminTab';
import { UsersAdminTab } from './views/admin/UsersAdminTab';
import { PanchayatAdminTab } from './views/admin/PanchayatAdminTab';
import { AuditAdminTab } from './views/admin/AuditAdminTab';
import { DiagnosticsAdminTab } from './views/admin/DiagnosticsAdminTab';

import { Building2, ShieldCheck, Heart, Sparkles } from 'lucide-react';

const MainApp: React.FC = () => {
  const { role } = useAuth();
  const { language, t } = useLanguage();
  const { panchayat } = usePanchayat();

  // Current route state for simple path routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Role perspective view (allows role switching)
  const [activeRoleView, setActiveRoleView] = useState<'villager' | 'authority' | 'admin'>('villager');

  // Sub-tabs
  const [villagerTab, setVillagerTab] = useState<VillagerTab>('overview');
  const [authorityTab, setAuthorityTab] = useState<AuthorityTab>('overview');
  const [adminTab, setAdminTab] = useState<AdminTab>('data_import');

  // If visiting /signin page directly
  if (currentPath === '/signin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 shadow-xs">
            GS
          </div>
          <h1 className="text-xl font-bold text-slate-900">Gram Setu Digital Panchayat</h1>
          <p className="text-xs text-slate-500">Government of Telangana</p>
        </div>
        <SignIn
          onSuccess={() => navigateTo('/')}
          onNavigateToSignUp={() => navigateTo('/signup')}
        />
        <button
          onClick={() => navigateTo('/')}
          className="mt-6 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
        >
          &larr; Return to Home Page
        </button>
      </div>
    );
  }

  // If visiting /signup page directly
  if (currentPath === '/signup') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 shadow-xs">
            GS
          </div>
          <h1 className="text-xl font-bold text-slate-900">Gram Setu Digital Panchayat</h1>
          <p className="text-xs text-slate-500">Government of Telangana</p>
        </div>
        <SignUp
          onSuccess={() => navigateTo('/')}
          onNavigateToSignIn={() => navigateTo('/signin')}
        />
        <button
          onClick={() => navigateTo('/')}
          className="mt-6 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
        >
          &larr; Return to Home Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Government & Village Header */}
      <Header />

      {/* Main Role & Navigation Bar */}
      <Navigation
        activeRoleView={activeRoleView}
        setActiveRoleView={setActiveRoleView}
        villagerTab={villagerTab}
        setVillagerTab={setVillagerTab}
        authorityTab={authorityTab}
        setAuthorityTab={setAuthorityTab}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        
        {/* VILLAGER PORTAL VIEWS */}
        {activeRoleView === 'villager' && (
          <div>
            {villagerTab === 'overview' && <OverviewTab onNavigate={(tab) => setVillagerTab(tab)} />}
            {villagerTab === 'funds' && <FundsTab />}
            {villagerTab === 'projects' && <ProjectsTab />}
            {villagerTab === 'expenditures' && <ExpenditureTab />}
            {villagerTab === 'complaints' && <ComplaintsTab />}
            {villagerTab === 'questions' && <QuestionsTab />}
            {villagerTab === 'documents' && <DocumentsTab />}
          </div>
        )}

        {/* AUTHORITY PORTAL VIEWS */}
        {activeRoleView === 'authority' && (
          <div>
            {authorityTab === 'overview' && <OverviewAuthorityTab onNavigate={(tab) => setAuthorityTab(tab)} />}
            {authorityTab === 'funds' && <ManageFundsTab />}
            {authorityTab === 'projects' && <ManageProjectsTab />}
            {authorityTab === 'expenditures' && <ManageExpenditureTab />}
            {authorityTab === 'complaints' && <ResolveComplaintsTab />}
            {authorityTab === 'questions' && <AnswerQuestionsTab />}
            {authorityTab === 'announcements' && <ManageAnnouncementsTab />}
            {authorityTab === 'documents' && <UploadDocumentsTab />}
          </div>
        )}

        {/* ADMINISTRATOR PORTAL VIEWS */}
        {activeRoleView === 'admin' && (
          <div>
            {adminTab === 'data_import' && <DataImportAdminTab />}
            {adminTab === 'users' && <UsersAdminTab />}
            {adminTab === 'panchayat' && <PanchayatAdminTab />}
            {adminTab === 'audit' && <AuditAdminTab />}
            {adminTab === 'diagnostics' && <DiagnosticsAdminTab />}
          </div>
        )}

      </main>

      {/* Official Government Footer */}
      <footer className="bg-white text-slate-600 border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200">
            
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  GS
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">{t.appName} (గ్రామ సేతు)</h3>
                  <p className="text-xs text-emerald-600 font-medium">
                    {language === 'te' && panchayat.name_te ? panchayat.name_te : panchayat.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                Official Digital Governance Portal for Gram Panchayat administration, transparent financial disclosure, public development works tracking, and citizen grievance redressal.
              </p>
              <div className="text-[11px] text-slate-400 font-medium">
                Department of Panchayat Raj & Rural Development &bull; Government of Telangana
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Quick Access</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li><button onClick={() => { setActiveRoleView('villager'); setVillagerTab('funds'); }} className="hover:text-emerald-700 transition-colors">Sanctioned Grants & Schemes</button></li>
                <li><button onClick={() => { setActiveRoleView('villager'); setVillagerTab('projects'); }} className="hover:text-emerald-700 transition-colors">Ongoing Development Works</button></li>
                <li><button onClick={() => { setActiveRoleView('villager'); setVillagerTab('expenditures'); }} className="hover:text-emerald-700 transition-colors">Public Expenditure Ledger</button></li>
                <li><button onClick={() => { setActiveRoleView('villager'); setVillagerTab('complaints'); }} className="hover:text-emerald-700 transition-colors">Lodge Citizen Grievance</button></li>
                <li><button onClick={() => { setActiveRoleView('villager'); setVillagerTab('questions'); }} className="hover:text-emerald-700 transition-colors">Ask Sarpanch / Secretary</button></li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Panchayat Office</h4>
              <p className="text-slate-500 leading-relaxed">
                {panchayat.office_address || 'Gram Panchayat Office, Sriramnagar Village, Jagityal Dist, Telangana'}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                Phone: {panchayat.secretary_phone || '+91 98480 76543'}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                PIN: {panchayat.pincode} &bull; LGD: {panchayat.lgd_code || '208492'}
              </p>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div>
              &copy; {new Date().getFullYear()} Gram Setu &bull; Sriramnagar Gram Panchayat. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-700 font-medium">Production Supabase PostgreSQL Backend &bull; Row Level Security Enabled</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PanchayatProvider>
          <MainApp />
        </PanchayatProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
