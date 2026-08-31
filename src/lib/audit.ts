import { getSupabase } from './supabase';

export async function logAuditEvent(params: {
  panchayatId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    await supabase.from('audit_logs').insert({
      panchayat_id: params.panchayatId || null,
      user_id: user?.id || null,
      user_email: user?.email || 'Anonymous/System',
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      old_data: params.oldData || null,
      new_data: params.newData || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not record audit log:', err);
  }
}
