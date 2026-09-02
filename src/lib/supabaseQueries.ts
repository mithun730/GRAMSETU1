import { supabase } from '../supabaseClient';
import { 
  Complaint, 
  Question, 
  Project, 
  Expenditure, 
  Fund, 
  Announcement, 
  OfficialDocument, 
  NotificationItem, 
  Profile, 
  Panchayat 
} from '../types/database';

/* ==========================================================================
   1. PROFILE OPERATIONS
   ========================================================================== */

/**
 * Load the currently authenticated user's profile
 */
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as Profile;
}

/**
 * Update the user's profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ==========================================================================
   2. COMPLAINTS (GRIEVANCES) CRUD
   ========================================================================== */

/**
 * Load all complaints for a specific user (or all panchayat complaints if authority)
 */
export async function fetchUserComplaints(userId: string, panchayatId?: string): Promise<Complaint[]> {
  let query = supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (panchayatId) {
    query = query.eq('panchayat_id', panchayatId);
  }

  // Filter by user unless an authority view is querying the whole panchayat
  if (userId) {
    query = query.eq('citizen_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error loading user complaints:', error);
    return [];
  }
  return (data || []) as Complaint[];
}

/**
 * Create a new complaint (tied to auth.uid())
 */
export async function createComplaint(
  complaintData: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Complaint | null; error: string | null }> {
  const { data, error } = await supabase
    .from('complaints')
    .insert([complaintData])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Complaint, error: null };
}

/**
 * Update an existing complaint
 */
export async function updateComplaint(
  complaintId: string,
  updates: Partial<Complaint>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('complaints')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', complaintId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Delete a complaint
 */
export async function deleteComplaint(complaintId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', complaintId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ==========================================================================
   3. QUESTIONS (GRAM SABHA QUERIES) CRUD
   ========================================================================== */

/**
 * Load questions asked by the user
 */
export async function fetchUserQuestions(userId: string, panchayatId?: string): Promise<Question[]> {
  let query = supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (panchayatId) {
    query = query.eq('panchayat_id', panchayatId);
  }
  if (userId) {
    query = query.eq('citizen_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error loading questions:', error);
    return [];
  }
  return (data || []) as Question[];
}

/**
 * Create a new question
 */
export async function createQuestion(
  questionData: Omit<Question, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Question | null; error: string | null }> {
  const { data, error } = await supabase
    .from('questions')
    .insert([questionData])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Question, error: null };
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  questionId: string,
  updates: Partial<Question>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', questionId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ==========================================================================
   4. PROJECTS CRUD
   ========================================================================== */

/**
 * Load all development projects for a panchayat
 */
export async function fetchProjects(panchayatId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('panchayat_id', panchayatId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return (data || []) as Project[];
}

/**
 * Create a new project
 */
export async function createProject(
  projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Project, error: null };
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ==========================================================================
   5. EXPENDITURES CRUD
   ========================================================================== */

/**
 * Load expenditures for a panchayat
 */
export async function fetchExpenditures(panchayatId: string): Promise<Expenditure[]> {
  const { data, error } = await supabase
    .from('expenditures')
    .select('*')
    .eq('panchayat_id', panchayatId)
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenditures:', error);
    return [];
  }
  return (data || []) as Expenditure[];
}

/**
 * Create a new expenditure record
 */
export async function createExpenditure(
  expenditureData: Omit<Expenditure, 'id' | 'created_at'>
): Promise<{ data: Expenditure | null; error: string | null }> {
  const { data, error } = await supabase
    .from('expenditures')
    .insert([expenditureData])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Expenditure, error: null };
}

/**
 * Update an expenditure record
 */
export async function updateExpenditure(
  expenditureId: string,
  updates: Partial<Expenditure>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('expenditures')
    .update(updates)
    .eq('id', expenditureId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Delete an expenditure record
 */
export async function deleteExpenditure(expenditureId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('expenditures')
    .delete()
    .eq('id', expenditureId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ==========================================================================
   6. NOTIFICATIONS CRUD
   ========================================================================== */

/**
 * Load user notifications
 */
export async function fetchUserNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data || []) as NotificationItem[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  return !error;
}

/**
 * Delete / dismiss a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  return !error;
}
