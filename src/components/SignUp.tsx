import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, AlertCircle, Shield, CheckCircle2, ArrowLeft, MailCheck } from 'lucide-react';

interface SignUpProps {
  onSuccess?: () => void;
  onNavigateToSignIn?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onNavigateToSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmationNotice(null);
    setSessionSuccess(false);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        // If data.session is null, do NOT redirect to dashboard.
        // Just show: "Check your email and confirm your account before logging in."
        if (!data.session) {
          setConfirmationNotice('Check your email and confirm your account before logging in.');
        } else {
          // Real session exists
          setSessionSuccess(true);
          if (onSuccess) {
            onSuccess();
          }
          // Redirect the user to the Home page ("/")
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Gram Setu Sign Up</h2>
            <p className="text-xs text-slate-300">Create your citizen or authority account</p>
          </div>
        </div>
      </div>

      {/* Form / Notice */}
      <div className="p-6 space-y-4">
        {sessionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">Account created and signed in! Redirecting to home...</span>
          </div>
        )}

        {confirmationNotice ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2.5 font-bold text-emerald-800 text-sm">
                <MailCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Confirmation Email Sent</span>
              </div>
              <p className="text-emerald-800 leading-relaxed font-medium">
                Check your email and confirm your account before logging in.
              </p>
            </div>

            {onNavigateToSignIn && (
              <button
                type="button"
                onClick={onNavigateToSignIn}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Proceed to Sign In</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
            </button>

            {/* Small error message under the form */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {onNavigateToSignIn && (
              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToSignIn}
                    className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Sign In
                  </button>
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;
