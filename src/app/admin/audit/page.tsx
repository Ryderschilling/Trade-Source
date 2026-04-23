import { createAdminClient } from '@/lib/supabase/admin';
import { AuditTable, type AuditRow } from '@/components/admin/audit-columns';

async function getAuditLog(): Promise<AuditRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminAuditPage() {
  const events = await getAuditLog();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Audit Log</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Last {events.length.toLocaleString()} events
        </p>
      </div>

      <AuditTable data={events} />
    </div>
  );
}
