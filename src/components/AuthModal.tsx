import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { usePanchayat } from '../context/PanchayatContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { language } = useLanguage();
  const { panchayat } = usePanchayat();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          setSuccessMsg(language === 'te' ? 'విజయవంతంగా లాగిన్ అయ్యారు!' : 'Logged in successfully!');
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
          }
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setErrorMsg('No active session found. Please check your credentials or confirm your email.');
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (!data.session) {
          // If session is null, do NOT redirect or close modal. Just show confirmation message.
          setSuccessMsg(language === 'te' 
            ? 'ఖాతా ధృవీకరణ కోసం మీ ఈమెయిల్‌ను తనిఖీ చేసి, లాగిన్ చేయడానికి ముందు మీ ఖాతాను నిర్ధారించండి.' 
            : 'Check your email and confirm your account before logging in.');
        } else {
          // Real session exists
          setSuccessMsg(language === 'te' ? 'ఖాతా విజయవంతంగా సృష్టించబడింది!' : 'Account registered and logged in successfully!');
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
          }
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
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
                {mode === 'signup' && (language === 'te' ? 'కొత్త ఖాతా నమోదు' : 'Gram Setu Sign Up')}
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
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 text-center transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'signin' ? 'bg-white text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              {language === 'te' ? 'లాగిన్' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 text-center transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'signup' ? 'bg-white text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {language === 'te' ? 'కొత్త నమోదు' : 'Sign Up'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
                required
                minLength={6}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>{language === 'te' ? 'ప్రాసెస్ అవుతోంది...' : 'Processing...'}</span>
              ) : (
                <>
                  {mode === 'signin' && (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{language === 'te' ? 'లాగిన్ చేయండి' : 'Sign In'}</span>
                    </>
                  )}
                  {mode === 'signup' && (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{language === 'te' ? 'ఖాతా నమోదు చేయండి' : 'Sign Up'}</span>
                    </>
                  )}
                  {mode === 'forgot' && <span>{language === 'te' ? 'రీసెట్ లింక్ పంపండి' : 'Send Reset Link'}</span>}
                </>
              )}
            </button>
          </div>

          {/* 4) Small error message under the form */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> {language === 'te' ? 'లాగిన్‌కి తిరిగి వెళ్లండి' : 'Back to Sign In'}
              </button>
            </div>
          )}

        </form>

        {/* Footer Note */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500 text-center">
          Protected by Supabase Auth &bull; Official Digital Panchayat
        </div>

      </div>
    </div>
  );
};

