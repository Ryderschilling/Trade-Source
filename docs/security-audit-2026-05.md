# Pre-Launch Security Audit — sourceatrade.com

**Date:** 2026-05-13
**Branch:** `main` @ a444547
**Scope:** Next.js 16.2.3 App Router on Vercel, Supabase Postgres + Storage + Auth, Stripe, Resend, Upstash.

## Severity rubric

| | Meaning |
|---|---|
| P0 | Ship-stopper. Do not launch. |
| P1 | Fix this week, before public launch. |
| P2 | Fix before launch if time permits; otherwise log a deferral with a date. |
| P3 | Nice to have / post-launch cleanup. |

## Findings index

| # | Title | Severity | Area |
|---|---|---|---|
| 1 | Next.js 16.2.3 — six known advisories incl. middleware bypass & SSRF | **P0** | Deps |
| 2 | `stripe_orphans` table missing `ENABLE ROW LEVEL SECURITY` | **P0** | RLS |
| 3 | Open redirect in `/auth/callback?next=…` | **P0** | Auth |
| 4 | No rate limit on `signIn`, `signUp`, `resetPassword` | **P1** | Auth |
| 5 | SVG accepted as logo upload → stored XSS payload | **P1** | Uploads |
| 6 | `submitLead` / `submitMessage` / `submitPackageRequest`: missing authz on `contractor_id` | **P1** | Server actions |
| 7 | `/api/conversations/from-quote` skips authz check | **P1** | API routes |
| 8 | `conversation_participants` INSERT only requires authn → conversation hijack | **P1** | RLS |
| 9 | `email_unsubscribes`: anonymous SELECT and INSERT on whole table | **P1** | RLS |
| 10 | Cron endpoints fail-open when `CRON_SECRET` env var is unset | **P1** | API routes |
| 11 | MIME validation trusts client `File.type` (no magic-byte sniff) | **P1** | Uploads |
| 12 | `signUp` accepts arbitrary `role` from FormData | **P1** | Server actions |
| 13 | `quote_request_recipients` anonymous INSERT | **P1** | RLS |
| 14 | Admin token cookie `secure: false` in dev (acceptable) but no SameSite check | **P2** | Auth |
| 15 | Portfolio photos: no EXIF stripping → GPS leak | **P2** | Uploads |
| 16 | `profiles` SELECT = `true`: full PII (address, phone) world-readable | **P2** | RLS |
| 17 | `user_follows` SELECT = `true`: social graph enumeration | **P2** | RLS |
| 18 | UUID inputs to server actions accepted without Zod validation | **P2** | Server actions |
| 19 | `reviews.submitReview` has no eligibility (interaction) check | **P2** | Server actions |
| 20 | `conversations` POST allows any auth'd user to initiate with any other user | **P2** | API routes |
| 21 | `from-lead` / `from-quote` leak account-existence in response shape | **P2** | API routes |
| 22 | `shadcn` CLI under `dependencies` (should be devDependencies) | **P3** | Deps |
| 23 | No `global-error.tsx` (Next.js defaults are safe in prod, but custom page recommended) | **P3** | PII / errors |
| 24 | CSP still in `Report-Only`; promote to enforce after clean-report week | **P3** | Headers |
| 25 | Supabase PITR posture undocumented | **P2** | Backup |

---

## Detailed findings

### 1. [P0] Next.js 16.2.3 — middleware bypass, SSRF, cache poisoning, DoS

**Evidence:** `npm audit --omit=dev` reports 6 vulnerabilities (2 high, 4 moderate) all in `next@16.2.3`, including:
- GHSA-492v-c6pp-mqqv — Middleware / Proxy bypass via dynamic route parameter injection
- GHSA-267c-6grr-h53f — Middleware bypass via segment-prefetch
- GHSA-26hh-7cqf-hhc6 — Incomplete-fix follow-up to the above
- GHSA-c4j6-fc7j-m34r — SSRF via WebSocket upgrades
- GHSA-mg66-mrh9-m8jx — DoS via Cache Components connection exhaustion
- GHSA-h64f-5h5j-jqjh — DoS in Image Optimization API
- GHSA-wfc6-r584-vfw7 / GHSA-3g8h-86w9-wvmq — RSC / redirect cache poisoning
- GHSA-gx5p-jg67-6x7h — XSS via beforeInteractive scripts

Fix available in `next@16.2.6`.

**Fix:** `npm install next@16.2.6 eslint-config-next@16.2.6` then full smoke test. Run `npm run build` to confirm no breaking changes (16.x → 16.x is patch range).

---

### 2. [P0] `stripe_orphans` missing `ENABLE ROW LEVEL SECURITY`

**Evidence:** [supabase/migrations/024_addon_safety_and_orphans.sql](supabase/migrations/024_addon_safety_and_orphans.sql) creates `stripe_orphans` but does not issue `ALTER TABLE … ENABLE ROW LEVEL SECURITY`. By Supabase default, RLS is **off** on newly created tables in `public` schema, so the table is readable and writable by any authenticated client using the anon key. The table stores failed/reconciled Stripe object metadata (charges, subscriptions, payment intents).

**Impact:** Any logged-in user (including a malicious customer) can `SELECT *` to inspect payment-processing failures with linked `contractor_id`s, or INSERT/DELETE/UPDATE arbitrary rows to corrupt the reconciliation queue.

**Fix:** New migration `027_enable_rls_stripe_orphans.sql`:
```sql
alter table public.stripe_orphans enable row level security;
-- no policies: silent deny for all roles except service_role (the webhook uses createServiceClient).
```

---

### 3. [P0] Open redirect in `/auth/callback?next=…`

**Evidence:** [src/app/auth/callback/route.ts:1-18](src/app/auth/callback/route.ts):
```ts
const next = searchParams.get("next") ?? "/dashboard";
…
return NextResponse.redirect(`${origin}${next}`);
```
A crafted callback URL with `next=//evil.com/phish` redirects an authenticated user off-site immediately after a successful OAuth/magic-link exchange.

**Impact:** Phishing primitive specifically valuable in the auth flow — the user just confirmed identity, then lands on an attacker-controlled lookalike domain.

**Fix:** Require `next` to be a relative path beginning with `/` (and not `//`):
```ts
function safeNext(value: string | null): string {
  if (!value) return "/dashboard";
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  return "/dashboard";
}
const next = safeNext(searchParams.get("next"));
return NextResponse.redirect(`${origin}${next}`);
```

---

### 4. [P1] No rate limit on `signIn`, `signUp`, `resetPassword`

**Evidence:** `@upstash/ratelimit` is wired in [src/app/api/messages/route.ts](src/app/api/messages/route.ts) and [src/app/api/quote-request/route.ts](src/app/api/quote-request/route.ts) but [src/app/actions/auth.ts](src/app/actions/auth.ts) calls none of it. Login/signup/reset can be hit at line rate.

**Impact:** Password brute force, credential stuffing, email enumeration via timing, password-reset spam to harvest valid emails.

**Fix:** Add an Upstash limiter keyed on (action, IP) for each:
- `signIn`: 10 / minute per IP, 50 / hour
- `signUp`: 5 / hour per IP
- `resetPassword`: 5 / hour per IP, 20 / hour per email

Get IP from `headers().get("x-forwarded-for")` (Vercel sets it).

---

### 5. [P1] SVG accepted as logo upload → stored XSS

**Evidence:** [src/app/actions/contractors.ts:56-57](src/app/actions/contractors.ts#L56-L57) `getFileExtension()` returns `"svg"` for `image/svg+xml`. [src/app/join/join-form.tsx:623-634](src/app/join/join-form.tsx#L623-L634) and [src/app/dashboard/edit/edit-form.tsx:355-358](src/app/dashboard/edit/edit-form.tsx#L355-L358) explicitly accept SVG on the client. No SVG sanitizer is in the bundle.

**Impact:** An SVG can contain `<script>…</script>` or `onload=` handlers. Served from `*.supabase.co`, the script runs in that origin — so it cannot read sourceatrade.com cookies, but it can still phish (the URL appears trusted under a contractor profile), steal Supabase session tokens if the victim visits the raw SVG link, and abuse the supabase.co same-origin scope of other contractor assets.

**Fix:** Reject SVG. Allowlist `image/jpeg`, `image/png`, `image/webp` only. Update both client `accept=` attribs and the server `getFileExtension` switch.

---

### 6. [P1] `submitLead` / `submitMessage` / `submitPackageRequest`: no authz on `contractor_id`

**Evidence:**
- [src/app/actions/leads.ts:24-178](src/app/actions/leads.ts#L24-L178) — accepts `contractor_id`, calls `auth.getUser()`, but **never checks the caller has any legitimate relationship to that contractor**, then writes a lead row with service role.
- Same pattern at lines 193-325 (`submitMessage`) and 332-472 (`submitPackageRequest`).

**Impact:** Any authenticated user can spam any contractor's inbox with leads/messages/package-requests, bypassing rate limits configured at the form layer (since these actions are direct).

**Fix:** Confirm `contractor_id` corresponds to an `active` listing and (optionally) rate-limit by `(user.id, contractor_id)` to e.g. 3 / day. Then write through service role as before.

---

### 7. [P1] `/api/conversations/from-quote` missing authz check

**Evidence:** [src/app/api/conversations/from-quote/route.ts](src/app/api/conversations/from-quote/route.ts) accepts `quote_request_id`, fetches the submitter, and starts a conversation between the caller and the submitter — **without verifying the caller is a contractor on `quote_request_recipients` for that quote**.

**Impact:** Any logged-in user can initiate DMs with any quote-request submitter as if they were a recipient contractor.

**Fix:** Before creating the conversation, `SELECT 1 FROM quote_request_recipients qrr JOIN contractors c ON c.id = qrr.contractor_id WHERE qrr.quote_request_id = $1 AND c.user_id = auth.uid()`. Return 403 if not found.

---

### 8. [P1] `conversation_participants` INSERT RLS allows hijack

**Evidence:** [supabase/migrations/011_messages.sql](supabase/migrations/011_messages.sql) defines:
```sql
create policy "conversation_participants_insert"
  on conversation_participants for insert
  with check (auth.uid() is not null);
```
Any authenticated user can insert any `(conversation_id, user_id)` row → inject themselves into existing conversations, or add a third party to a 1:1 chat without consent.

**Impact:** Cross-tenant message disclosure. Once injected, the user can SELECT messages via the participants check.

**Fix:** Replace with a policy that allows insert only when the row's `user_id = auth.uid()` AND the caller already participates (for invite flows the app should do this via service role with explicit checks instead). Concretely:
```sql
drop policy "conversation_participants_insert" on conversation_participants;
create policy "conversation_participants_insert_self_into_new"
  on conversation_participants for insert
  with check (
    user_id = auth.uid()
    and (
      -- empty conversation (creator self-join) OR
      not exists (select 1 from conversation_participants p where p.conversation_id = conversation_participants.conversation_id)
    )
  );
```
And use service role for the second-party insert in `submitLead`/`from-quote`, gated by the authz checks added in #6/#7.

---

### 9. [P1] `email_unsubscribes` open SELECT + anonymous INSERT

**Evidence:** [supabase/migrations/023_admin_platform.sql](supabase/migrations/023_admin_platform.sql):
```sql
create policy "unsubscribe insert by anyone" on email_unsubscribes for insert with check (true);
create policy "unsubscribe read own by email"  on email_unsubscribes for select using (true);
```
Both INSERT and SELECT are wide open.

**Impact:**
- SELECT exposes the entire list of unsubscribed emails → email harvest + churn analytics for a competitor.
- INSERT lets anyone unsubscribe arbitrary emails → griefing / abuse.

**Fix:** Drop both. Replace with service-role-only: no public SELECT; INSERT happens through the public unsubscribe endpoint, which uses a signed token (HMAC of email + secret) so the row is only writable by holders of the unsubscribe link sent in the original email.

---

### 10. [P1] Cron endpoints fail-open without `CRON_SECRET`

**Evidence:** [src/app/api/cron/quote-followup/route.ts:9-15](src/app/api/cron/quote-followup/route.ts), [src/app/api/cron/send-scheduled-campaigns/route.ts:23-26](src/app/api/cron/send-scheduled-campaigns/route.ts), [src/app/api/cron/leaderboard-snapshot/route.ts:8-11](src/app/api/cron/leaderboard-snapshot/route.ts) all guard with:
```ts
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) return 401;
```
The `process.env.CRON_SECRET && …` short-circuit means **if the env var is unset, no check runs**. On Vercel preview deployments or a misconfigured prod, these endpoints become world-callable: send arbitrary mass emails, recompute leaderboards, hammer the DB.

**Fix:** Invert the check — fail closed:
```ts
const secret = process.env.CRON_SECRET;
if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
if (authHeader !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
```

---

### 11. [P1] Upload MIME validation trusts client `File.type`

**Evidence:** [src/app/actions/contractors.ts:153-167](src/app/actions/contractors.ts#L153-L167) uses `file.type.startsWith("image/")` only. No magic-byte sniff. The `file-type` package is not installed.

**Impact:** Attacker uploads `payload.exe` with `Content-Type: image/png` — server stores it, public Supabase URL serves it. Most browsers ignore Content-Type for download, but the stored asset becomes a hosting channel for malware distribution under the trusted sourceatrade.com brand (via the supabase.co URL on a profile).

**Fix:** Add `npm install file-type`. After reading the buffer:
```ts
import { fileTypeFromBuffer } from "file-type";
const sniff = await fileTypeFromBuffer(buffer);
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
if (!sniff || !ALLOWED.has(sniff.mime)) return { error: "Unsupported image format." };
```
Apply to both logo and portfolio paths.

---

### 12. [P1] `signUp` accepts arbitrary `role` from FormData

**Evidence:** [src/app/actions/auth.ts:50-92](src/app/actions/auth.ts#L50-L92) line 66:
```ts
const role = formData.get("role") as string;
```
Then `role` is passed into `options.data` (Supabase user metadata). The `handle_new_user` trigger at [supabase/schema.sql:23-39](supabase/schema.sql#L23-L39) does **not** copy `role` into `public.profiles` (good — defaults to `'homeowner'`). So today this is harmless in practice.

**Impact (defense in depth):** Any code that consults `user_metadata.role` for authz would be trivially bypassable. Also, if the trigger is ever changed to honor metadata, this becomes instant privilege escalation.

**Fix:** Zod-allowlist:
```ts
const role = z.enum(["homeowner", "contractor"]).safeParse(formData.get("role")).data ?? "homeowner";
```
(`admin` is never client-assignable.)

---

### 13. [P1] `quote_request_recipients` anonymous INSERT

**Evidence:** Migration 006 defines:
```sql
create policy "Public insert" on quote_request_recipients for insert with check (true);
```

**Impact:** Anyone (no login required) can INSERT recipient rows linking arbitrary `quote_request_id` ↔ `contractor_id` pairs → spam contractors with phantom "new quote" notifications.

**Fix:** The legitimate creator of these rows is the `/api/quote-request` route (which already uses service role). Drop the public INSERT policy.

---

### 14. [P2] Admin token cookie attributes

**Evidence:** [src/app/admin/login/actions.ts:63-69](src/app/admin/login/actions.ts) sets `secure: process.env.NODE_ENV === "production"`. `httpOnly: true` and `sameSite: 'strict'` are present.

**Impact:** Acceptable. The `secure` flag being off in dev is standard practice (localhost is HTTP). The supabase-ssr cookies inherit Supabase defaults and aren't explicitly overridden.

**Fix:** Optional — explicitly set `httpOnly`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'` in the supabase cookie handler so we control the surface area.

---

### 15. [P2] Portfolio photos: no EXIF stripping

**Evidence:** [src/app/actions/contractors.ts:224-239](src/app/actions/contractors.ts#L224-L239) writes the raw photo buffer to storage. No `sharp`/`exifr`/canvas pass.

**Impact:** GPS coordinates, camera serial, capture timestamp travel with the photo. Contractors uploading job-site photos may inadvertently dox a customer's home location.

**Fix:** Install `sharp` (already widely deployed in Next.js). Pipe photos through `sharp(buffer).rotate().withMetadata({}).toBuffer()` — preserves orientation, drops EXIF. Avatars and logos already get re-encoded via canvas client-side so they're EXIF-clean.

---

### 16. [P2] `profiles` SELECT = `true` exposes PII

**Evidence:** [supabase/schema.sql:224-225](supabase/schema.sql#L224-L225). Migration 020 added `address`, and `phone` is also stored.

**Impact:** Anonymous visitor can `SELECT * FROM profiles` via the anon key. Names, addresses, phones, emails — full PII enumeration of every user.

**Fix:** Tighten to either (a) authenticated-only, or (b) public read of a narrow column list joined to active contractor listings. Option (b) requires a view; option (a) is one line:
```sql
drop policy "Public profiles are viewable by everyone" on profiles;
create policy "Profiles readable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');
```
Verify the public contractor page reads from `contractors`, not `profiles`, before applying.

---

### 17. [P2] `user_follows` SELECT = `true`

**Evidence:** Migration 003 policy `Anyone can view follows` using `true`. Combined with #16 this enables full social-graph reconstruction.

**Fix:** Restrict SELECT to authenticated users; further to "rows where I am follower or following" for tighter privacy.

---

### 18. [P2] Server actions accept raw UUIDs without Zod

**Evidence:** `pauseListing`, `resumeListing`, `deleteContractor`, `submitReview.deleteReview`, `unfollowUser`, `sendFollowRequest`, `trackView`, etc. accept `contractorId`/`followingId`/`reviewId` from FormData with at most a null check.

**Impact:** Low (the authz checks downstream usually catch malformed IDs and Supabase coerces). Defense in depth: prevents SQL-error spew and trims attack surface for future query construction.

**Fix:** Wrap each handler with `z.object({ contractorId: z.string().uuid() }).safeParse(...)`.

---

### 19. [P2] `reviews.submitReview` has no eligibility check

**Evidence:** [src/app/actions/reviews.ts:22-167](src/app/actions/reviews.ts#L22-L167). Any authenticated user can review any contractor (one per contractor).

**Fix:** Require a prior interaction — e.g., a lead or conversation between the user and contractor — before allowing review insert. Or accept the tradeoff and add CAPTCHA at the form layer.

---

### 20. [P2] `/api/conversations` POST: unrestricted initiation

**Evidence:** [src/app/api/conversations/route.ts](src/app/api/conversations/route.ts). Authenticated user can create a conversation with any other user.

**Fix:** Limit initiation to contexts where the recipient has opted in (e.g., contractor listing is `active`, or quote-request recipient relationship exists). Or rate-limit per `(user, target)` to 1 / day.

---

### 21. [P2] Account-existence leakage in `from-lead` / `from-quote` responses

**Evidence:** [src/app/api/conversations/from-lead/route.ts:62-65](src/app/api/conversations/from-lead/route.ts), `from-quote:52-55`. When the lead submitter has no account, the response returns `{ error, contact: { name, email, phone } }`; when they do, the response contains a `conversation_id`. The shape difference reveals whether the email belongs to an account.

**Fix:** Normalize the response shape (always return `{ conversation_id, contact? }` with `contact` populated for both paths, or omit it for both).

---

### 22. [P3] `shadcn` in `dependencies`, not `devDependencies`

**Evidence:** package.json lists `"shadcn": "^4.2.0"` under runtime deps. It is a CLI for generating components and is never imported by app code. It pulls in `@modelcontextprotocol/sdk → hono / fast-uri / ip-address`, which is why `npm audit --omit=dev` flagged 4 transitives.

**Fix:** `npm install -D shadcn` and remove from `dependencies`. Resolves 4 of 6 audit findings without any runtime change.

---

### 23. [P3] No `global-error.tsx` / `error.tsx`

**Evidence:** Only [src/app/contractors/[slug]/error.tsx](src/app/contractors/[slug]/error.tsx) and `not-found.tsx` exist. No app-root error boundary.

**Impact:** Next.js's default in production hides stack traces from the client (so no leak), but the user sees a generic browser-style page. Cosmetic; not a security gap.

**Fix:** Add an app-root `error.tsx` (and `global-error.tsx`) for UX. Confirm `process.env.NODE_ENV === "production"` on Vercel.

---

### 24. [P3] CSP promotion plan

**Evidence:** [next.config.ts](next.config.ts) sets `Content-Security-Policy-Report-Only`. No `report-uri` / `report-to` is configured.

**Status:** As-shipped, violations only land in the user's browser DevTools — we have no telemetry. The earlier PR description noted this and committed to a one-week observation window before flipping to enforce.

**Recommendation before flipping to enforce:**
1. Add a `report-to` / `report-uri` endpoint (Sentry's `/api/reporting`, or a `/api/csp-report` route writing to a Supabase table) so violations are captured server-side.
2. Specifically test Mapbox (used in `react-map-gl`) — its origins (`api.mapbox.com`, `events.mapbox.com`, `*.tiles.mapbox.com`, plus `worker-src 'self' blob:`) are **not yet in the policy**. Almost certainly the first violation you'll see.
3. After a week of clean reports, drop the `-Report-Only` suffix.

---

### 25. [P2] Supabase backup / PITR posture undocumented

**Evidence:** No documentation of the project's tier, PITR setting, or recovery procedure.

**Action items:**
1. Confirm the Supabase project is on a tier that supports PITR (Pro or higher — PITR is not available on Free).
2. In the Supabase Dashboard → Database → Backups, enable PITR with at least 7-day retention.
3. Document the recovery procedure in [docs/runbook-recovery.md](docs/runbook-recovery.md) (separate doc):
   - Locating the PITR restore point in the dashboard
   - Creating a snapshot before any large migration
   - Storage bucket backup approach (Supabase Storage is *not* covered by Postgres PITR — recommend periodic `supabase storage` sync to S3 if portfolio photos are business-critical)
4. Run a tabletop restore-to-staging exercise before launch.

---

## Items checked and OK

- ✅ `.gitignore` excludes `.env*`, `.next`, `.vercel`.
- ✅ Git history (`git log -p --all | grep ...`) contains no leaked secret values — only literal `process.env.X` references.
- ✅ `SUPABASE_SERVICE_ROLE_KEY` usage limited to `src/lib/supabase/server.ts` and `src/lib/supabase/admin.ts`. No `"use client"` file imports either.
- ✅ Stripe webhook verifies signature via `stripe.webhooks.constructEvent` ([src/app/api/stripe/webhook/route.ts:20-29](src/app/api/stripe/webhook/route.ts)) and uses idempotency via `stripe_events` table.
- ✅ Admin route hierarchy correctly server-side gated via JWT in HttpOnly cookie ([src/app/admin/layout.tsx](src/app/admin/layout.tsx) + `verifyAdminToken`).
- ✅ Login error messages use Supabase's generic "Invalid login credentials" (no user-not-found vs wrong-password distinction).
- ✅ Storage bucket RLS (migration 012) correctly scopes uploads by `(storage.foldername(name))[1] = auth.uid()::text`.
- ✅ Server-side file size limits are re-checked after the buffer is read.
- ✅ Storage upload paths are server-generated (UUID + timestamp), so user-controlled filenames cannot escape the user's prefix.
- ✅ No `console.log(req.body)` or password-field logging found.
- ✅ Security headers from prior PR are correctly applied (HSTS, X-Content-Type-Options, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy).
- ✅ `/.well-known/security.txt` served correctly.
- ✅ No CORS overrides on API routes (defaults to same-origin).

---

## Recommended fix order

**This week (P0+P1) — block public launch on these:**
1. Bump Next.js to 16.2.6 (#1)
2. Migration 027: `ENABLE RLS` on `stripe_orphans` (#2)
3. Validate `next` param in auth callback (#3)
4. Migration 028: tighten `email_unsubscribes` + `quote_request_recipients` + `conversation_participants` policies (#8, #9, #13)
5. Auth rate limits via Upstash (#4)
6. Server-side authz on `submitLead`/`submitMessage`/`submitPackageRequest`/`from-quote` (#6, #7)
7. Reject SVG + magic-byte sniff on uploads (#5, #11)
8. Zod-allowlist `role` in signup (#12)
9. Fail-closed cron secret check (#10)

**Before launch (P2):**
10. EXIF stripping for portfolio photos (#15)
11. Tighten `profiles` and `user_follows` SELECT (#16, #17)
12. Eligibility check on reviews; normalize from-lead/from-quote responses (#19, #21)
13. Zod-wrap UUID inputs on server actions (#18)
14. Conversation initiation gating (#20)
15. Enable Supabase PITR + document recovery (#25)

**Post-launch (P3):**
16. Move `shadcn` to devDependencies (#22)
17. Add `global-error.tsx`/`error.tsx` (#23)
18. Promote CSP from Report-Only to enforce after clean-week + Mapbox additions (#24)

---

## Pen-test (manual) recommended before launch

The auditor (me) read the code. Before launch, run an external set of probes:

- Sign up two test users A and B. From A's anon session, attempt SELECT/UPDATE/DELETE on B's `contractors`, `reviews`, `leads`, `conversations`, `messages`, `notifications` rows via the JS client. Expect zero successes.
- From an unauthenticated session, attempt INSERT on every table. Expect failures except `leads`, `quote_requests`, `quote_request_recipients` (until #13 lands), `contact_messages`, `email_unsubscribes` (until #9 lands).
- Try uploading an SVG with `<script>alert('xss')</script>` as a logo. Today: accepted (#5). After fix: rejected.
- Submit 100 reset-password requests for the same email in 60 seconds. Today: all succeed (#4). After fix: rate-limited.
- Hit `/api/cron/leaderboard-snapshot` without `Authorization` header on a deploy where `CRON_SECRET` is intentionally unset. Today: 200 OK (#10). After fix: 500.
