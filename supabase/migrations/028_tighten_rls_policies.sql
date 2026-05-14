-- 028_tighten_rls_policies.sql
-- Pre-launch RLS hardening (see docs/security-audit-2026-05.md, findings #8, #9, #13).
--
-- The application-layer changes that accompany this migration:
--   * conversation_participants: second-party inserts already go through the
--     service-role client in submitLead/submitMessage/submitPackageRequest and
--     /api/conversations/from-quote, so the tighter policy below only affects
--     end-user clients, which should only ever be inserting themselves.
--   * quote_request_recipients: /api/quote-request creates rows with the
--     service-role client, so removing the anonymous-insert policy does not
--     break the legitimate flow.
--   * email_unsubscribes: writes/reads now exclusively through service-role
--     code paths (unsubscribe link handler validates a signed token).

-- ─── conversation_participants: stop self-inject / hijack ───────────────────
drop policy if exists "conversation_participants_insert" on public.conversation_participants;

create policy "conversation_participants_insert_self"
  on public.conversation_participants for insert
  with check (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.conversation_participants existing
      where existing.conversation_id = conversation_participants.conversation_id
    )
  );

-- ─── quote_request_recipients: remove anonymous insert ──────────────────────
drop policy if exists "Public insert" on public.quote_request_recipients;

-- ─── email_unsubscribes: lock down to service role ──────────────────────────
drop policy if exists "unsubscribe insert by anyone" on public.email_unsubscribes;
drop policy if exists "unsubscribe read own by email" on public.email_unsubscribes;
-- RLS remains enabled with no policies → silent deny for anon and authenticated.
-- The service role (used by the signed-token unsubscribe handler) bypasses RLS.
