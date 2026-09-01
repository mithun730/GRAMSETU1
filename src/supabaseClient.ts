import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://ycgsoalgbhgulidygzap.supabase.co';
const supabaseKey = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MKE2O8SwG0j4bgLbPa8vnQ_lAN6OO43';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export default supabase;
