import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn, AlertCircle, Shield, CheckCircle2, ArrowRight, MailCheck } from 'lucide-react';

interface SignInProps {
  onSuccess?: () => void;
  onNavigateToSignUp?: () => void;
  initialEmail?: string;
  registeredSuccess?: boolean;
}

export const SignIn: React.FC<SignInProps> = ({ 
  onSuccess, 
  onNavigateToSignUp,
  initialEmail,
  registeredSuccess 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signupSuccessNotice, setSignupSuccessNotice] = useState<string | null>(null);

  // Initialize and check query parameters or props for pre-filled email and signup success
  useEffect(() => {
    let emailToSet = initialEmail || '';
    let isRegistered = Boolean(registeredSuccess);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryEmail = params.get('email');
      const queryRegistered = params.get('registered') === 'true' || params.get('signup') === 'success';

      if (queryEmail && !emailToSet) {
        emailToSet = queryEmail;
      }
      if (queryRegistered) {
        isRegistered = true;
      }
    }

    if (emailToSet) {
      setEmail(emailToSet);
    }

    if (isRegistered) {
      setSignupSuccessNotice(
        'Your account has been created. Please check your email and verify your address before logging in.'
      );
    }
  }, [initialEmail, registeredSuccess]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.session) {
        // Only redirect when a real session exists after login
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
        // Redirect the user to the Home page ("/")
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
        }
      } else {
        setError('No active session found. Please check your credentials or confirm your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign in.');
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
            <h2 className="font-bold text-lg tracking-tight">Gram Setu Sign In</h2>
            <p className="text-xs text-slate-300">Access your citizen or authority portal</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} className="p-6 space-y-4">
        {/* Post-signup confirmation notice */}
        {signupSuccessNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <MailCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registration Successful</span>
            </div>
            <p className="text-emerald-800 font-medium leading-relaxed">
              {signupSuccessNotice}
            </p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Signed in successfully! Redirecting to home...</span>
          </div>
        )}

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
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
        </button>

        {/* Small error message under the form */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {onNavigateToSignUp && (
          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                Sign Up <ArrowRight className="w-3 h-3" />
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default SignIn;
