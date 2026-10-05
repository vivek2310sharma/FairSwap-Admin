# FairSwap Admin

FairSwap-Admin is the planned separate staff-facing application for FairSwap. ADMIN-00 is reviewed and saved in the documentation baseline. The accepted ADMIN-01A foundation has been published and merged into staging. **ADMIN-01A is accepted for its limited local application-foundation scope after source/artifact review**, including the Node and Vitest corrections. No staff workflows or live backend integration are implemented. **ADMIN-01B and ADMIN-01C remain NOT STARTED / NOT TESTED**; the whole ADMIN-01 milestone is not complete.

Acceptance uses reviewed source/configuration artifacts, comparison of the six corrected files with the original submission, manifest/lockfile consistency checks, and the implementing agent's recorded local verification evidence. The reviewer did not independently rerun tests/build, verify authentication or RLS, or verify a deployment. All seven backend/security items remain **OPEN / UNVERIFIED**. Runtime configuration enforcement remains an ADMIN-01B requirement; Production, hosting, and live backend integration remain out of scope.

Antigravity remains the primary development environment. Codex is explicitly authorised for the separate CI-01 foundation-checks assignment; the stack, architecture, and workflow remain unchanged.

The agreed stack is Next.js App Router, TypeScript, Tailwind CSS, and Supabase, with one Admin codebase and one separate Admin Vercel project planned for Test and Production deployments. Hosting and DNS are not configured by this task.

| Deployment | Planned host | Assigned backend |
| --- | --- | --- |
| Test | admin-test.fairswap.in | FairSwapTest, project ref `wpppxlnbzqynvhpeuavd` |
| Production | admin.fairswap.in | FairSwapProd; configuration out of scope |

Each deployment connects only to its assigned project. Missing Test configuration must fail closed, never fall back to Production. There is no runtime database selector. Test and Production use separate browser sessions; Web and Admin use host-specific cookies and no password/token handoff.

Admin owns its UI, auth/session orchestration, staff workflow presentation, Admin server routes/actions, tests, and later deployment configuration. [FairSwap-Web](https://github.com/vivek2310sharma/FairSwap-Web) remains authoritative for the shared backend: schema, RLS, grants, RPCs, Supabase configuration, `supabase/migrations/**`, and `supabase/tests/**`. Admin must not create a competing migration history. Web's existing `/admin` remains until separately approved migration and retirement.

Reviewed Web source revision: **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**. Any future extraction must preserve provenance; newer Web HEAD is not automatically approved.

Branch model: permanent `staging` and `main`; short-lived feature/fix/chore branches from `staging`, PRs back to `staging`, verification against FairSwapTest, then reviewed release PRs from `staging` to `main`. Remote `main` remains at documentation baseline `34e80ae894c744cbd2ec4cf99310dc61ac2884dc`. [PR #1](https://github.com/vivek2310sharma/FairSwap-Admin/pull/1) merged the accepted foundation `1eaf682b6875d26f06c4056296d22535b2146e96` into remote `staging` with merge commit `4cafc94d5e5b25f1738ea139f7a324631b435471`. This is not a production release or deployment.

## Local foundation

Use Node.js 24.x, at least 24.15.0 and below 25, and pnpm 10.12.1 (pinned in package.json). Node 24.15.0 is the verified development baseline; this range also satisfies the selected tools' higher requirements, including Vite 7.3.6 (`^20.19.0 || >=22.12.0`) and Vitest 4.1.11 (`^20.0.0 || ^22.0.0 || >=24.0.0`). Install with `pnpm install --frozen-lockfile`, then run `pnpm dev` on loopback. No real credentials or environment files are required to build/run. The placeholder-only [.env.example](.env.example) documents the two settings; do not populate credentials for this foundation.

`FAIRSWAP_DEPLOYMENT_ENV` is separate from `NODE_ENV`. Only `test` and the exact FairSwapTest HTTPS origin `https://wpppxlnbzqynvhpeuavd.supabase.co` pass target validation. Missing settings produce an unconfigured state; wrong targets/malformed settings produce an invalid state. Both are disabled, and even validated settings establish no backend connection and enable no staff workflows. The page reads these server settings during rendering; the current static page captures status at build time, so rebuild after changing them. There is no database selector or Supabase SDK/client.

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, and `pnpm build`. See [progress](docs/PROGRESS.md) for actual results and limitations. A Next.js production-mode build is a local build check, not production configuration or deployment.

Test tooling is pinned to Vitest 4.1.11 through an explicitly approved maintenance exception to the original Web dependency baseline. It includes the maintainer's fixes for [GHSA-82fw-gwwq-j7x9](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9) and [GHSA-5xrq-8626-4rwp](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp). Tests remain non-interactive `vitest run` with jsdom and fetch protections; no exposed test UI/API or Browser Mode is used. This maintenance does not establish a compromise or a backend defect.

ADMIN-01B must enforce deployment configuration validation at effective server-side session/client and protected-operation boundaries. The current static Test label and build-time validation do not verify that future enforcement.

## Automated foundation checks

[CI workflow](.github/workflows/ci.yml) runs on pull requests targeting staging/main and pushes to those branches. The single `Admin quality checks` job uses Ubuntu 24.04, Node 24.15.0, and pnpm 10.12.1, then frozen installation, typecheck, zero-warning lint, all 21 foundation tests, and build. Actions are pinned to verified release commits; checkout credentials are not persisted. No caching, backend configuration, secrets, or deployment steps are supplied.

CI-01 local verification and historical foundation checks are separately recorded in [progress](docs/PROGRESS.md). Hosted evidence for the final CI PR head belongs in its PR/report; this document does not claim a hosted result before execution. Checks cover the disabled foundation only. All seven backend/security items remain OPEN / UNVERIFIED; ADMIN-01B/01C remain NOT STARTED / NOT TESTED.

Project documents:

- [Agent instructions](AGENTS.md) and [Admin rules](.agents/rules/admin.md)
- [Progress and review gate](docs/PROGRESS.md)
- [Source provenance](docs/PROVENANCE.md)
- [ADMIN-01 plan](docs/plans/admin-01-plan.md)
- [Open security/backend verification items](docs/risks/admin-extraction.md)
