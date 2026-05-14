# Security Audit — 2026-05-13 (Quarterly Run)

**Codebase:** sourceatrade.com (Next.js 16.2.6 App Router + Supabase + Stripe, deployed on Vercel)
**Prior audit:** docs/security-audit-2026-05.md (pre-launch, 25 findings)
**Auditor:** Quarterly automated audit

## Summary

| Severity | Count |
|---|---|
| P0 (ship-stopper) | 0 |
| P1 (fix this week) | 4 |
| P2 (next month) | 7 |
| P3 (backlog) | 3 |
| Total | 14 |

**Headline:** No P0s. The May pre-launch hardening is all still in place — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, callback validation, cron fail-closed, all three tightened RLS migrations (027, 028) — all verified live. The new findings are dependency drift and pre-existing P2 items that are now worth promoting.

---

## Live production checks (all passed)

```
✓ HSTS:               max-age=63072000; includeSubDomains; preload
✓ CSP-Report-Only:    full policy active
✓ X-Frame-Options:    DENY
✓ X-Content-Type:     nosniff
✓ Referrer-Policy:    strict-origin-when-cross-origin
✓ Permissions-Policy: camera=(), microphone=(), geolocation=(self), interest-cohort=()
✓ X-DNS-Prefetch:     on
✓ Open-redirect test: /auth/callback?next=//evil.com → 307 → /login?error=auth_callback_failed
✓ Cron fail-closed:   leaderboard-snapshot, quote-followup, send-scheduled-campaigns all 401 without bearer
✓ security.txt:       HTTP 200
✓ robots.txt:         HTTP 200
✓ TLS:                Let's Encrypt, valid, TLS 1.3
```

---

## P1 — Fix this week (4)

### #1 — npm audit: 1 high + 5 moderate vulnerabilities
**Severity:** P1
**Evidence:**
```
fast-uri <=3.1.1 (HIGH)
  - path traversal via percent-encoded dot segments (GHSA-q3j6-qgpj-74h6)
  - host confusion via percent-encoded authority delimiters (GHSA-v39h-62p7-jpjc)

hono <=4.12.17 (MODERATE x6)
  - JSX HTML injection, bodyLimit bypass, JWT verify weakness, cache cross-user leak

ip-address <=10.1.0 (MODERATE)
  - XSS in Address6 HTML methods, via express-rate-limit

postcss <8.5.10 (MODERATE)
  - XSS via unescaped </style> tag in stringify output, via next 16.2.6
```
**Why now:** fast-uri is the only HIGH; transitive into routing layer. The Hono and ip-address chains are also routing-adjacent. PostCSS is via the framework so depends on Next release cadence.
**Fix:** `npm audit fix` for the auto-fixable ones (fast-uri, hono, ip-address, express-rate-limit). Watch Next.js releases for postcss patch — track but don't force.

### #2 — Profiles table leaks user emails via public SELECT
**Severity:** P1
**Evidence:** `supabase/schema.sql:225`
```sql
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);
```
Profiles table contains the `email` column (line 14). Any anonymous or authenticated client can `select email from public.profiles` and harvest every user's email. Same pattern on `contractors` table — `phone` and `email` columns publicly readable.
**Attack:** trivially scriptable email-harvesting via the Supabase anon client. Direct PII leak. Could enable targeted phishing of your user base.
**Fix:** Replace the broad SELECT policy with: (a) a view `public_profiles` that excludes email/phone, or (b) split the policy so only `auth.uid() = id` returns full row, public sees only non-PII columns. For `contractors`, do the same — public listing pages should query a sanitized view.

### #3 — server-only guard missing on Supabase server client
**Severity:** P1
**Evidence:** `src/lib/supabase/server.ts` — top of file has no `import "server-only";`
**Why it matters:** If a client component ever imports `createServiceClient` (currently it doesn't, but nothing prevents future regression), the import won't fail at build time and the file ends up in the client bundle. The service-role key won't leak (it's not `NEXT_PUBLIC_*`) but the bundle bloat and exception at runtime are bad. The `server-only` import gives a clean build-time error.
**Fix:** Add `import "server-only";` as the first line of `src/lib/supabase/server.ts`.

### #4 — Rate-limit gaps on user-facing mutations
**Severity:** P1
**Evidence:** `@upstash/ratelimit` is only wired into:
- `signIn` / `signUp` / `resetPassword` (auth.ts)
- `submitLead` / `submitMessage` / `submitPackageRequest` (leads.ts)
- `/api/messages`, `/api/quote-request`

Missing on:
- `src/app/actions/reviews.ts` — review submission. Spammable/poison reviews vector.
- `src/app/actions/follow.ts` — follow/unfollow. Can be used for engagement-graph spam.
- `src/app/actions/contractors.ts` — contractor create/update + file uploads. Uploads are bandwidth-expensive.
- `src/app/actions/packages.ts` — package CRUD.
**Fix:** Add Upstash limits: reviews (5/day per user, 1/hr per contractor), follow toggle (30/hr per user), contractor logo/portfolio uploads (10/hr per user), package mutations (20/hr per user).

---

## P2 — Next month (7)

### #5 — CSP still in Report-Only mode
**Status:** Was Report-Only at May launch. Pending a week of clean violation logs. If Vercel logs / browser DevTools have shown zero CSP violations on live traffic for 7+ days, promote `Content-Security-Policy-Report-Only` → `Content-Security-Policy`. Action: read Vercel logs first; if clean, swap the header name in `next.config.ts`.

### #6 — `conversations_insert_auth` policy too loose
**Evidence:** `supabase/migrations/011_messages.sql:61`
```sql
CREATE POLICY "conversations_insert_auth"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```
Any authenticated user can insert orphan conversations (no participant rows yet). After 028 tightened `conversation_participants`, an attacker can't actually inject themselves into others' threads, but they can spam empty conversations for DB bloat or use as a building block.
**Fix:** Either remove the policy and only allow conversation creation via service-role (matches the current code paths), or constrain to a sanity check (e.g., user must be inserting via a trigger that also inserts a participant row).

### #7 — Stripe SDK minor version behind
**Evidence:** `package.json` stripe@22.0.2 → latest 22.1.1
**Fix:** `npm install stripe@22.1.1`. Bug fixes only, no breaking changes per release notes.

### #8 — Supabase JS minor versions behind
**Evidence:**
- `@supabase/supabase-js` 2.103.0 → 2.105.4
- `@supabase/ssr` 0.10.2 → 0.10.3
**Fix:** `npm install @supabase/supabase-js@^2.105.4 @supabase/ssr@^0.10.3`. Test session refresh + RLS queries in dev before deploy.

### #9 — EXIF metadata not stripped from photo uploads
**Status:** Carried over from May audit. Photo uploads in `src/app/actions/contractors.ts` save the raw buffer to Supabase storage. EXIF can include GPS coordinates of where the photo was taken — privacy leak for contractors uploading job-site or property photos.
**Fix:** Add `sharp` (already a common transitive dep) and pipe uploaded images through `sharp().rotate().toBuffer()` to strip EXIF and normalize orientation before writing to storage.

### #10 — Stripe webhook idempotency uses table that may not exist
**Evidence:** `src/app/api/stripe/webhook/route.ts:41` — the idempotency check is wrapped in `try/catch` and silently continues if `stripe_events` insert fails. Migration 023 created the table; if a future migration drops or renames it, duplicate webhook events would silently double-process.
**Fix:** Replace silent catch with a non-fatal warning log + Sentry alert. Better: assert table presence on cold start.

### #11 — Public `contractors` table exposes contact info
**Evidence:** `supabase/schema.sql:235` — `Active contractors are public` policy returns full row including `phone` and `email`.
**Fix:** Same approach as #2 — use a `public_contractors` view that excludes contact fields. Contact info should only be returned when a lead/quote is submitted.

---

## P3 — Backlog (3)

### #12 — ESLint major version behind
ESLint 9.39.4 → 10.3.0. No security implications, just maintenance.

### #13 — TypeScript major version behind
TypeScript 5.9.3 → 6.0.3. Test build before bumping; some type strictness changes.

### #14 — @types/node major mismatch
20.19.39 → 25.7.0. Should align with Node runtime version on Vercel.

---

## Deltas from May 2026 audit

| Item | Status |
|---|---|
| CSP report-only | ✓ Deployed, awaiting promotion to enforce |
| HSTS preload | ✓ Live |
| X-Frame, X-Content, Referrer, Permissions | ✓ Live |
| Migration 027 (stripe_orphans RLS) | ✓ Applied |
| Migration 028 (conv_participants, quote_request_recipients, email_unsubscribes) | ✓ Applied |
| Open-redirect `next=` param | ✓ Validates correctly |
| Cron fail-closed | ✓ All three routes 401 without bearer |
| File-type magic-byte sniff | ✓ Present in contractors.ts |
| SVG rejection | ✓ Present |
| Rate limits on auth + leads | ✓ Present |
| Profiles email exposure (was P2) | ⚠️ Promoted to P1 — should not ship to scale without |
| EXIF stripping (was P3) | ⚠️ Still open, promoted to P2 |

**Improved since May:** ratelimit coverage on lead-adjacent flows, all P0/P1 from May closed.
**Regressed:** dependency drift introduced new high/moderate CVEs (fast-uri, hono, postcss chain).
**Silently dropped:** none.

---

## Recommended PR — P0/P1 fixes in one branch

**Claude Code prompt to paste into Cursor:**

```
Apply the P1 fixes from docs/security-audit-2026-05-13.md as a single PR. Read AGENTS.md and node_modules/next/dist/docs/ before touching next.config.ts or any framework-adjacent code.

Tasks in order:

1. Dependencies — `npm audit fix` (non-breaking only). After fix, re-run `npm audit --omit=dev` and confirm fast-uri, hono, ip-address chains resolved. If `npm audit fix --force` is suggested as the only fix for the postcss-via-next chain, do NOT run it (would downgrade Next). Document deferral.

2. server-only guard — add `import "server-only";` as the first non-comment line of `src/lib/supabase/server.ts`. Run `npm run build` and confirm no client component is silently importing the file (build will fail if so — that's a separate fix you should report, do not paper over).

3. Profile / contractor PII exposure — create migration `029_public_views.sql`:
   - Create `public.public_profiles` view selecting (id, full_name, avatar_url, created_at) — NO email.
   - Create `public.public_contractors` view selecting public-safe columns from contractors — NO email, NO phone (those are revealed only on lead/quote submission).
   - Replace `Public profiles are viewable by everyone` policy with `auth.uid() = id` only — public reads go through the view.
   - Replace `Active contractors are public` policy with `auth.uid() = user_id` only — public reads go through the view.
   - Audit every src/ file that reads from `profiles` or `contractors` for public listing and switch them to the view. Listing pages, contractor cards, profile detail pages.
   - This is HIGH blast radius. Before writing the migration, do a full grep of `.from("profiles")` and `.from("contractors")` in src/ and produce a list of files that need to switch to the view. Confirm with me before applying.

4. Rate limits — add Upstash Ratelimit to:
   - reviews.ts: 5/day per user globally + 1/hr per (user, contractor) for review submission
   - follow.ts: 30/hr per user for follow toggle
   - contractors.ts: 10/hr per user for logo upload + portfolio upload paths
   - packages.ts: 20/hr per user for package mutations
   Use the same Upstash redis client pattern already in auth.ts.

5. Verify locally — `npm run build` must pass. Walk: signup, login, contractor list page, contractor profile page, leave a review, follow toggle, upload a logo. Confirm zero CSP violations in DevTools console.

6. Commit message: "feat(security): quarterly audit 2026-05 P1 fixes (deps, server-only, PII views, ratelimit)"

7. Do NOT auto-merge. Push the branch and link the PR — I'll review before merge.

Output: full diff, npm audit before/after, list of files changed for the public-views migration, any RLS denials observed during local walk-through.
```

**High blast-radius warning:** Item 3 (profile/contractor PII views) touches every public listing query in the app. Gate it on the grep-and-confirm step before the migration is written. If the codebase has many `.from("profiles").select("*")` patterns, split into two PRs: (a) deps + server-only + rate limits; (b) PII views.

---

## What to keep watching

- CSP report-only violations over the next week — if clean, promote to enforce.
- Upstash dashboard — rate limit hits indicate either real attack or your own test traffic.
- Supabase logs — RLS denials post-migration 029 will surface call sites you missed.
- Next.js patch releases — pickup the postcss transitive fix when available.
