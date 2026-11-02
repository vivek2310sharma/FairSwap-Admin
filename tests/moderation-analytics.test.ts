import { describe, it, expect } from "vitest";
import {
  AnalyticsRangeSchema,
  ModerationAnalyticsPayloadSchema,
} from "@/lib/admin/moderation-analytics";

describe("Moderation Analytics Contracts & Schemas", () => {
  it("validates valid ranges", () => {
    expect(AnalyticsRangeSchema.safeParse("today").success).toBe(true);
    expect(AnalyticsRangeSchema.safeParse("yesterday").success).toBe(true);
    expect(AnalyticsRangeSchema.safeParse("7d").success).toBe(true);
    expect(AnalyticsRangeSchema.safeParse("30d").success).toBe(true);
    expect(AnalyticsRangeSchema.safeParse("1y").success).toBe(false);
  });

  it("validates full analytics payload matching the schema", () => {
    const samplePayload = {
      range: "today",
      window_start: "2026-11-02T00:00:00+05:30",
      window_end: "2026-11-02T10:00:00+05:30",
      generated_at_ist: "2026-11-02T10:00:00+05:30",
      metrics: {
        listings_submitted: 12,
        listings_evaluated: 10,
        total_evaluations: 14,
        images_uploaded: 35,
        images_ready: 33,
        images_failed: 2,
      },
      five_checks: {
        check_india_fraud_rules: { passed: 14, failed: 0, total: 14 },
        check_openai_moderation: { passed: 13, failed: 1, total: 14 },
        check_vision_nsfw: { passed: 14, failed: 0, total: 14 },
        check_vision_category: { passed: 14, failed: 0, total: 14 },
        check_ocr_qr: { passed: 12, failed: 2, total: 14 },
      },
      decisions: {
        auto_approved: 8,
        routed_to_admin: 4,
        escalated_to_admin: 1,
        rejected_invalid: 1,
      },
      image_scans: {
        available: false,
        count: 0,
        status: "unavailable",
        label: "Per-image scan attempts unavailable until telemetry is deployed",
      },
      costs: {
        azure: "Not connected",
        openai: "Not connected",
        status: "not_connected",
      },
      history: [
        {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          request_id: "7d1e8c45-1234-5678-9abc-def012345678",
          listing_id: "c9b78e23-8888-4444-9999-123456789abc",
          listing_title: "iPhone 13 128GB Midnight",
          listing_revision: 1,
          ruleset_version: "india_v1.0.0",
          scope: "multimodal_five_check",
          outcome: "no_review_flags",
          decision: "auto_approved",
          completed_rules: [
            "check_india_fraud_rules",
            "check_openai_moderation",
            "check_vision_nsfw",
            "check_vision_category",
            "check_ocr_qr",
          ],
          failed_rules: [],
          flags_count: 0,
          created_at: "2026-11-02T08:30:00Z",
        },
      ],
    };

    const parsed = ModerationAnalyticsPayloadSchema.safeParse(samplePayload);
    expect(parsed.success).toBe(true);
  });

  it("strictly enforces 'unavailable' for image scan status", () => {
    const invalidScanPayload = {
      range: "today",
      window_start: "2026-11-02T00:00:00+05:30",
      window_end: "2026-11-02T10:00:00+05:30",
      generated_at_ist: "2026-11-02T10:00:00+05:30",
      metrics: {
        listings_submitted: 0,
        listings_evaluated: 0,
        total_evaluations: 0,
        images_uploaded: 0,
        images_ready: 0,
        images_failed: 0,
      },
      five_checks: {},
      decisions: {
        auto_approved: 0,
        routed_to_admin: 0,
        escalated_to_admin: 0,
        rejected_invalid: 0,
      },
      image_scans: {
        available: true,
        count: 10,
        status: "active", // Disallowed without per-image telemetry
      },
      costs: {
        azure: "Not connected",
        openai: "Not connected",
        status: "not_connected",
      },
      history: [],
    };

    const parsed = ModerationAnalyticsPayloadSchema.safeParse(invalidScanPayload);
    expect(parsed.success).toBe(false);
  });

  it("strictly enforces 'Not connected' for costs without dummy numbers", () => {
    const invalidPayload = {
      range: "today",
      window_start: "2026-11-02T00:00:00+05:30",
      window_end: "2026-11-02T10:00:00+05:30",
      generated_at_ist: "2026-11-02T10:00:00+05:30",
      metrics: {
        listings_submitted: 0,
        listings_evaluated: 0,
        total_evaluations: 0,
        images_uploaded: 0,
        images_ready: 0,
        images_failed: 0,
      },
      five_checks: {},
      decisions: {
        auto_approved: 0,
        routed_to_admin: 0,
        escalated_to_admin: 0,
        rejected_invalid: 0,
      },
      image_scans: {
        available: false,
        count: 0,
        status: "unavailable",
      },
      costs: {
        azure: "$15.40", // Disallowed dummy/estimated number
        openai: "Not connected",
        status: "not_connected",
      },
      history: [],
    };

    const parsed = ModerationAnalyticsPayloadSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });
});
