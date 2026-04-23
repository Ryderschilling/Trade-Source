import { createAdminClient } from '@/lib/supabase/admin';
import { DataTable } from '@/components/admin/data-table';
import { emailSendColumns, type EmailSendRow } from '@/components/admin/email-send-columns';

async function getEmailSends(): Promise<EmailSendRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('email_sends')
    .select('id, kind, to_email, status, resend_id, error, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailSendRow[];
}

export default async function AdminEmailSendsPage() {
  const rows = await getEmailSends();
  const failed = rows.filter((r) => r.status !== 'sent').length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Email Send Log</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {rows.length.toLocaleString()} total · {failed} failed
        </p>
      </div>
      <DataTable
        columns={emailSendColumns}
        data={rows}
        searchPlaceholder="Search by kind, email, or status…"
      />
    </div>
  );
}
