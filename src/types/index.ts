import { UserRole } from './database';

export type Language = 'en' | 'te';

export type VillagerTab = 'overview' | 'funds' | 'projects' | 'expenditures' | 'complaints' | 'questions' | 'documents';
export type AuthorityTab = 'overview' | 'funds' | 'projects' | 'expenditures' | 'complaints' | 'questions' | 'announcements' | 'documents';
export type AdminTab = 'users' | 'panchayat' | 'audit' | 'diagnostics';

export interface PanchayatStats {
  totalFundsSanctioned: number;
  totalFundsReceived: number;
  totalExpenditure: number;
  remainingBalance: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  totalQuestions: number;
  answeredQuestions: number;
}
