import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ headers: vi.fn(), mutate: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/admin/mutations", () => ({ adminMutation: mocks.mutate }));
import { ratingsAction } from "@/app/admin/ratings/actions";
import { caseId, evidenceFixture } from "./ratings-fixtures";
const input = { operation: "ratings", target: "case", id: caseId, action: "hide", reason: "Synthetic decision" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.headers.mockResolvedValue(new Headers({ origin: "https://admin-test.fairswap.in", host: "admin-test.fairswap.in" }));
  mocks.mutate.mockResolvedValue({ success: true, message: "Audited" });
});
describe("Ratings Server Action boundary and cache failure semantics", () => {
  it("passes the real origin/host to the guarded adapter and revalidates the queue", async () => {
    expect((await ratingsAction(input)).success).toBe(true);
    expect(mocks.mutate).toHaveBeenCalledWith(input, "https://admin-test.fairswap.in", "admin-test.fairswap.in");
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/ratings");
  });
  it("rejects invalid input before any adapter call", async () => {
    expect((await ratingsAction({ ...input, reason: "" })).error).toBeTruthy();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it("does not replay an acknowledged write when cache revalidation fails", async () => {
    mocks.revalidate.mockImplementation(() => { throw new Error("Synthetic cache failure"); });
    expect(await ratingsAction(input)).toMatchObject({ success: true, message: expect.stringMatching(/acknowledged/) });
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
  });
  it("never triggers evidence retrieval through revalidation", async () => {
    mocks.mutate.mockResolvedValue({ success: true, evidence: evidenceFixture() });
    const result = await ratingsAction({ ...input, action: "evidence" });
    expect(result.evidence).toEqual(evidenceFixture());
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("keeps uncertain outcomes generic without revalidation or retry", async () => {
    mocks.mutate.mockRejectedValue(new Error("Synthetic private error"));
    expect((await ratingsAction(input)).error).toMatch(/not confirmed/);
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
