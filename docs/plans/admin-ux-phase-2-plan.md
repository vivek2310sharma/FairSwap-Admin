# FairSwap Admin — Phase 2 Operational UX Plan

Date: 2026-10-18
Status: Owner authorized for **Phase 2B-2E**; Phase 2A complete and merged.
Integration: `staging` (Test) only; no Production release
Baseline: PR #16 merged into `staging`
Implementation lead: Antigravity oversight, Google Jules as scoped frontend implementation agent

## Why

Make FairSwap's Trust & Safety and staff operations more usable than generic classifieds admin tools. Easier inspection and human-readable identity reduce wrong-account actions, help moderators detect fraudulent listings, and shorten response times for Indian marketplace users. Prioritize accurate evidence and least-privilege data access over decorative dashboards.

## Verified starting point

- `/admin/users` already provides name/email/UUID query, account-status filter, pagination, and `listings_count` from `admin_search_users`.
- `/admin/users/[id]` independently authorizes administrator/moderator and verifies the target through `admin_search_users`. It loads at most **30 latest listings**, 30 reports and 30 admin-only audit rows. These caps must never be labelled lifetime totals.
- Existing listing statuses: draft, pending_review, active, reserved, sold, rejected, paused, expired, removed.
- `/admin/staff` currently renders staff UUID/role/assigned_at. Role assignment is UUID-only and uses existing AAL2, audited guarded actions. Do not replace the protected mutation interface.
- `admin_search_users` can return `display_name`, `email`, `user_id`, `role`, `account_status`, and `listings_count` for permitted staff.
- Phase 1 built the shared shell/design system. Reuse it.

## Phase 2A — User Management (first Jules task)

**Affected files (expected):** `src/app/admin/users/page.tsx`, `src/app/admin/users/[id]/page.tsx`, small colocated UI helpers and appropriate tests.

### Experience
1. Make the user list easy to scan: name/email prominently, account status, role, total listings (already returned by the RPC), relative or absolute joined date, clearly styled Inspect User action. Accessible mobile representation and manageable long IDs.
2. Keep current server-side search, account-status filtering and pagination. Do not present unverified overall customer counts; `pageSize+1` only proves next-page existence.
3. In the user detail view, show Total (existing RPC) plus verified Active/Sold/Pending Review/Rejected/Other statistics **only if accuracy and existing staff authorization can be established**. Exact counts may be obtained through bounded, authorized read-only `count: "exact", head: true` queries on `listings` where RLS permits; avoid unbounded downloads and fake zeroes when reads fail. Do not count the 30 latest listings as lifetime breakdown.
4. Add comprehensible status filters and a clear **Recent listings (up to 30)** label unless genuine authorized server-side pagination is implemented. If filter applies only to capped rows, label it honestly.
5. Preserve per-account moderation restrictions and Test/Production capabilities; make disabled actions descriptive rather than clickable-looking. Do not modify existing status mutation actions.
6. Maintain readable Indian date/time and INR display. No email/UUID exposure in logs, screenshots or errors.

### Acceptance
- Admin and moderator can see only existing authorized data; no broader RLS read or elevated bypass.
- All stats are either correct for the full authorized dataset or clearly unavailable; no fabricated totals or charts.
- Filtering and paging retain search state, handle no-result/read-failure properly and do not silently truncate counts.
- Responsive desktop/mobile layouts with accessible labels/focus and obvious actions.
- Tests for status/limited-result truthfulness, filters, role visibility, and current Production disable states.

## Phase 2B — Staff Management

**Affected files (expected):** `src/app/admin/staff/page.tsx`, `src/app/admin/staff/staff-form.tsx`, read-only guarded lookup helper if needed, and tests.

### Experience
1. Administrator-only **search by name/email/UUID** using existing `admin_search_users`, server-verified and bounded. Display unambiguous identity and status; don't grant or revoke by name/email alone.
2. On selecting a search result, require explicit confirmation of email/display name, UUID and target role before invoking the unchanged `assignStaffRoleAction`. The submitted mutation identifier remains the validated UUID. Existing self-protection and AAL2 checks remain enforced server-side.
3. Staff directory should show names/email through authorized reads when possible, with UUID as secondary copyable identifier. If the existing RPC cannot correctly resolve directory members at scale, propose a minimal backend-owned read contract; do **not** build an unbounded N+1 search or use an elevated client.
4. Style assignment/revocation clearly and keep Production mutation disables intact; show current role, assignment date, and role safely.
5. Add tests for ambiguous matches, error/no-result states, role permission boundaries, and privileged mutation confirmation.

## Phase 2C — Audit Trail

**Affected file (expected):** `src/app/admin/audit/page.tsx`

### Experience
1. Create a professional, responsive layout displaying timestamp, actor identity (if safe to resolve), action type, target entity/ID, event summary, and safe details.
2. Provide server-side filtering for action type, target entity, actor ID, and safe pagination. Validate parameters with Zod.
3. Render approved, non-sensitive detail fields. Never indiscriminately expose raw JSON containing secrets.

## Phase 2D — Category Management

**Affected file (expected):** `src/app/admin/categories/page.tsx`

### Experience
1. Implement search by category name/slug, and active/inactive filtering.
2. Create a responsive mobile-friendly list/card view with readable descriptions and attribute summaries.
3. Present existing permitted actions (create, toggle status) safely with clear error handling. Schema editing remains unavailable.

## Phase 2E — Location Management

**Affected files (expected):** `src/app/admin/locations/page.tsx`, `src/lib/admin/locations.ts`

### Experience
1. Provide a searchable city directory with active/inactive state, better grouping, and pagination.
2. Allow safe, efficient inspection of a city's localities beyond the initial 25, via expandable view or dedicated read-only route.
3. Maintain existing city/locality mutation contracts with clearer identifiers for associated localities.

## Security / ownership
- Admin owns interface and its guarded, **read-only** query assembly.
- No schema/migration/RLS/ACL/privileged RPC/Edge Function changes. Backend-owned changes, if truly needed, need a separate security-reviewed proposal in the canonical backend source and all-client impact assessment.
- No production tokens, secrets, private analytics, auth/MFA/policy code changes, CI/dependency changes, or deployments.
- Respect the current server-enforced Production restrictions on listing removal, account status changes, staff role operations and privacy status.
- Use Zod at applicable input boundaries; authorization must remain enforced through existing server guard and Supabase RLS, never UI visibility alone.
- Do not change the existing privileged staff or account-status mutation contracts.

## Work and review sequence
1. Jules Phase 2B-2E UX implementation and tests; PR targeting `staging`, unmerged.
2. Run pinned `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, `pnpm build`; assess 320/390/768/1280px, keyboard access, error/empty states, and authorized Test account roles.
3. Owner reviews then merges Phase 2B-2E to `staging` after Test acceptance.
