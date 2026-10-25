/**
 * Presentation helpers for the Admin support queue and ticket detail.
 *
 * `public.support_tickets` has no `ticket_number` and `public.support_messages` has no
 * `is_staff_reply` (see FairSwap-Backend migration 20260914000013). Everything here is derived from
 * columns that do exist. None of it is an authorization decision: RLS and the guarded RPCs remain
 * the authority.
 */

/**
 * Short, deterministic display reference derived from the ticket UUID. Matches Web's
 * `formatTicketReference`. It is NOT unique and must never be used as an identifier: links and RPC
 * arguments always carry the full UUID.
 */
export function formatSupportTicketReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export type SupportSenderLabel = "internal_note" | "customer" | "staff" | "unavailable";

/**
 * Attribution for a message using only trustworthy fields.
 *
 * Under the canonical write model, a customer message has `sender_id` equal to the ticket owner and
 * staff replies (`admin_reply_support_ticket`) carry the staff member's `auth.uid()`. When either id
 * is missing (a removed account) no identity is invented.
 */
export function classifySupportSender(
  message: { sender_id: string | null; is_internal_note: boolean },
  ticketUserId: string | null
): SupportSenderLabel {
  if (message.is_internal_note) return "internal_note";
  if (!message.sender_id || !ticketUserId) return "unavailable";
  return message.sender_id === ticketUserId ? "customer" : "staff";
}

/** Customer cell label. "Deleted user" only when the ticket has no owner at all. */
export function describeTicketCustomer(
  userId: string | null,
  displayName: string | null | undefined
): string {
  if (!userId) return "Deleted user";
  return displayName?.trim() ? displayName : "Customer unavailable";
}
