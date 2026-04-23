import { createAdminClient } from '@/lib/supabase/admin';
import { ContactTable, type ContactMessageRow } from '@/components/admin/contact-columns';

async function getContactMessages(): Promise<ContactMessageRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    body: m.body,
    status: m.status,
    created_at: m.created_at,
  }));
}

export default async function AdminContactPage() {
  const messages = await getContactMessages();

  const unread = messages.filter((m) => m.status === 'new').length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Contact Inbox</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {messages.length.toLocaleString()} total
          {unread > 0 && ` · ${unread} unread`}
        </p>
      </div>

      <ContactTable data={messages} />
    </div>
  );
}
