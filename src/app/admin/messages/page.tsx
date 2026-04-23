import { createAdminClient } from '@/lib/supabase/admin';
import { ConversationsTable, type ConversationRow } from '@/components/admin/conversation-columns';

async function getConversations(): Promise<ConversationRow[]> {
  const supabase = createAdminClient();

  const { data: convs, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  if (!convs?.length) return [];

  // Fetch message counts per conversation
  const { data: counts } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convs.map((c) => c.id));

  const countMap: Record<string, number> = {};
  for (const m of counts ?? []) {
    countMap[m.conversation_id] = (countMap[m.conversation_id] ?? 0) + 1;
  }

  return convs.map((c) => ({
    id: c.id,
    subject: c.subject,
    message_count: countMap[c.id] ?? 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));
}

export default async function AdminMessagesPage() {
  const conversations = await getConversations();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Messages</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {conversations.length.toLocaleString()} conversations
        </p>
      </div>

      <ConversationsTable data={conversations} />
    </div>
  );
}
