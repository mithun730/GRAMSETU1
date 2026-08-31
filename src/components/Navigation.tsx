import React from 'react';
import { 
  LayoutDashboard, 
  Coins, 
  HardHat, 
  Receipt, 
  AlertCircle, 
  HelpCircle, 
  FolderLock, 
  Megaphone, 
  Users, 
  Building, 
  ShieldCheck, 
  Activity,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { VillagerTab, AuthorityTab, AdminTab } from '../types';

interface NavigationProps {
  activeRoleView: 'villager' | 'authority' | 'admin';
  setActiveRoleView: (role: 'villager' | 'authority' | 'admin') => void;
  villagerTab: VillagerTab;
  setVillagerTab: (tab: VillagerTab) => void;
  authorityTab: AuthorityTab;
  setAuthorityTab: (tab: AuthorityTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeRoleView,
  setActiveRoleView,
  villagerTab,
  setVillagerTab,
  authorityTab,
  setAuthorityTab,
  adminTab,
  setAdminTab,
}) => {
  const { t, language } = useLanguage();
  const { role, isAuthenticated } = useAuth();

  const villagerTabs: { id: VillagerTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: t.nav.overview, icon: LayoutDashboard },
    { id: 'funds', label: t.nav.funds, icon: Coins },
    { id: 'projects', label: t.nav.projects, icon: HardHat },
    { id: 'expenditures', label: t.nav.expenditures, icon: Receipt },
    { id: 'complaints', label: t.nav.complaints, icon: AlertCircle },
    { id: 'questions', label: t.nav.questions, icon: HelpCircle },
    { id: 'documents', label: t.nav.documents, icon: FolderLock },
  ];

  const authorityTabs: { id: AuthorityTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: language === 'te' ? 'అధికార డ్యాష్‌బోర్డ్' : 'Executive Overview', icon: LayoutDashboard },
    { id: 'funds', label: language === 'te' ? 'నిధుల నిర్వహణ' : 'Fund Grants Manager', icon: Coins },
    { id: 'projects', label: language === 'te' ? 'పనుల నమోదు & పురోగతి' : 'Development Works', icon: HardHat },
    { id: 'expenditures', label: language === 'te' ? 'ఖర్చుల నమోదు & బిల్లులు' : 'Expenditure Vouchers', icon: Receipt },
    { id: 'complaints', label: language === 'te' ? 'ఫిర్యాదుల పరిష్కారం' : 'Grievance Desk', icon: AlertCircle },
    { id: 'questions', label: language === 'te' ? 'ప్రజా ప్రశ్నలకు సమాధానాలు' : 'Citizen Q&A Desk', icon: HelpCircle },
    { id: 'announcements', label: language === 'te' ? 'గ్రామ ప్రకటనలు' : 'Announcements', icon: Megaphone },
    { id: 'documents', label: language === 'te' ? 'రికార్డుల అప్‌లోడ్' : 'Official Records', icon: FolderLock },
  ];

  const adminTabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'users', label: language === 'te' ? 'వినియోగదారుల పాత్రల నిర్వహణ' : 'Users & Access Control', icon: Users },
    { id: 'panchayat', label: language === 'te' ? 'పంచాయతీ వివరాల కాన్ఫిగరేషన్' : 'Panchayat Settings', icon: Building },
    { id: 'audit', label: language === 'te' ? 'భద్రతా & ఆడిట్ లాగ్స్' : 'Security Audit Trails', icon: ShieldCheck },
    { id: 'diagnostics', label: language === 'te' ? 'డేటాబేస్ నిర్ధారణ' : 'Supabase Diagnostics', icon: Activity },
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[73px] sm:top-[77px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Role View Selector */}
        <div className="flex items-center justify-between pt-3 pb-2 border-b border-slate-100 flex-wrap gap-2">
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              onClick={() => setActiveRoleView('villager')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeRoleView === 'villager'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'te' ? 'గ్రామస్తుల వేదిక' : 'Citizen Portal'}</span>
            </button>

            <button
              onClick={() => setActiveRoleView('authority')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeRoleView === 'authority'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'te' ? 'పంచాయతీ కార్యాలయం' : 'Panchayat Authority'}</span>
            </button>

            <button
              onClick={() => setActiveRoleView('admin')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeRoleView === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'te' ? 'అడ్మిన్ నియంత్రణ' : 'Administrator'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden md:flex items-center gap-2">
            <span>Active Perspective:</span>
            <span className="font-bold text-emerald-700 uppercase tracking-wide">
              {activeRoleView === 'villager' ? t.roles.villager : activeRoleView === 'authority' ? t.roles.authority : t.roles.admin}
            </span>
          </div>

        </div>

        {/* Tab Links */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          
          {activeRoleView === 'villager' &&
            villagerTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = villagerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setVillagerTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

          {activeRoleView === 'authority' &&
            authorityTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = authorityTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAuthorityTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

          {activeRoleView === 'admin' &&
            adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white border border-slate-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

        </div>

      </div>
    </div>
  );
};
