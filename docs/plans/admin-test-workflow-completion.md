# Test Admin workflow completion — approval package

Current acceptance status (2026-10-07): owner-reported hosted sign-in/MFA, navigation/details and listing denial after logout succeeded on the current Preview. After the separately approved Test policy correction, the owner confirms all listing photos render. Disposable-record mutations and live moderation conflicts have NOT RUN. The acceptance pass remains incomplete; historical implementation/build evidence below is preserved.

Date: 2026-10-07 (Europe/Copenhagen). Admin baseline HEAD: 927c56ce88970aa9af022e4d1d43181c5307ba14; deployed executable: 0707b6b4b80dd5c6b5bc1ab579f7db7d8c8df15d. Preserve existing Preview, migration history and unrelated AGENTS.md changes.

## Observations and source

Current status: owner combined approval received ("approve for all"). A scoped local FairSwap-Web checkout now exists at Documents/FairSwap-Web, branch codex/admin-test-workflow-contracts, pinned to c415d689124f405db56cbe8d7daecde7eeef1c29. Both exact proposed changes applied to Test as 20261007153735_admin_pending_medium_download and 20261007153744_atomic_reviewed_moderation. Their definitions, grants and unchanged legacy function/trigger fingerprints were verified. Rollback-only anonymous/missing-identity database denials passed; these do not establish positive staff acceptance or concurrent decisions. The new backend pgTAP file is NOT RUN (Test lacks pgTAP; no disposable local database identified). The preapproval proposal/gate text below is preserved as history, not current execution status.

Backend checkpoint: da4a2055d9ee41778ef094380eeb4e2bddab3e06 (four files; original Web application unchanged). Admin executable checkpoint: 7353c1f5f11f598e6596ec3571dfa1e3e8bd2f2d. Final deployment dpl_9qiN2tyTnr8SPomCvw87TSFWh5Yw at https://fairswap-admin-61sjsaokx-fairswap.vercel.app was independently inspected **Ready / Preview**. Its metadata associates both checkpoints. Anonymous HTTP returned 302 to vercel.com; protection remains prod_deployment_urls_and_all_previews. Production still references canceled dpl_24adDX2fwSaG6QBe79r5z88irkVy. All older Previews remain retained. Local sign-in returned 200 at http://127.0.0.1:3000/auth/sign-in. None of these HTTP/metadata checks establishes authenticated page acceptance.

Read-only metadata identified listing 6da6bc3e-fd1e-4271-97e2-63e06ce73f65 / media 4c10d13a-a2d3-4dc6-82ed-ee05b0d9f3ec, revision 1, pending_review / ready, with matching medium object. Manual local/hosted photo and final page/logout observations were requested; no mutation of this listing was authorized by identifying it for reads. Active-listing photos remain outside this narrowly approved pending-only route/policy scope.

Separate source review checked exact SQL proposal equality/hashes, additive signatures, function search paths/grants, guard ordering, lock-before-comparison/delegation, no old RPC rewrite, status-conflict sanitization, no legacy fallback/retry, and unchanged photo-route restrictions. Backend advisor warnings concerned other existing functions/configuration; no new reviewed-RPC finding appeared, and no baseline advisor comparison or broad repair was performed. Details and remediation references are in the backend evidence plan.

Admin now sends expected_revision/expected_status to moderate_listing_reviewed, reports PT409 as refresh-required, and has no legacy fallback or automatic retry. Final focused regressions: 174 tests / 3 files passed. Complete default suite: 412 tests / 11 files; typecheck, zero-warning lint and standard Test-configured Next build passed. An initial fixture-union narrowing typecheck failed and was corrected before these successful checks. No dependency changes were required.

Exact disposable mutation targets and recipients are still unspecified. No listing, account, staff, report, support, privacy, category or location record was changed. User reported hosted sign-in complete on the previous Preview; page/MFA/logout/photo observations are not inferred from that report. Account deletion remains disabled. Export fulfillment and schema editing are now explicitly unavailable in page copy and metadata.

Read-only Test inspection: both listing buckets private; no storage.objects policies; 11 ready media records, 11 matching medium objects, 33 derivative objects and 11 originals. Eight ready media records belong to pending-review listings, three to active listings. No payload was read and no Test record changed.

Source: vivek2310sharma/FairSwap-Web at c415d689124f405db56cbe8d7daecde7eeef1c29: migrations 08/16/33, src/lib/media/processor.ts, src/app/admin/listings/actions.ts and existing Admin photo/decision code. Live function definitions, listing triggers and RLS were inspected. The source Web moderation caller supplies only listing_id/action/reason. Admin adds a precheck but currently calls the same legacy RPC. iOS/Android source callers have not been independently inspected; no existing signature, helper, trigger or business-rule body will be altered.

Official references checked: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [operation helpers](https://supabase.com/docs/guides/storage/schema/helper-functions), [database functions](https://supabase.com/docs/guides/database/functions), [PostgREST errors](https://docs.postgrest.org/en/stable/references/errors.html). Installed Storage operation helpers are present. The current changelog was read; no applicable API change required a dependency upgrade.

## Backend ownership and gate

These SQL blocks are review proposals, NOT Admin migrations and NOT applied SQL. Actual migrations and database tests belong in FairSwap-Web/supabase/migrations and FairSwap-Web/supabase/tests. No local backend checkout has been identified: the named Documents/FairSwap-Web path does not exist and the registered local project is Admin only. An owner-identified checkout or authorization to create a scoped local backend checkout is required. Generate migration filenames through the existing Supabase CLI, inspect that repository's instructions and history, and preserve its outstanding work. Do not create another migration history here.

Apply only to wpppxlnbzqynvhpeuavd after one combined owner approval of these changes and exact fixtures/actors/recipients. No Production application.

## Change 1: medium derivative download policy

Exactly the object.get_authenticated operation, listing-derivatives bucket, recorded READY medium path, pending_review listing and current eligible moderator/admin AAL2 account with policy acceptance. Existing listing/media RLS additionally applies. No originals, bucket listing, signing, transform endpoint, public bucket, write or other derivative size is granted.

```sql
CREATE POLICY admin_pending_medium_download
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'listing-derivatives'
  AND storage.allow_only_operation('object.get_authenticated')
  AND app_security.is_active_staff_aal2('moderator'::public.staff_role_enum)
  AND app_security.has_current_policy_acceptance(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.listing_media m
    JOIN public.listings l ON l.id = m.listing_id
    WHERE m.processing_status = 'ready'::public.media_processing_status_enum
      AND l.status = 'pending_review'::public.listing_status_enum
      AND m.medium_storage_path = storage.objects.name
  )
);
```

The existing is_active_staff_aal2 helper includes administrators. The Admin route independently validates IDs, media/listing binding, pending status, safe recorded path, MIME/size, current verified staff identity/MFA/policy and no-store byte delivery. It uses the existing user session and publishable key. This policy grants authenticated staff direct access to exactly those same allowed derivative bytes, not application-host-specific access. App-host isolation is not a claim.

Verification after approval: exact approved listing/media pair loads locally and on Preview; medium GET succeeds only for eligible staff; original, unrelated path, thumb/large, listing/signing, missing policy, AAL1, nonstaff and other roles deny. No new accounts or factor manipulation to obtain missing negative actors. Test processing/failed/missing states remain covered offline; live states require approved fixtures. Check bucket public=false and the exact policy definition afterward.

Rollback: DROP POLICY admin_pending_medium_download ON storage.objects; derivative reads revert to denial. No bucket/object/data deletion or old-policy replacement.

## Change 2: additive atomic reviewed-decision RPC

New name avoids PostgREST overload ambiguity and leaves public.moderate_listing and app_security.impl_moderate_listing unchanged. A narrow private entry point uses the established guarded definer architecture to acquire the listing lock; it delegates all decisions to the existing implementation under that same transaction/lock. The invoker public wrapper grants no new table-write capability.

```sql
CREATE FUNCTION app_security.impl_moderate_listing_reviewed(
  p_listing_id uuid, p_action text, p_reason text,
  p_expected_revision integer, p_expected_status public.listing_status_enum
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL
     OR NOT app_security.is_active_staff_aal2('moderator'::public.staff_role_enum)
     OR NOT app_security.has_current_policy_acceptance(auth.uid()) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Staff authorization required';
  END IF;
  IF p_listing_id IS NULL OR p_expected_revision IS NULL
     OR p_expected_revision < 1 OR p_expected_status IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Reviewed identity required';
  END IF;
  SELECT * INTO v_listing FROM public.listings
    WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Listing unavailable';
  END IF;
  IF v_listing.revision IS DISTINCT FROM p_expected_revision
     OR v_listing.status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION USING ERRCODE = 'PT409', MESSAGE = 'MODERATION_REVIEW_CONFLICT';
  END IF;
  RETURN app_security.impl_moderate_listing(p_listing_id, p_action, p_reason);
END;
$$;
REVOKE ALL ON FUNCTION app_security.impl_moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_security.impl_moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) TO authenticated;

CREATE FUNCTION public.moderate_listing_reviewed(
  listing_id uuid, action text, reason text,
  expected_revision integer, expected_status public.listing_status_enum
) RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT app_security.impl_moderate_listing_reviewed(
    listing_id,action,reason,expected_revision,expected_status);
$$;
REVOKE ALL ON FUNCTION public.moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) TO authenticated;
```

No rewrite of authorization/self-review, approval-media checks, cover validation, status transitions, audit writes or notifications. Existing trigger/audit exceptions roll back the decision transaction. Two reviewers of the same revision/status serialize: after the first transition, the second gets PT409 without another decision/history/audit/notification. Revision mismatch similarly fails under lock. A transport-uncertain result is not retried.

After approved backend verification, change only Admin's moderation RPC mapping to the new name/expected arguments and map PT409 to a fixed refresh-required conflict. Preserve final-state observation and no automatic retry. Add actual-client mock regressions for parameters, stale/conflicting decisions, missing RPC (deny; no legacy fallback), backend errors and repeated submission. Do not deploy that switch before backend readiness.

Scope of guarantee: only callers of the new operation gain atomic expected revision/status protection. Legacy Web/iOS/Android calls remain unchanged and keep their old semantics. These fields do not detect content changes that the existing schema does not reflect in revision/status. This does not redesign seller edit/revision semantics.

Backend verification: existing pgTAP/RLS suites plus approved actor/fixture tests; matching approve/reject/remove must each produce the intended record state, one expected listing_status_transitions row and required audit event with actor/revision/reason. Inspect notification semantics rather than inferring delivery. Invalid reasons/self/nonstaff/AAL1/stale/repeated calls must produce no new side effects. A two-session test is required to establish actual concurrent behavior; in-memory mocks cannot prove database locking. Do not run a privileged SQL session and call it staff RLS acceptance.

Rollback: first stop/revert the Admin switch to the preserved previous application checkpoint; then revoke/drop public.moderate_listing_reviewed and private impl_moderate_listing_reviewed with exact signatures. Do not alter the legacy RPC or undo completed fixture actions by broad SQL. Future deployments and rollback each remain Test-only and preserve evidence.

## Combined decisions needed

- Approve the two exact backend changes above for Test, including repository-local migration/tests and narrow Admin RPC integration afterward.
- Identify the backend checkout path, or permit a scoped local clone of the existing FairSwap-Web repository (no remote push).
- Identify approved disposable listing/media IDs (approve/reject/remove; expected revisions/status), reporter/recipient approvals, support tickets/replies/notes/status, non-operator user IDs for suspend/reinstate, category/city/locality IDs or names for create/toggle, disposable staff targets/roles, and synthetic privacy request IDs/status. Provide actor identity/role for each and approved notification recipients. No genuine request, ordinary user, active operator or last administrator will be changed.
- Identify existing additional role-specific accounts if coverage is wanted; missing accounts remain a gap. No new staff assignment to obtain a test actor is implied.

## Independent application work and evidence

Current changes label privacy export/deletion and category schema editing explicitly unavailable. Deletion remains disabled and status updates remain separate. Focused action tests extend restore/category update/locality paths and actual four-role server boundaries; 128 focused tests passed with global network blocking. Hosted sign-in was reported complete by the owner; hosted representative page loads/MFA/logout observations remain pending. No live mutation or backend policy/RPC change has been made.

## Real acceptance observations and photo blocker — 2026-10-07

Source inspection confirmed Admin HEAD dbdfa94750eacfaf0685c3830366c525b05cc064 on codex/admin-feature-migration, with only the pre-existing AGENTS.md modification before this evidence update. The Preview's independently inspected executable/backend checkpoints remain 7353c1f5f11f598e6596ec3571dfa1e3e8bd2f2d / da4a2055d9ee41778ef094380eeb4e2bddab3e06. No application source, backend configuration, deployment or existing record was changed in this pass.

The owner's hosted checklist reports normal sign-in and existing MFA completed, dashboard/visible lists/representative details all working, and logout followed by denial of the listing URL. These are manual owner observations, not automated browser or authenticated API checks. Post-logout /admin denial was not separately reported. The owner reports Photo 2 unavailable and then the same unavailable message on its exact byte route. Photo 1 rendering (the required media 4c10d13a-a2d3-4dc6-82ed-ee05b0d9f3ec) has not been confirmed.

Exact Preview request metadata confirms GET /admin/listings/6da6bc3e-fd1e-4271-97e2-63e06ce73f65/photos/f63e9067-6424-43af-9046-a1c9d5de70bb returned 503 at 16:04:14.501Z (also 16:03:46.352Z and 15:59:49.202Z). Read-only Test metadata shows Photo 2 ready with its medium object present, private bucket, image/webp and 52,072 bytes. Metadata existence is not image-rendering or backing-object durability evidence.

Narrow Test log projections for this listing show the approved staff user's object-download requests returning 400. Storage 1.77.5 reports GET info-route operations object.get_authenticated_info with NoSuchKey during the same interval. The installed operation helper compares normalized operation names exactly. Consequently the current admin_pending_medium_download policy, which permits only object.get_authenticated, cannot admit that metadata operation. This is an evidence-supported explanation for the failure; actual backing-byte delivery remains unverified. No raw logs, token claims, headers, storage paths or image bytes were exported. The pinned SDK's download method itself selects /object; it does not directly call info. Changing the client to a different download URL is not an established fix.

[Current official Storage access-control documentation](https://supabase.com/docs/guides/storage/security/access-control) demonstrates an explicit allowlist containing both object.get_authenticated_info and object.get_authenticated. [Operation helper documentation](https://supabase.com/docs/guides/storage/schema/helper-functions) confirms exact matching. A proposed Test-only correction is to ALTER the existing policy with the identical predicate except replacing its operation term with:

```sql
storage.allow_any_operation(ARRAY[
  'object.get_authenticated_info',
  'object.get_authenticated'
])
```

All other restrictions remain identical: authenticated SELECT, private listing-derivatives bucket, active AAL2 moderator/administrator, current policy acceptance, ready media, pending listing and exact recorded medium path. Listing, signing, transformation, originals, other derivatives and writes are not added. This would permit metadata read for the same allowed medium objects, so it is a permission change requiring separate owner approval under the current acceptance request. It is PROPOSED ONLY, not applied. A new backend-owned migration and narrow policy/operation regression would preserve the applied historical migration. After approval, verify the actual Test policy and normal hosted byte/rendering result; do not claim pgTAP execution without an approved database test environment.

The ordinary Test owner/recipient selected by the owner is tiyasharma081998@gmail.com, ID b1e0a6ea-3b91-44f1-8b14-ec72b4c238b7. Read-only metadata confirms verified, active, current policy acceptance and no staff role. The moderator is the distinct existing administrator 644cf146-1949-4521-b779-655d99785934. No password, MFA secret, session or credential record was read. No new listing/report/ticket/category/location ID exists from this pass; none was created or mutated.

### Subsequently approved and applied photo correction

The owner explicitly approved the exact two-operation Test correction above. Migration admin_pending_medium_download_info was applied once to wpppxlnbzqynvhpeuavd; recorded version 20261007161425. Local source filename was aligned with that actual version without changing its SQL bytes. Backend local checkpoint 152243a4b6134686c28c446c4f14850502340421 (parent da4a2055d9ee41778ef094380eeb4e2bddab3e06) contains only supabase/migrations/20261007161425_admin_pending_medium_download_info.sql and supabase/tests/admin_medium_operation.test.sql. Migration SHA-256: 6abb2756000d9fb01c8895c8a42ec9bceb0f3af7e7f92e01b9df1ee565471af3. No push or merge. The deployed Admin executable and its original deployment metadata remain unchanged; the backend correction is a later additive Test migration, not part of the original backend checkpoint.

Actual readback confirms authenticated SELECT, the exact two-operation allowlist, unchanged remaining predicate and both listing buckets private. Four rollback-only checks of the installed operation helper pass: info/download permitted by that operation allowlist, list/sign denied. They set only a transaction-local Storage operation, not user/JWT claims, and read no payloads or protected records. They do not establish positive staff RLS, complete negative-actor coverage, actual image bytes or rendering. The new six-assertion pgTAP source has NOT RUN; its approved database-test prerequisite remains absent. Whitespace checks passed and existing accepted backend migration/RPC test files are unchanged. Security advisor readback reports warnings on other existing functions, extension placement and Auth settings, with no policy-specific finding; no broad repair or clean-security claim is made. References: [database linter](https://supabase.com/docs/guides/database/database-linter), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

After application, the owner reports: "Yes, all photos are visible now" in response to the request to verify actual Photo 1/Photo 2 rendering. This establishes a manual owner rendering PASS, including the specified media 4c10d13a-a2d3-4dc6-82ed-ee05b0d9f3ec; it is not an automated image inspection or direct authenticated API check. /admin denial after logout was not separately answered; earlier listing-URL denial remains confirmed. No Admin executable change or redeployment was needed for this backend-only correction.

Browser automation failed during initialization with the Windows sandbox helper error and again after one runtime reset. There is no agent-accessible authenticated owner/staff session. The documented seed-listings script is localhost-only and uses administrative account creation; it is unsuitable for this hosted Test task and was not executed or relaxed. Normal user flows require the owner's session; reports also forbid self-reporting. Privileged SQL inserts or forged JWT claims would not constitute approved creation or acceptance. Fixture creation, notification/history observation, invalid/duplicate live submissions, sequential stale review and true concurrent decisions remain NOT RUN pending normal authenticated interaction. Staff-role/account-status/privacy mutations also remain NOT RUN. No synthetic/native suite or unchanged Admin build checks were rerun; historical 412/11 and 174/3 results remain historical. The new backend checks are separately identified above.
