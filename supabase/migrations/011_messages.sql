-- Conversations between users
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Participants in each conversation (supports 1:1 and future group)
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Individual messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Auto-update conversations.updated_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: viewable and updatable by participants only
CREATE POLICY "conversations_select_participants"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert_auth"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Participants: can view own participation and co-participants in same conversation
CREATE POLICY "conversation_participants_select"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR conversation_id IN (
      SELECT cp2.conversation_id FROM conversation_participants cp2
      WHERE cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_insert"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversation_participants_update_own"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: participants can view and insert
CREATE POLICY "messages_select_participants"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_participants"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
