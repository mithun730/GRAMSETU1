import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Panchayat, Announcement, NotificationItem } from '../types/database';
import { PanchayatStats } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Default initial Gram Panchayat fallback representation without hardcoded figures
const DEFAULT_PANCHO: Panchayat = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Gram Panchayat Portal',
  name_te: 'గ్రామ పంచాయతీ పోర్టల్',
  mandal: '—',
  district: '—',
  state: 'Telangana',
  country: 'India',
  pin_code: '—',
  lgd_code: undefined,
  sarpanch_name: undefined,
  sarpanch_phone: undefined,
  secretary_name: undefined,
  secretary_phone: undefined,
  office_address: undefined,
  contact_email: undefined,
  population: 0,
  total_wards: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface PanchayatContextType {
  panchayat: Panchayat;
  allPanchayats: Panchayat[];
  stats: PanchayatStats;
  announcements: Announcement[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  isLoading: boolean;
  isRealtimeActive: boolean;
  refreshData: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  switchPanchayat: (panchayatId: string) => void;
}

const PanchayatContext = createContext<PanchayatContextType | undefined>(undefined);

export const PanchayatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [panchayat, setPanchayat] = useState<Panchayat>(DEFAULT_PANCHO);
  const [allPanchayats, setAllPanchayats] = useState<Panchayat[]>([DEFAULT_PANCHO]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [stats, setStats] = useState<PanchayatStats>({
    totalFundsSanctioned: null,
    totalFundsReceived: null,
    totalExpenditure: null,
    remainingBalance: null,
    totalProjects: null,
    activeProjects: null,
    completedProjects: null,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    hasFinancialData: false,
    hasProjectData: false,
  });

  const fetchPanchayatData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Panchayats
      const { data: pData } = await supabase.from('panchayats').select('*').order('name');
      if (pData && pData.length > 0) {
        setAllPanchayats(pData as Panchayat[]);
        setPanchayat(pData[0] as Panchayat);
      }

      const activePId = (pData && pData[0]?.id) || DEFAULT_PANCHO.id;

      // 2. Fetch Announcements
      const { data: aData } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (aData) {
        setAnnouncements(aData as Announcement[]);
      }

      // 3. Fetch Notifications if user is logged in
      if (user) {
        const { data: nData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (nData) {
          setNotifications(nData as NotificationItem[]);
        }
      }

      // 4. Calculate real stats from database
      const [fundsRes, projectsRes, expRes, complaintsRes, questionsRes] = await Promise.allSettled([
        supabase.from('funds').select('sanctioned_amount, received_amount').eq('panchayat_id', activePId),
        supabase.from('projects').select('id, status').eq('panchayat_id', activePId),
        supabase.from('expenditures').select('amount, approval_status').eq('panchayat_id', activePId),
        supabase.from('complaints').select('id, status').eq('panchayat_id', activePId),
        supabase.from('questions').select('id, status').eq('panchayat_id', activePId),
      ]);

      let totalSanctioned = 0;
      let totalReceived = 0;
      let hasFunds = false;
      if (fundsRes.status === 'fulfilled' && fundsRes.value.data && fundsRes.value.data.length > 0) {
        hasFunds = true;
        fundsRes.value.data.forEach((f: any) => {
          totalSanctioned += Number(f.sanctioned_amount || 0);
          totalReceived += Number(f.received_amount || 0);
        });
      }

      let totalExp = 0;
      let hasExp = false;
      if (expRes.status === 'fulfilled' && expRes.value.data && expRes.value.data.length > 0) {
        hasExp = true;
        expRes.value.data.forEach((e: any) => {
          if (e.approval_status !== 'rejected') {
            totalExp += Number(e.amount || 0);
          }
        });
      }

      let totProjects = 0;
      let actProjects = 0;
      let compProjects = 0;
      let hasProjects = false;
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data && projectsRes.value.data.length > 0) {
        hasProjects = true;
        totProjects = projectsRes.value.data.length;
        actProjects = projectsRes.value.data.filter((p: any) => p.status === 'in_progress' || p.status === 'approved').length;
        compProjects = projectsRes.value.data.filter((p: any) => p.status === 'completed').length;
      }

      let totComplaints = 0;
      let resComplaints = 0;
      let pendComplaints = 0;
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data) {
        totComplaints = complaintsRes.value.data.length;
        resComplaints = complaintsRes.value.data.filter((c: any) => c.status === 'resolved').length;
        pendComplaints = complaintsRes.value.data.filter((c: any) => c.status === 'pending' || c.status === 'under_review' || c.status === 'in_progress').length;
      }

      let totQuestions = 0;
      let ansQuestions = 0;
      if (questionsRes.status === 'fulfilled' && questionsRes.value.data) {
        totQuestions = questionsRes.value.data.length;
        ansQuestions = questionsRes.value.data.filter((q: any) => q.status === 'answered').length;
      }

      const hasFinancialData = hasFunds || hasExp;

      setStats({
        totalFundsSanctioned: hasFinancialData ? totalSanctioned : null,
        totalFundsReceived: hasFinancialData ? totalReceived : null,
        totalExpenditure: hasFinancialData ? totalExp : null,
        remainingBalance: hasFinancialData ? Math.max(0, totalReceived - totalExp) : null,
        totalProjects: hasProjects ? totProjects : null,
        activeProjects: hasProjects ? actProjects : null,
        completedProjects: hasProjects ? compProjects : null,
        totalComplaints: totComplaints,
        resolvedComplaints: resComplaints,
        pendingComplaints: pendComplaints,
        totalQuestions: totQuestions,
        answeredQuestions: ansQuestions,
        hasFinancialData,
        hasProjectData: hasProjects,
      });
    } catch (err) {
      console.warn('Error fetching Panchayat metrics from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPanchayatData();

    // Supabase Realtime Listeners
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    try {
      const channel = supabase
        .channel('gramsetu_realtime_stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          fetchPanchayatData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
          fetchPanchayatData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenditures' }, () => {
          fetchPanchayatData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          fetchPanchayatData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          fetchPanchayatData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeActive(true);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (realtimeErr) {
      console.warn('Realtime subscription notification:', realtimeErr);
    }
  }, [fetchPanchayatData]);

  const markNotificationAsRead = async (id: string) => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const switchPanchayat = (panchayatId: string) => {
    const found = allPanchayats.find(p => p.id === panchayatId);
    if (found) {
      setPanchayat(found);
      fetchPanchayatData();
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  return (
    <PanchayatContext.Provider
      value={{
        panchayat,
        allPanchayats,
        stats,
        announcements,
        notifications,
        unreadNotificationCount,
        isLoading,
        isRealtimeActive,
        refreshData: fetchPanchayatData,
        markNotificationAsRead,
        switchPanchayat,
      }}
    >
      {children}
    </PanchayatContext.Provider>
  );
};

export function usePanchayat() {
  const context = useContext(PanchayatContext);
  if (!context) {
    throw new Error('usePanchayat must be used within a PanchayatProvider');
  }
  return context;
}
