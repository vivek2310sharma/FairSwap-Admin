# ADMIN-01 implementation plan

Status: **ADMIN-01A ACCEPTED and merged; CI-01 merged with successful staging push checks. ADMIN-01B implemented with isolated tests, pending review; live acceptance NOT RUN / UNVERIFIED. ADMIN-01C NOT STARTED / NOT TESTED.** The complete staff workflow is not implemented or tested. Primary implementation environment: Antigravity. Source baseline: Web **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**; follow [provenance](../PROVENANCE.md) for extraction. This plan does not authorize production or backend changes.

## First functional milestone

Deliver one complete workflow: staff sign-in -> TOTP MFA -> protected listing queue -> listing detail -> resized derivative photos -> approve OR reject -> verify resulting state -> verify transactional audit evidence. Removal is not required. Reuse shared backend business rules rather than recreate them in Admin.

Out of scope: user management, reports, support, privacy processing, categories, locations, staff-role administration, audit browsing UI, Web `/admin` removal, production deployment, competing database migrations, and shared Auth configuration changes. Existing Web Admin remains in place.

## Architecture and environments

One separate staff-facing codebase: Next.js App Router, TypeScript, Tailwind CSS, Supabase. One separate Admin Vercel project is planned with distinct Test/Production deployments and proposed hosts `admin-test.fairswap.in` and `admin.fairswap.in`. Hosts, Vercel, and DNS are not configured in ADMIN-00.

Test connects only to FairSwapTest (`wpppxlnbzqynvhpeuavd`). Production connects only to FairSwapProd; production configuration remains out of scope. Validate deployment configuration and fail closed when Test configuration is missing. No fallback to Production and no runtime database dropdown beneath an authenticated session.

ADMIN-01B must enforce effective server-side deployment configuration validation where sessions/clients and protected operations are created or used. It must reject malformed or wrong-project configuration and fail closed before any backend operation. The ADMIN-01A static Test label and build-time validation do not verify this future boundary enforcement; no backend/client/authentication work is authorised in the tooling correction pass.

Admin owns UI, sessions/auth orchestration, workflows, server routes/actions, and Admin tests. Web/Supabase owns migrations, shared schema, RLS, grants, RPC implementations, backend configuration, and backend tests. Any required backend change becomes a separately reviewed Web/backend task with Web/Android/iOS impact review.

Proposed workflow: feature/fix/chore branch from `staging`, PR to `staging`, FairSwapTest verification, reviewed release PR `staging` -> `main`. The reviewed bootstrap authorises one local documentation-only baseline commit on main, local staging from it, and feature/admin-01a-foundation from staging. No push or remote branch creation is authorised; main is not a production application release.

## Authentication, activation, and policy acceptance

Use existing Supabase staff accounts, email/password first factor, and TOTP MFA. No public staff signup, social login, new email OTP, or changes to shared Auth settings. Sign-in and factor enrolment/challenge pages must work before AAL2; avoid circular guards. First-factor enrolment is not by itself a security defect.

Protected operations enforce verified identity, active account, appropriate staff role, and AAL2 at server/backend boundaries. Layout/navigation guards supplement these checks. Only authorized moderator/admin roles can moderate listings. Use Zod for application/server input validation and allow-listed internal `next` redirects; reject open redirects.

Document a supervised process for staff-role assignment, identity verification, first-factor setup, MFA enrolment, activation, and recovery. Operational supervision, recovery identity checks, and reactivation ownership need review; no test users or account changes in closeout.

Preserve the reviewed current FairSwap policy-acceptance requirement. Missing current acceptance must block protected staff workflow with a clear explanation and an approved resolution path through existing policy acceptance handling. Do not automatically accept or silently bypass policy. Review the exact destination and return behavior before implementation; navigation may carry only safe non-secret state, never passwords or session tokens. Sign-in/MFA bootstrap must remain reachable.

## Sessions

Keep Web/Admin cookies host-specific and Test/Production sessions separate. No explicit password/token transfer or credentials in navigation URLs. Supabase JWTs are not intrinsically hostname-bound: validate issuer/project, reject wrong-project tokens, and verify logout affects the intended Admin session. Record any same-project session interactions based on tests rather than assuming host isolation prevents bearer-token reuse.

## Listing workflow

Build the protected pending-review queue and listing detail with clear loading, empty, denied, and failure states. Invoke existing `moderate_listing` for approve/reject. The reported pinned RPC locks the row, blocks self-review, requires active moderator/admin at AAL2, requires ready media for approval, requires rejection/removal reasons, and writes audit evidence in the same transaction. Verify specific contract details at the pinned source before coding; do not implement independent substitutes.

Validate listing identifiers, action, reason, and media size/IDs using Zod at server boundaries. Require a reject reason and show meaningful safe errors. After success, verify listing state using the permitted moderator session. Integration tests verify audit evidence using an authorised administrator AAL2 session. Do not broaden moderator audit access or use a service-role client as evidence of staff permissions or RLS. An audit browsing UI is outside scope. Failed actions must not be represented as successful.

Assess seller edits during `pending_review` and revision races before asserting approval freshness. Determine whether a backend expected-revision guard is needed via a separate Web/backend task. Document stale-review UX; refreshing the UI alone is insufficient.

## Media design gate

**Review credential and signing design before coding this portion.** Do not copy the existing Web media route unchanged. Do not provision elevated credentials or Storage policies as part of closeout. A service-role/secret key is an elevated server credential, not storage-scoped. Select the reviewed approach in a later design decision; keep all secrets server-side.

Server-mediated access must require active authorized moderator/admin at AAL2 before signing. Validate that media belongs to the requested listing. Permit only `thumb`, `medium`, and `large`; reject original and invalid sizes. Show derivatives only, avoid unnecessary bucket paths, use intentionally short-lived URLs, return sensitive responses with `Cache-Control: no-store`, and keep signed URLs out of logs. Possession of a URL permits access until expiry; revocation after issuance is not instantaneous.

## Delivery sequence and current authorisation

- **ADMIN-01A: application foundation (authorised now).** Minimal App Router/TypeScript/Tailwind shell, Zod Test configuration validation, placeholder-only .env.example, and local configuration/component tests. Builds without credentials or Supabase requests. No sign-in, MFA, policy handling, staff/listing queries, moderation, media signing, or live Supabase client initialisation. Foundation changes remain uncommitted for review.
- **ADMIN-01B: staff authentication and authorization (not started; separate approval).** Email/password, TOTP bootstrap, supervised onboarding/recovery, policy blocked-state/resolution, and server authorization/session enforcement.
- **ADMIN-01C: listing moderation and media (not started; separate approval).** Queue/detail, reviewed derivative signing, approve/reject, moderator-session state verification, administrator AAL2 integration-test audit verification, and meaningful security/cross-client tests. Media credential/signing review precedes coding that portion; assess stale-review backend guarantees separately.

The only currently authorised commit is the reviewed documentation baseline. ADMIN-01A checks verify foundation behavior only, not authentication, RLS, or backend security.

## Later test plan

All tests use local/disposable or authorized FairSwapTest data, never Production or real private media. No tests are created or run during ADMIN-00. See [open risks](../risks/admin-extraction.md).

Access tests:

- Unauthenticated and ordinary user denied.
- `support_agent` and `content_editor` denied listing moderation.
- Moderator AAL1 and suspended moderator AAL2 denied.
- Active moderator AAL2 and administrator AAL2 allowed where appropriate.
- Enforce these outcomes at protected server/backend operations, not only navigation.

Moderation integration tests:

- Self-review denied.
- Approve `pending_review` succeeds; non-pending approval denied.
- Approval with unready media denied.
- Reject requires a reason.
- Successful approve/reject produces correct resulting state verified using the permitted moderator session, and audit evidence verified in integration tests using an authorised administrator AAL2 session.
- Failed action creates no success audit evidence, checked using an authorised administrator AAL2 integration-test session. Do not broaden moderator audit access; a service-role client is not evidence that staff permissions or RLS work.
- Investigate existence-oracle errors and stale/concurrent revision behavior through separately owned backend verification.

Media security tests:

- AAL1, unauthorized role, and suspended staff denied.
- Original size refused; invalid size rejected.
- Cross-listing media ID rejected.
- Signing occurs only after staff authorization succeeds and the media record's listing_id matches the requested listing ID. The staff member need not own the listing. Self-review remains prohibited for moderation decisions.
- Sensitive response is `no-store`; URL lifetime is intentionally short.
- No unnecessary bucket-path disclosure or signed URL logging; verify expiry behavior with synthetic derivatives.

Auth/session tests:

- Sign-in and MFA bootstrap usable before AAL2; protected operations require AAL2.
- Safe `next` allow-list works and open redirect is rejected.
- Missing policy acceptance blocks workflow; approved resolution works without automatic acceptance.
- Test cookies not automatically shared with Web; no Web/Admin token handoff.
- Wrong-project token rejected and issuer/project validation correct.
- Logout affects intended Admin session; Test/Production sessions cannot be confused without accessing Production data.
- Missing Test configuration fails closed; no Production fallback.
- No secrets exposed client-side, in URLs, or logs.

Cross-client acceptance tests:

- Approved listings become appropriately visible on Web; rejected listings are not publicly discoverable.
- Android and iOS observe correct shared state.
- Verify realtime where applicable and document actual cache/refresh behavior.
- An Admin mutation alone is not proof of separate Web cache invalidation; choose no unsupported invalidation solution.

Original-file authorization follow-up in Web/backend uses synthetic records and the full unauthenticated/owner/unrelated customer/moderator AAL1/moderator AAL2/admin AAL2/suspended staff matrix. Do not propagate a potential flaw into Admin.

## Acceptance and review gates

Accept ADMIN-01 only after the small workflow succeeds with authorized moderator/admin at AAL2, reject reason handling and state/audit evidence are verified, denied roles/AAL/account states are enforced server-side, policy gating is preserved, derivatives satisfy the reviewed media design, environment/session boundaries pass tests, and Web/Android/iOS observations are recorded. Record test environment, source revision, outcomes, failures, and limitations without sensitive data.

Closeout review precedes coding. Media-design review precedes media coding. Required backend changes require separate review and do not belong in this repository's migration history. Open verification items remain open until evidence supports closure. ADMIN-01 does not include production deployment or retirement of Web `/admin`.

## Current bounded ADMIN-01B implementation and remaining gate

The current explicit assignment authorises feature/admin-01b-auth, request-scoped server-only clients, dynamic sign-in/MFA/protected landing, policy-required versus verification-error states, reusable server authorization, isolated tests, documentation and draft PR publication. Historical delivery/authorization statements above retain their original context. Bootstrap reads only the verified user's own active account and administrator/moderator role at AAL1; protected boundaries require email confirmation, verified Test issuer/project and AAL2, and explicit boolean policy true. Runtime configuration is checked before clients/operations, without local/Production fallback.

Live FairSwapTest acceptance needs separate authorisation after code/security review: existing approved staff accounts, self-read grants/RLS, credentials/expiry, supervised enrollment and existing-factor challenge, policy stale/error/recheck, cookie refresh/redirect persistence, local logout/revocation, and wrong-project/cross-host boundaries. No live acceptance was performed. The proposed onboarding/recovery runbook needs named operational owners and recovery approval. ADMIN-01C remains NOT STARTED / NOT TESTED; all seven backend/security items remain OPEN / UNVERIFIED. Neither ADMIN-01B nor the whole milestone is accepted.
