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
