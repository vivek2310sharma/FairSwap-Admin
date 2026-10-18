# Admin project rules

## Active assignment — Admin operational UX Phase 2B-2E (2026-10-18)

The FairSwap owner explicitly authorizes **Phase 2B Staff Management UX**, **Phase 2C Audit Trail UX**, **Phase 2D Category Management UX**, and **Phase 2E Location Management UX** as a single coordinated, reviewable Admin-only frontend task. This authorization follows merged Phase 2A PR #16 and supersedes earlier scope restrictions **solely for the Phase 2B-2E work specified in [the Phase 2 plan](docs/plans/admin-ux-phase-2-plan.md)**. All security, release, backend ownership and environment boundaries still apply.

**Permitted within this Phase 2B-2E scoped PR:** accessible responsive layouts, search/filter/navigation UX, role-aware presentation, and **bounded, authorized, read-only** use of existing Supabase tables or `admin_search_users` RPC via the existing guarded page client; appropriate UI/unit tests and documentation. Phase 2B focuses on staff directory readability and safer administrator-only assignment confirmation. Phase 2C focuses on safe filtering and readable audit investigation. Phase 2D focuses on category catalogue discovery. Phase 2E focuses on true city/locality pagination. Never invent data or simulate whole-history filters using truncated subsets.

**Not permitted:** changing auth/MFA, AAL2/policy verification, staff or account authorization, mutation semantics/actions, RPC implementations or signatures, RLS, grants, schema/migrations, Supabase settings, secrets, Production restrictions, CI, dependencies, deployments, or other repositories. Role assignment/revocation **must** continue using the current validated UUID and guarded actions. Do not weaken server checks or use `service_role`/elevated keys to satisfy a UI requirement. If existing reads cannot safely support a feature, document the required backend-owned contract for separate review and display an honest unavailable state.

**Workflow:** Work on one subphase at a time in feature branches rooted in latest `staging`; target `staging`, not `main`; run the pinned typecheck/lint/unit/build checks; review Test role isolation, narrow screens and mobile performance; leave PRs unmerged and do not deploy Production. Antigravity owns architecture/review; Jules is the scoped implementation agent. Preserve existing security and historical notes below.

## Active assignment — Admin UI/UX modernization (2026-10-18)

**Owner authorization for Google Jules — Phase 1, UI only.** Jules may implement a modern, responsive FairSwap Admin application shell, role-aware navigation, dashboard presentation, reusable frontend styling/components, accessibility improvements, and tests directly related to those changes.

This newer assignment supersedes the **2026-10-08 documentation-only housekeeping restriction** only for the specifically permitted Phase 1 UI work. The October 8 scope below remains historical context for that earlier assignment, not a prohibition on this UI task. All existing security, backend ownership, provenance, acceptance, and release boundaries remain in force.

**Permitted changes:**
- Admin layout, sidebar/header/navigation, responsive behavior, and dashboard presentation.
- Reusable UI components, Tailwind/CSS styling, keyboard accessibility, and visual states.
- Scoped UI tests and related documentation.

**Required workflow:**
- Keep Antigravity as the primary architecture and implementation environment; Jules is a scoped supporting implementation agent.
- Create a separate feature branch from `staging`; open a pull request targeting `staging`.
- Preserve role-based navigation visibility and server-side authorization independently.
- Run the repository's existing typecheck, lint, unit-test, and build commands, reporting actual results and unverified checks.
- Leave the PR unmerged until the owner explicitly approves it. Do not deploy Production.

**Not permitted:**
- Changes to authentication, MFA, policy acceptance, permissions, database schema/migrations, Supabase RLS/RPCs, or business actions.
- Changes to environment selection, deployment controls, Vercel settings, GitHub Actions, dependency versions, or lockfiles.
- New permissions, bypasses of Production capability restrictions, use of production credentials, or exposure of secrets/customer data.
- Modifications in other FairSwap repositories or automatic merging/deployment.

This authorization is for implementation and review only; it is not evidence of successful verification or release.

## Ownership and workflow

Antigravity is the primary development environment. One standalone Admin uses Next.js App Router, TypeScript, Tailwind CSS and Supabase. Admin owns UI, auth/session orchestration, routes/actions, tests and application deployment configuration.

FairSwap-Web owns shared schema, RLS, grants, RPC implementations, Supabase configuration, supabase/migrations/** and supabase/tests/**. Do not create Admin migrations or duplicate backend business rules. Backend changes need separate Web review and Web/Android/iOS impact assessment. Web Admin retirement is recorded through PR #109 / b5369f2e19d11177ac45e69633a3310d23d4a9ed; old marketplace /admin URLs are themed HTTP 404s, not redirects.

Separate plan/implementation/verification. Feature/fix/docs branches from staging -> staging PR -> CI/Test verification -> reviewed main PR. main is approved Production source; staging remains Test integration. Normal automatic Preview builds are distinct from explicitly approved Production releases. Preserve Vercel's existing Preview-only ignored-build restriction.

## Environment and session boundaries

Test uses FairSwapTest wpppxlnbzqynvhpeuavd; Production uses FairSwapProd kriuhwppxgxsyyrbjsau. Each deployment validates its exact environment/project pair and platform environment. Branch name and NODE_ENV do not select a backend. Missing/mixed/malformed settings deny access; no fallback or runtime selector. Production requires explicit active release state; maintenance disables access.

Use distinct Test/Production host-only HttpOnly sessions, hosted Secure cookies, environment-specific MFA issuers and fixed marketplace/policy links. No password/token/account handoff in URLs. Same-project JWTs are not intrinsically hostname-bound: verify issuer/project and preserve logout/acceptance limitations. Ordinary feature development has no Production access.

## Authorization and inputs

Enforce verified identity/email, active account, page/action role allowlist, AAL2 and explicit current policy acceptance at protected server/backend boundaries. Navigation/layouts alone are insufficient. Four staff roles retain their scoped access; listing moderation is administrator/moderator only. Use Zod boundary validation, same-origin POST checks and safe redirect allowlists.

Existing staff use email/password and TOTP MFA. No public signup, social login, new email OTP or shared Auth-settings changes. Own-factor bootstrap is permitted at AAL1 before protected data access. Never bypass/automatically accept policy. Supervised activation/enrolment/recovery belongs to named operations/backend owners.

Keep first-release Production server blocks for listing removal, account suspension/reinstatement, staff assignment/revocation and privacy-status changes. Deletion/export fulfillment/category-schema editing remain unavailable. No automatic approval is introduced by housekeeping. Application capability policy does not change independent clients/backend APIs.

## Media and secrets

Current media route is server-mediated, staff-authorized and pending-listing-matched ready medium derivative bytes using nonprivileged session access, private/no-store. No originals or elevated fallback. Avoid paths, signed URLs, tokens and private records in logs. Any future signing/credential design needs separate review; service-role/secret keys are elevated, not storage-scoped. Never expose secrets in browsers.

Do not read real environment/credential files for documentation. Never copy secret values, login links, tokens or authenticated browser artifacts into evidence.

## Provenance, preservation and current scope

Preserve original Web pin 8ad67672896a1a11f51009ffddf3bb39ee3cf698 and later explicitly selected full-migration snapshot in docs/PROVENANCE.md. Record repository/path/SHA/destination/treatment for all source-derived behavior; newer Web HEAD is not implicitly authorized.

Current owner task is documentation/release-history reconciliation and conditional remote cleanup, as scoped in AGENTS.md. Historical bootstrap/authentication permissions describe their original tasks. Preserve all local work, branches and worktrees; no reset/clean/force checkout, published history rewrite, local deletion or garbage collection.

This task permits no application/CI/configuration/dependency changes, database/migration operations, account/role/MFA/policy operations, settings/protection/DNS/alias changes, Production build/release/rollback, artifact deletion, backups or other-application work. Verify deployment mapping and Preview-only build boundary before publication/merge. Every remote deletion requires exact-tip ancestry and dependency checks immediately beforehand.

All seven historical risks remain OPEN / UNVERIFIED. Report actual tests/observations separately; preserve failures and NOT RUN gaps. Backups: Deferred by owner; not configured by this work.
