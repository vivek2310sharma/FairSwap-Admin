# FairSwap Admin

FairSwap-Admin is the planned separate staff-facing application for FairSwap. Current status: repository bootstrap and documentation planning only. No application, dependencies, or runtime tests exist yet. ADMIN-01 is not started.

Antigravity remains the primary development environment. Codex assists with ADMIN-00 closeout only; this handoff does not change the stack, architecture, or workflow.

The agreed stack is Next.js App Router, TypeScript, Tailwind CSS, and Supabase, with one Admin codebase and one separate Admin Vercel project planned for Test and Production deployments. Hosting and DNS are not configured by this task.

| Deployment | Planned host | Assigned backend |
| --- | --- | --- |
| Test | admin-test.fairswap.in | FairSwapTest, project ref `wpppxlnbzqynvhpeuavd` |
| Production | admin.fairswap.in | FairSwapProd; configuration out of scope |

Each deployment connects only to its assigned project. Missing Test configuration must fail closed, never fall back to Production. There is no runtime database selector. Test and Production use separate browser sessions; Web and Admin use host-specific cookies and no password/token handoff.

Admin owns its UI, auth/session orchestration, staff workflow presentation, Admin server routes/actions, tests, and later deployment configuration. [FairSwap-Web](https://github.com/vivek2310sharma/FairSwap-Web) remains authoritative for the shared backend: schema, RLS, grants, RPCs, Supabase configuration, `supabase/migrations/**`, and `supabase/tests/**`. Admin must not create a competing migration history. Web's existing `/admin` remains until separately approved migration and retirement.

Reviewed Web source revision: **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**. Any future extraction must preserve provenance; newer Web HEAD is not automatically approved.

Proposed branch model, not created in ADMIN-00: permanent `staging` and `main`; short-lived feature/fix/chore branches from `staging`, PRs back to `staging`, verification against FairSwapTest, then reviewed release PRs from `staging` to `main`. `main` represents approved production release state.

Project documents:

- [Agent instructions](AGENTS.md) and [Admin rules](.agents/rules/admin.md)
- [Progress and review gate](docs/PROGRESS.md)
- [Source provenance](docs/PROVENANCE.md)
- [ADMIN-01 plan](docs/plans/admin-01-plan.md)
- [Open security/backend verification items](docs/risks/admin-extraction.md)
