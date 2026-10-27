import type { RatingsEvidence } from "@/lib/admin/ratings/contract";

export const actor = "11111111-1111-4111-8111-111111111111";
export const caseId = "22222222-2222-4222-8222-222222222222";
export const tradeId = "33333333-3333-4333-8333-333333333333";
export const reviewId = "44444444-4444-4444-8444-444444444444";
export const ticketId = "55555555-5555-4555-8555-555555555555";
export const otherId = "66666666-6666-4666-8666-666666666666";
export const at = "2026-10-26T09:00:00+00:00";
export function evidenceFixture(): RatingsEvidence {
  return {
    case: { id: caseId, trade_id: tradeId, review_id: reviewId, support_ticket_id: ticketId, kind: "review_report", created_at: at, resolved_at: null, reporter_id: otherId, reason: "Synthetic report only" },
    trade: { id: tradeId, listing_id: null, seller_id: otherId, buyer_id: null, conversation_id: null, state: "confirmed", sold_at: at, deadline: at, buyer_confirmed_at: at, closed_at: null, voided: false, risk_excluded: false },
    reviews: [{ id: reviewId, trade_id: tradeId, author_id: otherId, recipient_id: null, reviewer_role: "buyer", communication: 1, payment_item: 1, meetup: 1, score: 0,
      body: "Synthetic sealed evidence", tags: ["sent_payment_link"], submitted_at: at, published_at: null, hidden: false, redacted: false }],
    replies: [{ review_id: reviewId, author_id: null, body: "Synthetic reply", created_at: at }],
  };
}
export function queueFixture() {
  const { id, trade_id, review_id, support_ticket_id, kind, created_at, resolved_at } = evidenceFixture().case;
  return { items: [{ id, trade_id, review_id, support_ticket_id, kind, created_at, resolved_at }], has_more: false, next_cursor: null };
}
