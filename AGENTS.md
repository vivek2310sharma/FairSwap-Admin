# Agent instructions

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
