import { z } from "zod";

export const AnalyticsRangeSchema = z.enum(["today", "yesterday", "7d", "30d"]);
export type AnalyticsRange = z.infer<typeof AnalyticsRangeSchema>;

export const FiveCheckSummarySchema = z.object({
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const ProcessingHistoryItemSchema = z.object({
  id: z.string().uuid(),
  request_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  listing_title: z.string().nullable(),
  listing_revision: z.number().int(),
  ruleset_version: z.string(),
  scope: z.string(),
  outcome: z.string(),
  decision: z.string(),
  completed_rules: z.array(z.string()).default([]),
  failed_rules: z.array(z.string()).default([]),
  flags_count: z.number().int().nonnegative().default(0),
  created_at: z.string(),
});

export type ProcessingHistoryItem = z.infer<typeof ProcessingHistoryItemSchema>;

export const ModerationAnalyticsPayloadSchema = z.object({
  range: AnalyticsRangeSchema,
  window_start: z.string(),
  window_end: z.string(),
  generated_at_ist: z.string(),
  metrics: z.object({
    listings_submitted: z.number().int().nonnegative(),
    listings_evaluated: z.number().int().nonnegative(),
    total_evaluations: z.number().int().nonnegative(),
    images_uploaded: z.number().int().nonnegative(),
    images_ready: z.number().int().nonnegative(),
    images_failed: z.number().int().nonnegative(),
  }),
  five_checks: z.record(FiveCheckSummarySchema),
  decisions: z.object({
    auto_approved: z.number().int().nonnegative(),
    routed_to_admin: z.number().int().nonnegative(),
    escalated_to_admin: z.number().int().nonnegative(),
    rejected_invalid: z.number().int().nonnegative(),
  }),
  image_scans: z.object({
    available: z.boolean(),
    count: z.number().int().nonnegative(),
    status: z.string(),
    note: z.string().nullable().optional(),
  }),
  costs: z.object({
    azure: z.literal("Not connected"),
    openai: z.literal("Not connected"),
    status: z.literal("not_connected"),
  }),
  history: z.array(ProcessingHistoryItemSchema),
});

export type ModerationAnalyticsPayload = z.infer<typeof ModerationAnalyticsPayloadSchema>;
