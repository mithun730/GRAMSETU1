export type UserRole = 'villager' | 'authority' | 'admin';
export type FundStatus = 'sanctioned' | 'received' | 'partially_utilized' | 'fully_utilized';
export type ProjectStatus = 'proposed' | 'approved' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type ComplaintStatus = 'pending' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';
export type QuestionStatus = 'submitted' | 'under_review' | 'answered' | 'closed';
export type ExpenditureStatus = 'pending_approval' | 'approved' | 'rejected';

export interface Panchayat {
  id: string;
  name: string;
  name_te?: string;
  mandal: string;
  district: string;
  state: string;
  country: string;
  pin_code: string;
  lgd_code?: string;
  sarpanch_name?: string;
  sarpanch_phone?: string;
  secretary_name?: string;
  secretary_phone?: string;
  office_address?: string;
  contact_email?: string;
  population: number;
  total_wards: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  panchayat_id?: string;
  ward_number?: number;
  house_number?: string;
  designation?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fund {
  id: string;
  panchayat_id: string;
  funding_source: string;
  scheme_name: string;
  financial_year: string;
  reference_number: string;
  sanctioned_amount: number;
  received_amount: number;
  date_sanctioned?: string;
  date_received?: string;
  purpose: string;
  supporting_document_url?: string;
  status: FundStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  panchayat_id: string;
  fund_id?: string;
  name: string;
  name_te?: string;
  description?: string;
  category: string;
  location: string;
  ward_number?: number;
  estimated_cost: number;
  approved_amount: number;
  amount_spent: number;
  start_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  status: ProjectStatus;
  progress_percentage: number;
  contractor_name?: string;
  before_photos?: string[];
  after_photos?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Expenditure {
  id: string;
  panchayat_id: string;
  project_id?: string;
  fund_id?: string;
  amount: number;
  expense_date: string;
  category: string;
  description: string;
  vendor_name?: string;
  bill_number?: string;
  bill_document_url?: string;
  payment_mode?: string;
  approval_status: ExpenditureStatus;
  approved_by?: string;
  created_by?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  reference_number: string;
  panchayat_id: string;
  citizen_id: string;
  citizen_name: string;
  citizen_phone?: string;
  ward_number?: number;
  title: string;
  description: string;
  category: string;
  location: string;
  attachment_urls?: string[];
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  reference_number: string;
  panchayat_id: string;
  citizen_id: string;
  citizen_name: string;
  ward_number?: number;
  subject: string;
  question_text: string;
  status: QuestionStatus;
  authority_response?: string;
  responded_by?: string;
  responded_at?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficialDocument {
  id: string;
  panchayat_id: string;
  title: string;
  category: string;
  document_number?: string;
  issue_date?: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  is_public: boolean;
  uploaded_by?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  panchayat_id: string;
  title: string;
  title_te?: string;
  content: string;
  content_te?: string;
  category: string;
  is_active: boolean;
  priority: 'normal' | 'high' | 'urgent';
  valid_until?: string;
  created_by?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  panchayat_id?: string;
  title: string;
  message: string;
  link?: string;
  type: 'complaint_update' | 'question_answered' | 'announcement' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  panchayat_id?: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
}
