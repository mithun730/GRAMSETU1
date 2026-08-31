import React, { useState } from 'react';
import { 
  Building2, 
  Globe2, 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanchayat } from '../context/PanchayatContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { SetupAssistantModal } from './SetupAssistantModal';
import { QuickLookupModal } from './QuickLookupModal';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { 
    panchayat, 
    notifications, 
    unreadNotificationCount, 
    markNotificationAsRead,
    isRealtimeActive
  } = usePanchayat();

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isDbConfigured = isSupabaseConfigured();

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
            {t.roles.admin}
          </span>
        );
      case 'authority':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            {profile?.designation || t.roles.authority}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            {t.roles.villager} {profile?.ward_number ? `(Ward ${profile.ward_number})` : ''}
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200 shadow-sm">
        
        {/* Top Government Ribbon */}
        <div className="bg-slate-900 px-4 sm:px-8 py-1.5 text-[11px] text-slate-300 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Government of Telangana &bull; Department of Panchayat Raj & Rural Development</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400">
            <span>District: {panchayat.district}</span>
            <span>&bull;</span>
            <span>Mandal: {panchayat.mandal}</span>
            <span>&bull;</span>
            <span>LGD Code: {panchayat.lgd_code || '208492'}</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Panchayat Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
              GS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  <span>{t.appName}</span>
                  {language === 'en' && <span className="text-xs text-slate-500 font-sans font-medium">(గ్రామ సేతు)</span>}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'te' && panchayat.name_te ? panchayat.name_te : panchayat.name}, {panchayat.district}
              </p>
            </div>
          </div>

          {/* Action Buttons & Utilities */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Quick Grievance & Question Status Tracker */}
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 flex items-center gap-1.5 transition-colors"
              title="Track Reference Number"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">{t.header.trackItem}</span>
            </button>

            {/* Supabase Status Chip */}
            <button
              onClick={() => setIsSetupOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isDbConfigured
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 animate-pulse'
              }`}
              title="Supabase Database Status & Setup"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">
                {isDbConfigured ? t.header.connected : t.header.notConnected}
              </span>
              {isRealtimeActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Realtime Active"></span>
              )}
            </button>

            {/* Language Switcher Pill */}
            <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('te')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  language === 'te' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                తెలుగు
              </button>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-900 z-50 overflow-hidden">
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-emerald-400" />
                      {t.header.notifications} ({notifications.length})
                    </span>
                    <button 
                      onClick={() => setIsNotifOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        {language === 'te' ? 'ఎటువంటి కొత్త నోటీసులు లేవు.' : 'No notifications found in database.'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-emerald-50/50 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-600 font-normal leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth / User Profile */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(profile?.full_name || user?.email || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium truncate max-w-[120px]">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-900 z-50 overflow-hidden p-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
                      <p className="font-bold text-sm text-slate-900">{profile?.full_name || 'Citizen'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <div className="mt-2">{getRoleBadge()}</div>
                    </div>

                    <button
                      onClick={() => { setIsSetupOpen(true); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                    >
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      Supabase Diagnostics
                    </button>

                    <button
                      onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t.header.signOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.header.signIn}</span>
              </button>
            )}

          </div>

        </div>

      </header>

      {/* Modals */}
      <SetupAssistantModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
      <QuickLookupModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
