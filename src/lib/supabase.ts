import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'gramsetu_supabase_url';
const STORAGE_KEY_ANON = 'gramsetu_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'custom' | 'none';
}

export function getActiveSupabaseConfig(): SupabaseConfig {
  // 1. Check custom localStorage overrides first
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  if (customUrl && customKey && customUrl.startsWith('http') && customKey.length > 20) {
    return {
      url: customUrl.trim(),
      anonKey: customKey.trim(),
      source: 'custom'
    };
  }

  // 2. Check environment variables
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project-ref') && envUrl.startsWith('http')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      source: 'env'
    };
  }

  return {
    url: '',
    anonKey: '',
    source: 'none'
  };
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabase(): SupabaseClient | null {
  const config = getActiveSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}::${config.anonKey}`;
  if (!supabaseInstance || currentConfigKey !== key) {
    currentConfigKey = key;
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getActiveSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('http') && !config.url.includes('your-project-ref'));
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): boolean {
  if (!url || !anonKey || !url.startsWith('http')) {
    return false;
  }
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  supabaseInstance = null;
  currentConfigKey = '';
  return true;
}

export function clearCustomSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  supabaseInstance = null;
  currentConfigKey = '';
}

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
  panchayatFound: boolean;
  tablesStatus: {
    panchayats: boolean;
    profiles: boolean;
    roles: boolean;
    funds: boolean;
    projects: boolean;
    expenditures: boolean;
    complaints: boolean;
    questions: boolean;
    documents: boolean;
    announcements: boolean;
    notifications: boolean;
    audit_logs: boolean;
  };
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      panchayatFound: false,
      tablesStatus: {
        panchayats: false,
        profiles: false,
        roles: false,
        funds: false,
        projects: false,
        expenditures: false,
        complaints: false,
        questions: false,
        documents: false,
        announcements: false,
        notifications: false,
        audit_logs: false,
      }
    };
  }

  const result: ConnectionTestResult = {
    connected: false,
    message: '',
    panchayatFound: false,
    tablesStatus: {
      panchayats: false,
      profiles: false,
      roles: false,
      funds: false,
      projects: false,
      expenditures: false,
      complaints: false,
      questions: false,
      documents: false,
      announcements: false,
      notifications: false,
      audit_logs: false,
    }
  };

  try {
    // 1. Check panchayats table
    const { data: pData, error: pError } = await client.from('panchayats').select('id, name').limit(1);
    if (!pError) {
      result.tablesStatus.panchayats = true;
      result.connected = true;
      if (pData && pData.length > 0) {
        result.panchayatFound = true;
      }
    } else {
      result.message = `Panchayats query failed: ${pError.message}`;
    }

    // 2. Check remaining tables in parallel
    const checks = await Promise.allSettled([
      client.from('profiles').select('id').limit(1),
      client.from('roles').select('id').limit(1),
      client.from('funds').select('id').limit(1),
      client.from('projects').select('id').limit(1),
      client.from('expenditures').select('id').limit(1),
      client.from('complaints').select('id').limit(1),
      client.from('questions').select('id').limit(1),
      client.from('documents').select('id').limit(1),
      client.from('announcements').select('id').limit(1),
      client.from('notifications').select('id').limit(1),
      client.from('audit_logs').select('id').limit(1),
    ]);

    result.tablesStatus.profiles = checks[0].status === 'fulfilled' && !checks[0].value.error;
    result.tablesStatus.roles = checks[1].status === 'fulfilled' && !checks[1].value.error;
    result.tablesStatus.funds = checks[2].status === 'fulfilled' && !checks[2].value.error;
    result.tablesStatus.projects = checks[3].status === 'fulfilled' && !checks[3].value.error;
    result.tablesStatus.expenditures = checks[4].status === 'fulfilled' && !checks[4].value.error;
    result.tablesStatus.complaints = checks[5].status === 'fulfilled' && !checks[5].value.error;
    result.tablesStatus.questions = checks[6].status === 'fulfilled' && !checks[6].value.error;
    result.tablesStatus.documents = checks[7].status === 'fulfilled' && !checks[7].value.error;
    result.tablesStatus.announcements = checks[8].status === 'fulfilled' && !checks[8].value.error;
    result.tablesStatus.notifications = checks[9].status === 'fulfilled' && !checks[9].value.error;
    result.tablesStatus.audit_logs = checks[10].status === 'fulfilled' && !checks[10].value.error;

    if (result.tablesStatus.panchayats) {
      result.message = 'Supabase successfully connected and PostgreSQL schema verified.';
    }

    return result;
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Connection test failed',
      panchayatFound: false,
      tablesStatus: result.tablesStatus
    };
  }
}
