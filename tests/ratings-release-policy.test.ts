import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const config = vi.hoisted(() => ({ environment: "test" }));
vi.mock("@/lib/auth/runtime-config", () => ({ readAuthConfig: () => ({ environment: config.environment }) }));
import { ratingsEnabled } from "@/lib/admin/ratings/feature";
import { releaseAllows } from "@/lib/admin/release-policy";
import { caseId } from "./ratings-fixtures";
const input = { operation: "ratings", target: "case", id: caseId, action: "void", reason: "Synthetic reason" } as const;
beforeEach(() => { config.environment = "test"; });
describe("independent Ratings environment flags and existing production restrictions", () => {
  it.each(["test", "production"])("defaults OFF in %s", environment => {
    config.environment = environment;
    expect(ratingsEnabled()).toBe(false);
    expect(releaseAllows(input)).toBe(false);
  });
  it("isolates activation to the selected environment", () => {
    vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_TEST_ENABLED", "true");
    expect(releaseAllows(input)).toBe(true);
    config.environment = "production";
    expect(releaseAllows(input)).toBe(false);
    vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_PRODUCTION_ENABLED", "true");
    expect(releaseAllows(input)).toBe(true);
    vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_TEST_ENABLED", "false");
    config.environment = "test";
    expect(releaseAllows(input)).toBe(false);
  });
  it("keeps unrelated production restrictions even with Ratings enabled", () => {
    config.environment = "production";
    vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_PRODUCTION_ENABLED", "true");
    expect(releaseAllows({ operation: "assign-role", targetUserId: caseId, role: "moderator" })).toBe(false);
    expect(releaseAllows({ operation: "revoke-role", targetUserId: caseId })).toBe(false);
    expect(releaseAllows({ operation: "user-status", targetUserId: caseId, newStatus: "suspended", expectedStatus: "active", reason: "Synthetic reason" })).toBe(false);
    expect(releaseAllows({ operation: "privacy-status", requestId: caseId, newStatus: "resolved" })).toBe(false);
    expect(releaseAllows({ operation: "moderate", listingId: caseId, action: "remove", revision: 1, status: "active", reason: "Synthetic reason" })).toBe(false);
    expect(releaseAllows({ operation: "resolve-report", reportId: caseId, newStatus: "resolved" })).toBe(true);
  });
});
