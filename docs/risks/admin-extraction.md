# Admin extraction: open verification items

Evidence basis: supplied ADMIN-00 code-review report for Web **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**. No runtime behavior below has been verified. Every item starts **OPEN / UNVERIFIED**. Source-code observations are reported from the handoff, not newly inspected during closeout. Hypotheses require tests; there are no verified runtime test results.

## A. Original photo authorization

Priority: **HIGH verification priority**; potential unauthorized original-media disclosure. Owner: Web/backend for route/policy verification and fixes; Admin for preventing propagation. Status: **OPEN / UNVERIFIED**.

Source-code observation: the pinned media route appears to authenticate original-file access but has a later denial condition dependent on public listing visibility. Hypothesis: an unrelated authenticated customer may obtain an original-file signed URL for a publicly visible listing. This is a code-review finding, not a proven exploit or runtime result.

Verify using synthetic local/disposable or authorized FairSwapTest data: unauthenticated user, owner, unrelated authenticated customer, moderator AAL1, moderator AAL2, administrator AAL2, and suspended staff. Never access real private user media. Admin must refuse originals and must not copy this route unchanged. Record outcomes and exact source paths in the later verification task.

## B. Moderation existence oracle

Priority: backend verification/fix candidate. Owner: Web/backend. Status: **OPEN / UNVERIFIED**.

Source-code observation: `moderate_listing` appears to fetch the listing and check self-review before staff authorization. Hypothesis: an ordinary authenticated user may distinguish listing existence/states through different errors. Test with synthetic records and compare denied responses; separately review authorization ordering if confirmed. Admin must not change the RPC or mask this as a completed fix.

## C. Stale moderation / revision race

Priority: moderation integrity review before relying on approval freshness. Owner: Web/backend for revision guarantees; Admin for stale-review UX. Status: **OPEN / UNVERIFIED**.

Source-code observation: `moderate_listing` takes no expected listing revision. Hypothesis: staff may view revision N while the listing changes before approval. Determine whether sellers can edit `pending_review` listings, whether an atomic expected-revision check is needed, and how Admin should present stale data. Test concurrent changes using synthetic data. UI refresh alone does not resolve this race.

## D. MFA enrolment and staff onboarding

Priority: operational process review. Owner: staff operations with Web/backend and Admin auth owners. Status: **OPEN / UNVERIFIED**.

Source-code observation: initial MFA enrolment follows first-factor authentication. That alone is not a proven vulnerability. Open operational question: define controlled staff-role assignment, first factor, enrolment, activation, and recovery. Document supervision, identity checks, and recovery/re-enrolment responsibilities before rollout; preserve pre-AAL2 bootstrap access.

## E. Signed media URL limitation

Priority: media-design review gate. Owner: Admin media implementation; Web/backend for any separately reviewed backend support. Status: **OPEN / UNVERIFIED** for implementation controls.

Design premise/hypothesis for verification: possession of a valid signed URL permits use until expiry; revocation after issuance is not instantaneous. Verify short lifetime, `no-store` handling, derivative-only access, and omission of URLs from logs. No original files in Admin. Review credential/signing design before coding; elevated server credentials must not be described as storage-scoped. No credentials or Storage policies are provisioned in closeout.

## F. Cross-application refresh

Priority: cross-client acceptance requirement. Owner: Admin/Web integration and Android/iOS owners. Status: **OPEN / UNVERIFIED**.

Architecture observation: an Admin mutation does not automatically establish invalidation of a separately deployed Web Next.js cache. Hypothesis: some clients may retain stale visibility/state. Test approved/rejected listing visibility on Web, Android, and iOS, realtime where applicable, and refresh/cache behavior. Document measured behavior and any remaining limitation. ADMIN-00 chooses no invalidation solution.

## G. Existing test coverage

Priority: ADMIN-01 integration/security test requirement. Owner: Admin tests; Web/backend for shared backend tests. Status: **OPEN / UNVERIFIED**.

Source-code observation: reported existing Admin tests are largely static; the review did not discover an automated successful approve/reject plus audit-row end-to-end test at the pinned revision. This is a discovery limit, not proof that no such test exists anywhere. ADMIN-01 needs real integration/security tests, including correct audit evidence for success and no success evidence after denied actions. No tests have been run in closeout.

## Evidence updates

Later verification must record exact source/test paths, revision, synthetic-data environment, role/AAL matrix, expected/actual outcomes, and remaining questions without credentials, tokens, signed URLs, or private data. Label results explicitly as verified test results; do not change OPEN status solely because a document or UI guard was added. Shared backend fixes require separate Web/backend review and Web/Android/iOS impact assessment.
