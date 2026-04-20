-- Add status to user_follows for follow request system.
-- Existing rows default to 'accepted' (they were direct follows before this migration).
alter table user_follows
  add column status text not null default 'accepted'
    check (status in ('pending', 'accepted'));

-- Efficient lookup of pending requests by recipient
create index user_follows_pending_idx on user_follows (following_id, status)
  where status = 'pending';
