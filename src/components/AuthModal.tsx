import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, Shield, AlertCircle, CheckCircle2, User, Phone, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanchayat } from '../context/PanchayatContext';
import { UserRole } from '../types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { t, language } = useLanguage();
  const { signIn, signUp, resetPassword } = useAuth();
  const { panchayat } = usePanchayat();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [wardNumber, setWardNumber] = useState<number>(1);
  const [role, setRole] = useState<UserRole>('villager');
  const [designation, setDesignation] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg(language === 'te' ? 'విజయవంతంగా లాగిన్ అయ్యారు!' : 'Logged in successfully!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, {
          fullName: fullName.trim(),
          phone: phone.trim(),
          wardNumber: Number(wardNumber),
          role,
          panchayatId: panchayat.id,
          designation: designation.trim() || undefined,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg(language === 'te' ? 'ఖాతా సృష్టించబడింది! లాగిన్ చేయవచ్చు.' : 'Account registered in Supabase database! You may now sign in.');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg(language === 'te' ? 'పాస్‌వర్డ్ రీసెట్ లింక్ మీ ఈమెయిల్‌కు పంపబడింది.' : 'Password reset instructions sent to your email.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">
                {mode === 'signin' && (language === 'te' ? 'గ్రామ సేతు లాగిన్' : 'Gram Setu Sign In')}
                {mode === 'signup' && (language === 'te' ? 'కొత్త ఖాతా నమోదు' : 'Citizen / Official Registration')}
                {mode === 'forgot' && (language === 'te' ? 'పాస్‌వర్డ్ రీసెట్' : 'Reset Password')}
              </h3>
              <p className="text-xs text-slate-300">
                {panchayat.name} &bull; {panchayat.district}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher for Signin / Signup */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 text-center transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'signin' ? 'bg-white text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              {language === 'te' ? 'లాగిన్' : 'Sign In'}
            </button>
            <button
              onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 text-center transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'signup' ? 'bg-white text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {language === 'te' ? 'కొత్త నమోదు' : 'Register'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'te' ? 'పూర్తి పేరు' : 'Full Name'} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'te' ? 'ఫోన్ నంబర్' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98480..."
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'te' ? 'వార్డు నంబర్' : 'Ward Number'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={wardNumber}
                      onChange={(e) => setWardNumber(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w}>Ward {w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'te' ? 'వినియోగదారు పాత్ర' : 'Account Role'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="villager">{t.roles.villager}</option>
                  <option value="authority">{t.roles.authority} (Secretary / Sarpanch / Staff)</option>
                  <option value="admin">{t.roles.admin} (System Administrator)</option>
                </select>
              </div>

              {role === 'authority' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'te' ? 'హోదా / డిజిగ్నేషన్' : 'Official Designation'}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Panchayat Secretary, Ward Member"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'te' ? 'ఈమెయిల్ చిరునామా' : 'Email Address'} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {language === 'te' ? 'పాస్‌వర్డ్' : 'Password'} *
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium"
                  >
                    {language === 'te' ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : 'Forgot?'}
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                required
                minLength={6}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>{language === 'te' ? 'ప్రాసెస్ అవుతోంది...' : 'Processing...'}</span>
              ) : (
                <>
                  {mode === 'signin' && (language === 'te' ? 'లాగిన్ చేయండి' : 'Sign In to Portal')}
                  {mode === 'signup' && (language === 'te' ? 'ఖాతా నమోదు పూర్తి చేయండి' : 'Create Supabase Account')}
                  {mode === 'forgot' && (language === 'te' ? 'రీసెట్ లింక్ పంపండి' : 'Send Reset Link')}
                </>
              )}
            </button>
          </div>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
              >
                &larr; {language === 'te' ? 'లాగిన్‌కి తిరిగి వెళ్లండి' : 'Back to Sign In'}
              </button>
            </div>
          )}

        </form>

        {/* Footer Note */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500 text-center">
          Protected by Supabase Row-Level Security &bull; Official Digital Panchayat
        </div>

      </div>
    </div>
  );
};
