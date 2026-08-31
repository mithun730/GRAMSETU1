import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Profile, UserRole } from '../types/database';
import { getSupabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/audit';

interface SignUpOptions {
  fullName: string;
  phone?: string;
  role?: UserRole;
  wardNumber?: number;
  panchayatId?: string;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, options: SignUpOptions) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Fallback: create temporary in-memory profile if profiles table not populated yet
        setProfile(prev => prev || {
          id: userId,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Citizen',
          role: (user?.user_metadata?.role as UserRole) || 'villager',
          ward_number: user?.user_metadata?.ward_number || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Profile fetch failed:', err);
    }
  }, [user]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please set your Supabase URL & Anon Key.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error };

      if (data.user) {
        await fetchProfile(data.user.id);
        logAuditEvent({
          action: 'USER_LOGIN',
          entityType: 'auth',
          entityId: data.user.id,
          newData: { email: data.user.email },
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, options: SignUpOptions) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please set your Supabase URL & Anon Key.'), user: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: options.fullName,
            phone: options.phone || '',
            role: options.role || 'villager',
            ward_number: options.wardNumber || 1,
            panchayat_id: options.panchayatId || null,
            designation: options.designation || null,
          }
        }
      });

      if (error) return { error, user: null };

      if (data.user) {
        // Also manually upsert profile record in case the trigger is pending
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: options.fullName,
            phone: options.phone || null,
            role: options.role || 'villager',
            ward_number: options.wardNumber || 1,
            panchayat_id: options.panchayatId || null,
            designation: options.designation || null,
            updated_at: new Date().toISOString()
          });
        } catch (profileErr) {
          console.warn('Manual profile upsert notice:', profileErr);
        }

        await fetchProfile(data.user.id);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err, user: null };
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      return { error: new Error('User not logged in or database not configured') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (!error) {
        await fetchProfile(user.id);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const role: UserRole = profile?.role || (user?.user_metadata?.role as UserRole) || 'villager';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        role,
        isAuthenticated: Boolean(user),
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
