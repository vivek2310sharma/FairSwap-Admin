# Agent instructions

## Active assignment — Admin operational UX Phase 2 (2026-10-18)

The FairSwap owner explicitly authorizes **Phase 2A User Management UX** and **Phase 2B Staff Management UX** as separate, reviewable Admin-only frontend tasks. This authorization follows merged Phase 1 PR #13 and supersedes its Phase-1-only scope restriction **solely for the Phase 2A/2B work specified in [the Phase 2 plan](docs/plans/admin-ux-phase-2-plan.md)**. The October 8 housekeeping rules and Phase 1 task limits remain historical; all security, release, backend ownership and environment boundaries still apply.

**Permitted within the relevant, separately scoped Phase 2 PR:** accessible responsive layouts, search/filter/navigation UX, role-aware presentation, and **bounded, authorized, read-only** use of existing Supabase tables or `admin_search_users` RPC via the existing guarded page client; appropriate UI/unit tests and documentation. Phase 2A focuses on user search/details and truthful listing-status counts. Phase 2B focuses on administrator-only user selection and staff directory readability. Never invent statistics; distinguish capped recent rows from whole-history counts.

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

Read [.agents/rules/admin.md](.agents/rules/admin.md), [progress](docs/PROGRESS.md), [ADMIN-01 history](docs/plans/admin-01-plan.md), [open risks](docs/risks/admin-extraction.md) and [release runbook](docs/runbooks/production-release.md) before work. Preserve the original Web pin and later explicitly approved migration provenance in [PROVENANCE](docs/PROVENANCE.md).

This is a released Next.js App Router application, installed version 16.3.5. Read the matching node_modules/next/dist/docs guides before implementation; do not assume latest documentation matches. Keep pinned toolchain, dependencies, lockfile and CI protections.

Antigravity remains the primary implementation environment. Separate planning, authorized implementation and actual verification. Historical ADMIN-00/01A/01B assignment restrictions and untested results remain historical evidence, not the current assignment or proof of complete acceptance.

## Current housekeeping authorization — 2026-10-08

The owner authorizes Admin-only documentation updates, an isolated documentation branch/worktree, commits/pushes, PRs, normal history-preserving merges and conditional deletion of the named merged remote branches. Reconcile main to the already-running source plus reviewed documentation; keep staging as Test integration. Keep all local branches/worktrees, dirty/untracked/ignored files and evidence intact.

Before publication/merge, verify the current Production deployment/source, complete application/configuration equality and Vercel main Production branch with its Preview-only ignored-build restriction. If unexpected application changes or Production-impact uncertainty exists, continue safe local documentation but stop the affected publication/merge.

Delete only authorized remote candidates after exact-tip ancestry in retained main, merged/preserved work, absence of active PR/work/integration dependencies and immediate tip recheck. No local deletion, force push, published rebase, destructive reset/clean, worktree removal or garbage collection. Record final manifest in handback or closeout, not a further documentation branch.

No application edits, new features, Supabase/database/account/role/MFA/policy changes, migration/history operations, environment/build/protection/DNS/alias changes, Production build/deployment/promotion/rollback, artifact deletion, backups or other-application changes are authorized. No secrets in files/logs/URLs/browser bundles. Do not read real environment/credential files or use protection bypasses for housekeeping.

All seven historical risks remain OPEN / UNVERIFIED; preserve historical failures, counts, observations and NOT RUN limitations. Distinguish source inspection, mocks, real HTTP, saved backend evidence and owner browser reports. Earlier bounded assignment permissions are superseded only within this explicit housekeeping scope.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
