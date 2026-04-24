import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationsTable, type NotifRow } from '@/components/admin/notification-columns';

export default async function AdminNotificationsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const notifs: NotifRow[] = data ?? [];
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Notifications</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {notifs.length.toLocaleString()} total · {unread} unread
        </p>
      </div>
      <NotificationsTable data={notifs} />
    </div>
  );
}
