import { z } from "zod";

export const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });
export const kindSchema = z.enum(["review_report", "dispute"]);
export const statusSchema = z.enum(["open", "resolved", "all"]);
export const actionSchema = z.enum(["evidence", "hide", "restore", "resolve", "void", "exclude", "clear_exclusion"]);
export const reasonSchema = z.string().transform(value => value.normalize("NFC").replace(/^ +| +$/g, ""))
  .refine(value => [...value].length >= 3 && [...value].length <= 500, "Enter a reason of 3–500 characters.")
  .refine(value => !/[\u0000-\u001f\u007f-\u009f<>\u202a-\u202e\u2066-\u2069\ufeff]/u.test(value), "Remove unsupported characters.");
export const ratingsInputSchema = z.object({
  operation: z.literal("ratings"), target: z.enum(["case", "ticket"]), id: uuid,
  action: actionSchema, reason: reasonSchema,
}).strict();
export const queueInputSchema = z.object({
  kind: kindSchema.default("review_report"), status: statusSchema.default("open"),
  before_at: timestamp.optional(), before_id: uuid.optional(),
}).strict().refine(value => !!value.before_at === !!value.before_id, "Provide both cursor fields.");
export const caseMetadataSchema = z.object({
  id: uuid, trade_id: uuid, review_id: uuid.nullable(), support_ticket_id: uuid.nullable(),
  kind: kindSchema, created_at: timestamp, resolved_at: timestamp.nullable(),
}).strict();
export const queueSchema = z.object({
  items: z.array(caseMetadataSchema).max(20), has_more: z.boolean(),
  next_cursor: z.object({ before_at: timestamp, before_id: uuid }).strict().nullable(),
}).strict().superRefine((page, ctx) => {
  const last = page.items.at(-1);
  if (page.has_more !== (page.next_cursor !== null) || (page.has_more && page.items.length !== 20) ||
    (page.next_cursor && (!last || last.created_at !== page.next_cursor.before_at || last.id !== page.next_cursor.before_id)) ||
    new Set(page.items.map(item => item.id)).size !== page.items.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid queue envelope." });
  }
});
const tradeSchema = z.object({
  id: uuid, listing_id: uuid.nullable(), seller_id: uuid.nullable(), buyer_id: uuid.nullable(), conversation_id: uuid.nullable(),
  state: z.enum(["pending_selection", "pending_buyer", "confirmed", "disputed", "unattributed", "expired_unconfirmed"]),
  sold_at: timestamp, deadline: timestamp, buyer_confirmed_at: timestamp.nullable(), closed_at: timestamp.nullable(),
  voided: z.boolean(), risk_excluded: z.boolean(),
}).strict();
const face = z.number().int().min(1).max(4);
const reviewSchema = z.object({
  id: uuid, trade_id: uuid, author_id: uuid.nullable(), recipient_id: uuid.nullable(), reviewer_role: z.enum(["buyer", "seller"]),
  communication: face, payment_item: face, meetup: face, score: z.number().min(0).max(10),
  body: z.string().nullable(), tags: z.array(z.string()).max(5), submitted_at: timestamp, published_at: timestamp.nullable(),
  hidden: z.boolean(), redacted: z.boolean(),
}).strict();
export const evidenceSchema = z.object({
  case: caseMetadataSchema.extend({ reporter_id: uuid.nullable(), reason: z.string() }).strict(),
  trade: tradeSchema, reviews: z.array(reviewSchema).max(2),
  replies: z.array(z.object({ review_id: uuid, author_id: uuid.nullable(), body: z.string(), created_at: timestamp }).strict()).max(2),
}).strict().superRefine((value, ctx) => {
  if (value.case.trade_id !== value.trade.id || value.reviews.some(review => review.trade_id !== value.trade.id) ||
    (value.case.review_id !== null && !value.reviews.some(review => review.id === value.case.review_id)) ||
    value.replies.some(reply => !value.reviews.some(review => review.id === reply.review_id)) ||
    new Set(value.reviews.map(review => review.id)).size !== value.reviews.length ||
    new Set(value.replies.map(reply => reply.review_id)).size !== value.replies.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Case evidence mismatch." });
  }
});
export const acknowledgementSchema = z.object({ case_id: uuid, action: actionSchema }).strict();
export type RatingsInput = z.infer<typeof ratingsInputSchema>;
export type RatingsEvidence = z.infer<typeof evidenceSchema>;
export type RatingsQueue = z.infer<typeof queueSchema>;
export type RatingsAction = z.infer<typeof actionSchema>;
export type RatingsResult = { error?: string; success?: boolean; message?: string; evidence?: RatingsEvidence };

/** Presentation only: the backend rechecks state, eligibility and conflicts under its lock. */
export function availableActions(evidence: RatingsEvidence): Exclude<RatingsAction, "evidence">[] {
  const actions: Exclude<RatingsAction, "evidence">[] = [];
  const review = evidence.reviews.find(item => item.id === evidence.case.review_id);
  if (evidence.case.kind === "review_report" && review) actions.push(review.hidden ? "restore" : "hide");
  if (!evidence.trade.voided) {
    if (evidence.case.kind === "dispute" && evidence.trade.state === "disputed" && !evidence.case.resolved_at) actions.push("resolve");
    actions.push("void", evidence.trade.risk_excluded ? "clear_exclusion" : "exclude");
  }
  return actions;
}
