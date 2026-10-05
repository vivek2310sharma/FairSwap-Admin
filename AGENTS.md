# Agent instructions

Read [.agents/rules/admin.md](.agents/rules/admin.md), [progress](docs/PROGRESS.md), the [ADMIN-01 plan](docs/plans/admin-01-plan.md), and [open risks](docs/risks/admin-extraction.md) before work. Preserve the pinned revision in [provenance](docs/PROVENANCE.md).

This is a Next.js App Router project. Check framework documentation for the installed version before implementation; do not assume the latest documentation matches that version. ADMIN-01A uses Next.js 16.3.5. ADMIN-00 itself installed no dependencies or application scaffold.

Antigravity remains the primary implementation environment; Codex's current explicitly authorised temporary assignment is bounded ADMIN-01B authentication, isolated testing, branch publication and draft-PR creation. Follow the agreed architecture and workflow. Separate planning, approved implementation, and verification; do not report planned or untested work as completed.

Keep changes within the authorized task and repository boundaries. No production access or changes without explicit approval. No secrets in code, documentation, logs, URLs, or browser bundles. Do not read secret-bearing environment files for ordinary documentation work.

The historical ADMIN-00 closeout allowed only the eight reviewed documentation/configuration files. The accepted review now explicitly authorises their corrections, one local documentation-only baseline commit, local staging and feature/admin-01a-foundation branches, and ADMIN-01A foundation implementation/tests/dependency installation with a placeholder-only .env.example. This narrowly supersedes the historical restriction. Leave all foundation changes uncommitted for review. ADMIN-01B authentication and ADMIN-01C moderation/media remain unstarted and require separate authorisation. No real environment files, credentials, backend calls/changes, pushes, PRs, issues, or deployments.

## Current ADMIN-01B authorization

The current user assignment supersedes historical foundation/local-only restrictions only for feature/admin-01b-auth from staging 454f0f77e3f7e25df15ca6736a30e590e9ca6f17. Implement Test-only email/password, TOTP bootstrap/challenge, isolated sessions, policy gating and reusable server authorization; test without network or credentials; commit/push only this branch and open a draft PR to staging. Keep the accepted framework/toolchain and CI protections. Read-only Web source must remain pinned to 8ad67672896a1a11f51009ffddf3bb39ee3cf698 and all source-derived behavior must enter provenance. No live Supabase operations, real environment/credential reads, backend changes, hosting, deployment, production, merge/auto-merge, or ADMIN-01C work. All seven risks remain OPEN / UNVERIFIED; live ADMIN-01B acceptance remains NOT RUN / UNVERIFIED. Earlier restrictions describe historical assignments.
