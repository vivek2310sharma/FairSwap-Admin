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

## Future extraction register

Record each source extraction before or alongside implementation:

| Original repository | Source path | Source commit SHA | Destination path | Treatment (copied/adapted/rewritten) | Notes |
| --- | --- | --- | --- | --- | --- |

The register currently has no application-code entries. Record provenance for rewritten source-derived behavior as well as copied/adapted files. Use the pinned revision, not current Web HEAD. A newer source revision requires a separately reviewed provenance update; retain the history and describe why the revision changed.
