# Provenance

Authoritative source repository: [vivek2310sharma/FairSwap-Web](https://github.com/vivek2310sharma/FairSwap-Web).

Pinned reviewed revision: **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**.

The supplied ADMIN-00 handoff records review of Web staging at this exact revision. This closeout uses that handoff as historical code-review evidence; it does not claim fresh source inspection or runtime verification.

Reviewed paths/categories reported in the handoff:

- Existing Web `/admin`: shell/guard, overview, moderation queue/detail, approve/reject/remove, users, reports, support, privacy, staff roles, categories, locations, audit trail.
- Staff auth, MFA, and current policy-acceptance gating.
- Private staff photo/media server-signing route.
- `moderate_listing` RPC, authorization/business rules, transactional audit behavior.
- Backend ownership paths `supabase/migrations/**` and `supabase/tests/**`, and existing Admin test coverage.

## Reported source references

These paths are reported by the original ADMIN-00 review, supplied in the corrected review outcome. They are not fresh inspections. Verify specific details at the pinned revision before extraction.

| Reported source path | Pinned SHA | Evidence |
| --- | --- | --- |
| src/app/admin/layout.tsx | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| src/app/admin/listings/page.tsx | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| src/app/admin/listings/[id]/page.tsx | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| src/app/admin/listings/actions.ts | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| src/app/auth/mfa/page.tsx | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| src/app/api/listings/[id]/media/[mediaId]/[size]/route.ts | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| src/proxy.ts | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |
| supabase/migrations/20260914000008_create_listing_rpcs.sql | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | Reported reference; not freshly inspected |

No application code was copied or adapted during ADMIN-00. Documentation reflects the user-supplied closeout handoff.

## Targeted foundation dependency inspection

For ADMIN-01A, only Web `package.json` at the pinned SHA was freshly inspected to check dependency constraints. It specifies pnpm 10.12.1, Next.js/eslint-config-next 16.3.5, React/react-dom 19.2.8, Zod 3.24.2, Tailwind/PostCSS adapter major 4, TypeScript major 5, ESLint major 9, Vitest ^3.2.4, jsdom ^26.1.0, and Testing Library React ^16.3.0. The Admin foundation retains these relevant constraints and pins its selected versions in package.json and pnpm-lock.yaml. Supabase packages and unrelated Web dependencies are not installed because backend integration is excluded.

The foundation shell/configuration/tests are newly authored for the approved assignment. No Web application source was copied or adapted; the extraction register remains empty. Official framework/tool documentation informed setup: the tagged Next.js 16.3.5 installation guide and installed 16.3.5 documentation under `node_modules/next/dist/docs/` for installation, Vitest, and ESLint were read. Tailwind 4 PostCSS and Zod 3 safeParse documentation were also consulted. No scaffolder was run.

### Reviewed dependency-maintenance exception (2026-10-05)

The user explicitly authorised a bounded tooling correction after foundation review: replace Vitest 3.2.4 with exact stable **4.1.11** and align development runtime requirements to **Node >=24.15.0 <25**, using pnpm 10.12.1. This is a documented exception to the initial Web dependency constraint, not adoption of a new Web source revision. The application framework and all other direct dependency versions remain unchanged. The lockfile changes include the related Vitest packages needed by that version; there is no blanket dependency update or Vitest 5 upgrade.

The [maintainer support notice](https://vitest.dev/releases) lists 4.1 as receiving important/security backports. The [4.1.11 release](https://github.com/vitest-dev/vitest/releases/tag/v4.1.11) includes redirect-mock file-allowlist restriction. Registry metadata identifies 4.1.11 as the latest published stable 4.1 patch at this review. [GHSA-82fw-gwwq-j7x9](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9) identifies the 4.1.11 fix; [GHSA-5xrq-8626-4rwp](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp) identifies fixes in 4.1.0 and 3.2.5. Chosen 4.1.11 contains both fixes. The advisories concern development test-server surfaces; no compromise or Supabase/backend defect was demonstrated here. The project retains jsdom, non-interactive vitest run, and fetch protections without test UI/API or Browser Mode exposure.

## Future extraction register

Record each source extraction before or alongside implementation:

| Original repository | Source path | Source commit SHA | Destination path | Treatment (copied/adapted/rewritten) | Notes |
| --- | --- | --- | --- | --- | --- |

The register currently has no application-code entries. Record provenance for rewritten source-derived behavior as well as copied/adapted files. Use the pinned revision, not current Web HEAD. A newer source revision requires a separately reviewed provenance update; retain the history and describe why the revision changed.

## ADMIN-01B source-derived behavior (2026-10-05)

The following relevant Web files were freshly read through GitHub contents APIs at the pinned commit, never current HEAD. Treatment is rewritten unless noted; no Web/backend file was changed. This register supplements the empty historical foundation extraction register above.

| Original repository | Source path | Source commit SHA | Destination path | Treatment and intentional differences |
| --- | --- | --- | --- | --- |
| vivek2310sharma/FairSwap-Web | package.json; pnpm-lock.yaml | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | package.json; pnpm-lock.yaml | Adapted relevant exact Supabase versions only: SSR 0.12.7 and supabase-js 2.116.0; added server-only 0.0.1, unrelated dependencies unchanged |
| vivek2310sharma/FairSwap-Web | src/app/auth/actions.ts; src/app/auth/sign-in/page.tsx | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | src/lib/auth/inputs.ts; src/lib/auth/mutations.ts; src/app/auth/actions.ts; src/app/auth/sign-in/page.tsx; src/components/auth-forms.tsx | Rewritten email/password sign-in only; no signup/OTP/reset; generic errors, strict redirect destination and POST origin checks |
| vivek2310sharma/FairSwap-Web | src/app/auth/mfa/page.tsx | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | src/app/auth/mfa/page.tsx; src/lib/auth/mutations.ts; src/components/auth-forms.tsx | Rewritten server-side own-factor bootstrap/challenge; no render-time enrollment, replacement/deletion, raw diagnostic or unsafe QR insertion; manually entered setup key; fresh verified AAL2 after challenge |
| vivek2310sharma/FairSwap-Web | src/lib/supabase/server.ts; src/lib/supabase/client.ts; src/lib/supabase/request-auth.ts; src/proxy.ts | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | src/lib/supabase/client.ts; src/lib/supabase/server.ts; src/lib/auth/runtime-config.ts; src/proxy.ts; src/lib/auth/guard.ts | Rewritten SSR cookie refresh and verified identity; server-only clients instead of browser tokens, fixed Test transport, no localhost/key fallback, Admin-specific host-only HttpOnly cookies, no shared auth singleton, no bearer endpoint added |
| vivek2310sharma/FairSwap-Web | src/app/admin/layout.tsx; supabase/migrations/20260914000001_create_accounts_and_profiles.sql; supabase/migrations/20260914000002_create_staff_and_security.sql; supabase/tests/schema_security.test.sql | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | src/lib/auth/guard.ts; src/app/admin/page.tsx; src/app/admin/access/route.ts; tests/auth.test.ts | Rewritten self-account/role eligibility and protected guard; only active administrator/moderator, verified email, Test issuer and AAL2; no reliance on layout/navigation, claims metadata or decoded-only session; no backend writes |
| vivek2310sharma/FairSwap-Web | src/lib/compliance/policy-acceptance.ts; src/proxy.ts; supabase/migrations/20260918000021_policy_reacceptance_records.sql | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | src/lib/auth/guard.ts; src/app/admin/page.tsx; src/lib/auth/mutations.ts; tests/auth.test.ts | Rewritten has_current_policy_acceptance boolean contract; only true allows, false requires review, null/malformed/errors/exceptions deny as unavailable; intentionally does not copy Web proxy's log-and-continue admin policy-error behavior |
| vivek2310sharma/FairSwap-Web | README.md; src/app/account/policy-review/page.tsx; src/lib/security/redirect.ts | 8ad67672896a1a11f51009ffddf3bb39ee3cf698 | src/app/admin/page.tsx; src/lib/auth/inputs.ts; docs/runbooks/staff-onboarding-recovery.md | Rewritten fixed Test Web policy journey and manual return with fresh recheck; exact /admin redirect allowlist, no cross-host return URL/token/account transfer, no second consent implementation |

Verified source contracts: authenticated users have SELECT on user_accounts and staff_roles, with self-read RLS at AAL1; account_status is active/suspended/deletion_pending/deleted; roles are administrator/moderator/support_agent/content_editor; public.has_current_policy_acceptance() takes no arguments, returns boolean and is executable by authenticated users. These are pinned schema observations, not proof of current live grants/RLS or Auth behavior.

Official [SSR guidance](https://supabase.com/docs/guides/auth/server-side/nextjs), [getClaims reference](https://supabase.com/docs/reference/javascript/auth-getclaims), [TOTP enrollment reference](https://supabase.com/docs/reference/javascript/auth-mfa-enroll), and [signout reference](https://supabase.com/docs/reference/javascript/auth-signout) were read and cross-checked against installed version-matched source/types. SSR 0.12.7 createServerClient/types document request-local cookie adapters and cache headers. auth-js 2.116.0 getClaims verifies signature/expiry using the configured project's keys or Auth verification; Admin additionally checks exact issuer, subject, audience, authenticated JWT role and AAL, and uses getUser for verified identity. No endpoint is derived from token claims. Installed Next.js 16.3.5 Server Actions, cookies and proxy docs informed POST/Origin checks, mutation boundaries, request-time rendering and refresh propagation. server-only 0.0.1 is a boundary marker, not a new runtime framework.

The bounded lockfile adds 11 packages: the three direct dependencies, six Supabase subpackages (auth/functions/postgrest/realtime/storage 2.116.0 and phoenix 0.4.5), cookie 1.1.1 and iceberg-js 0.8.1. Existing package/snapshot versions remain unchanged. Supabase requires Node >=22, compatible with retained Node 24.15.0. Existing build-script allowlist and CI are unchanged. No live SDK operation was executed; tests use synthetic doubles and a controlled transport for real SDK token rejection.

Focused follow-up reads also checked pinned Web supabase/migrations/20260914000016_staff_user_moderation_and_hardening.sql, supabase/migrations/20260916000019_fix_public_rls_staff_helper_execution.sql, and supabase/migrations/20260918000020_legal_acceptance_and_age_audit.sql at 8ad67672896a1a11f51009ffddf3bb39ee3cf698. Their staff-helper/other-account policy and legal-account provisioning changes do not remove the self-account/self-role SELECT contracts used by src/lib/auth/guard.ts. Treatment: source-backed contract verification for the rewritten guard; no backend code copied or changed. Live grants/RLS remain UNVERIFIED.

## Read-only pending review queue (2026-10-07)

The owner separately authorized a live FairSwapTest read-only queue. Web source remained pinned to `8ad67672896a1a11f51009ffddf3bb39ee3cf698`; no backend or Web files were changed.

| Original repository | Source paths at the pinned revision | Admin destination | Treatment |
| --- | --- | --- | --- |
| vivek2310sharma/FairSwap-Web | src/app/admin/listings/page.tsx; src/app/admin/listings/[id]/page.tsx; supabase/migrations/20260914000005_create_listings.sql; supabase/migrations/20260914000006_create_listing_media.sql | src/lib/listings/pending.ts; src/app/admin/listings/page.tsx; src/components/pending-listings.tsx | Rewritten pending_review projection, oldest-submission ordering, seller-name lookup, validated listing details and media status; maximum 100 displayed rows; no decision controls or mutations |
| vivek2310sharma/FairSwap-Web | src/app/api/listings/[id]/media/[mediaId]/[size]/route.ts; src/lib/media/processor.ts; supabase/migrations/20260914000007_create_storage_buckets_and_policies.sql; supabase/migrations/20261002000033_seller_media_management.sql | src/lib/listings/photo.ts; src/app/admin/listings/[listingId]/photos/[mediaId]/route.ts; src/components/listing-photo.tsx | Rewritten medium-derivative delivery only. The Web route's elevated client was deliberately not adopted. Staff-session Storage reads may be denied by existing private-bucket rules; no privileged fallback, original-image access, signed URL or Storage-policy change |
| vivek2310sharma/FairSwap-Web | supabase/migrations/20260914000016_staff_user_moderation_and_hardening.sql; supabase/migrations/20260916000019_fix_public_rls_staff_helper_execution.sql | src/lib/listings/pending.ts; src/lib/listings/photo.ts | Verified pinned listing/media SELECT contracts for active AAL2 staff; reused the existing Admin server guard before request-scoped RLS reads |

Installed Next.js 16.3.5 server/client component, fetching, loading and route-handler documentation informed the implementation. Official Supabase Storage download and access-control documentation informed the non-elevated byte route. Focused application/auth regressions passed (232 tests across three files), as did zero-warning lint, typecheck and the unchanged standard build. The owner observed five pending listings in the real local browser. This does not establish that every private photo is readable, nor validate moderation writes. Historical acceptance statements above are retained as historical evidence.

## Owner-selected full Admin migration source (2026-10-07)

The owner explicitly selected FairSwap-Web **c415d689124f405db56cbe8d7daecde7eeef1c29** for the full existing-feature migration. All new source reads use that exact snapshot. The earlier pinned revisions above remain the provenance of the preserved destination authentication and read-only queue baseline; they are not silently replaced. No source Web or backend files were modified. The migration checklist and precise limitations are in [admin-feature-migration.md](plans/admin-feature-migration.md).

| Source repository | Source paths at c415d689124f405db56cbe8d7daecde7eeef1c29 | Destination / treatment |
| --- | --- | --- |
| vivek2310sharma/FairSwap-Web | src/app/admin/{page,layout}.tsx | src/app/admin/layout.tsx; src/components/admin-overview.tsx; existing admin/page.tsx. Adapted branding/navigation and role-specific cards; retained destination authentication/policy explanation |
| vivek2310sharma/FairSwap-Web | src/app/admin/listings/{page.tsx,actions.ts,[id]/page.tsx,[id]/ModerationActions.tsx} | Existing queue preserved; adapted detail/controller at listings/[listingId]; rewritten action integration in src/lib/admin/mutations.ts. Validated reviewed revision/status; no claim of atomic expected-revision protection |
| vivek2310sharma/FairSwap-Web | src/app/admin/users/{page.tsx,actions.ts,user-status-form.tsx,[id]/page.tsx} | Corresponding Admin paths adapted, with safe pagination/identity binding, existing guard and RPC-only status mutation |
| vivek2310sharma/FairSwap-Web | src/app/admin/reports/{page.tsx,actions.ts,[id]/page.tsx}; src/components/communication/ReportResolutionForm.tsx | Corresponding paths adapted; actual evidence-envelope correction in src/lib/admin/evidence.ts; sanitized errors and pending/confirmation behavior |
| vivek2310sharma/FairSwap-Web | src/app/admin/support/{page.tsx,actions.ts,[id]/page.tsx}; src/components/communication/StaffSupportReplyForm.tsx | Corresponding paths adapted; corrected absent profiles.account_status field, null user IDs and contained transport failures |
| vivek2310sharma/FairSwap-Web | src/app/admin/privacy/{page.tsx,actions.ts}; src/components/communication/ProcessDeletionButton.tsx; src/lib/privacy/deletion-orchestrator.ts | Queue adapted; status integration rewritten. Elevated deletion orchestrator inspected but NOT copied. Deletion is explicitly blocked before any phase; source export has no fulfillment action |
| vivek2310sharma/FairSwap-Web | src/app/admin/actions.ts; src/app/admin/staff/{page.tsx,staff-form.tsx}; src/app/admin/audit/page.tsx | Corresponding paths adapted; role allowlists, validated RPC wrappers, visible revoke feedback and immutable audit read |
| vivek2310sharma/FairSwap-Web | src/app/admin/categories/{page.tsx,actions.ts}; src/app/admin/locations/{page.tsx,actions.ts} | Corresponding paths adapted with visible action feedback; category updates preserve omitted fields; no schema-editor feature invented |
| vivek2310sharma/FairSwap-Web | src/types/{database.ts,listing.ts}; package.json | Types copied from the same snapshot; source icon dependency pinned to lucide-react 0.525.0 without other upgrades |
| vivek2310sharma/FairSwap-Web | tests/unit/admin-auth-and-moderation.test.ts | Inspected redirect, role, query relationship and error/absence themes; retained destination assertions and added actual guard/action/query/form regressions rather than source's static string/simulation tests |

Read-only FairSwapTest pg_proc/pg_policies/information_schema metadata confirmed the existing RPC signatures, relevant implementation role/audit/notification checks, selected table columns and absence of Storage object policies. No SQL mutation, role/grant/RLS change or migration was performed. Source-business rules remain backend-owned. Installed Next.js 16.3.5 server-action, use-server and form guides informed the adaptation. The existing Test-only client, cookie isolation and no-privileged-key policy remain enforced. Normal support/editor sign-in/MFA admission was separately and explicitly owner-approved; the default listing guard remains moderator/administrator-only.

## Approved Test workflow follow-up (2026-10-07)

The preceding no-backend-change paragraph records the migration milestone. The subsequent explicit task and combined owner approval authorized two exact Test backend changes. Their source is FairSwap-Web at c415d689124f405db56cbe8d7daecde7eeef1c29 plus current read-only Test function/trigger/RLS/media metadata. Moderation references across that complete pinned Git tree were inspected, including src/app/admin/listings/actions.ts and tests/security/listings-rls.test.ts; no source Web/iOS/Android caller was changed. Other-platform source callers were not independently available for inspection.

Backend-owned new migrations 20261007153735_admin_pending_medium_download.sql and 20261007153744_atomic_reviewed_moderation.sql are locally checkpointed at da4a2055d9ee41778ef094380eeb4e2bddab3e06 and applied only to FairSwapTest. The new guarded private RPC locks and compares the existing revision/status before calling the preserved legacy implementation; history/audit/notification business rules are not copied into Admin. Treatment in src/lib/admin/mutations.ts: adapt only the RPC name/expected arguments and fixed PT409 conflict feedback, retaining existing server authorization, final observation and no automatic retry/fallback. Photo bytes still use the unchanged guarded, pending-only staff-session route; only its backend medium-download policy was added. The other Admin edits clarify unavailable export/deletion/schema editing and add focused role/update/conflict regressions. Actual outcomes and limitations are in docs/plans/admin-test-workflow-completion.md; database locking and real mutation side effects are not claimed proven by mocked tests.
