/** The Web orchestrator requires elevated Storage/Auth access and cannot be copied safely. */
export function ProcessDeletionButton({ requestId }: { requestId: string }) {
  return <div className="text-xs text-amber-800" data-request-id={requestId}>
    <button type="button" disabled className="rounded border border-amber-300 px-3 py-1.5">Account deletion unavailable</button>
    <p>Requires an approved staff-scoped deletion orchestrator. No deletion phase is started here.</p>
  </div>;
}
