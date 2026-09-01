import { UserRole } from './database';

export type Language = 'en' | 'te';

export type VillagerTab = 'overview' | 'funds' | 'projects' | 'expenditures' | 'complaints' | 'questions' | 'documents';
export type AuthorityTab = 'overview' | 'funds' | 'projects' | 'expenditures' | 'complaints' | 'questions' | 'announcements' | 'documents';
export type AdminTab = 'data_import' | 'users' | 'panchayat' | 'audit' | 'diagnostics';

export interface PanchayatStats {
  totalFundsSanctioned: number | null;
  totalFundsReceived: number | null;
  totalExpenditure: number | null;
  remainingBalance: number | null;
  totalProjects: number | null;
  activeProjects: number | null;
  completedProjects: number | null;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  totalQuestions: number;
  answeredQuestions: number;
  hasFinancialData: boolean;
  hasProjectData: boolean;
}
