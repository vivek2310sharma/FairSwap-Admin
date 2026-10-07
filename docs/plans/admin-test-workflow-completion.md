# Test Admin workflow completion — approval package

Date: 2026-10-07 (Europe/Copenhagen). Admin baseline HEAD: 927c56ce88970aa9af022e4d1d43181c5307ba14; deployed executable: 0707b6b4b80dd5c6b5bc1ab579f7db7d8c8df15d. Preserve existing Preview, migration history and unrelated AGENTS.md changes.

## Observations and source

Current status: owner combined approval received ("approve for all"). A scoped local FairSwap-Web checkout now exists at Documents/FairSwap-Web, branch codex/admin-test-workflow-contracts, pinned to c415d689124f405db56cbe8d7daecde7eeef1c29. Both exact proposed changes applied to Test as 20261007153735_admin_pending_medium_download and 20261007153744_atomic_reviewed_moderation. Their definitions, grants and unchanged legacy function/trigger fingerprints were verified. Rollback-only anonymous/missing-identity database denials passed; these do not establish positive staff acceptance or concurrent decisions. The new backend pgTAP file is NOT RUN (Test lacks pgTAP; no disposable local database identified). The preapproval proposal/gate text below is preserved as history, not current execution status.

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
