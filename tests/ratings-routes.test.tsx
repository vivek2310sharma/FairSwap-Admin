import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ queue: vi.fn(), access: vi.fn(), enabled: vi.fn() }));
vi.mock("@/lib/admin/ratings/server", () => ({ loadRatingsQueue: mocks.queue, RATINGS_UNAVAILABLE: "Ratings unavailable" }));
vi.mock("@/lib/admin/ratings/feature", () => ({ ratingsEnabled: mocks.enabled }));
vi.mock("@/lib/auth/guard", () => ({ requireStaffAccess: mocks.access }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/components/ratings/case-workspace", () => ({ CaseWorkspace: ({ target }: { target: string }) => <div>Explicit evidence form for {target}</div> }));
import RatingsPage from "@/app/admin/ratings/page";
import { CasePage } from "@/components/ratings/case-page";
import { caseId, queueFixture, ticketId } from "./ratings-fixtures";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.queue.mockResolvedValue({ queue: queueFixture() });
  mocks.access.mockResolvedValue({ allowed: true, role: "moderator" });
  mocks.enabled.mockReturnValue(true);
});
describe("Ratings routes", () => {
  it("shows only page counts, both queues, all statuses and linked ticket navigation", async () => {
    render(await RatingsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/1 cases on this page/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Ratings queues" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trade Disputes" })).toHaveAttribute("href", "/admin/ratings?kind=dispute&status=open");
    expect(screen.getByRole("navigation", { name: "Case status" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Linked ticket investigation" })).toHaveAttribute("href", `/admin/ratings/tickets/${ticketId}`);
    expect(screen.queryByText(/Synthetic sealed/)).not.toBeInTheDocument();
  });
  it("does not query invalid cursor/filter inputs", async () => {
    render(await RatingsPage({ searchParams: Promise.resolve({ before_id: caseId }) }));
    expect(screen.getByRole("status")).toHaveTextContent(/Invalid/);
    expect(mocks.queue).not.toHaveBeenCalled();
  });
  it("renders unavailable honestly rather than as empty", async () => {
    mocks.queue.mockResolvedValue({ error: "Ratings unavailable" });
    render(await RatingsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("status")).toHaveTextContent("Ratings unavailable");
    expect(screen.queryByText(/No cases/)).not.toBeInTheDocument();
  });
  it("opens a detail with no automatic evidence RPC", async () => {
    render(await CasePage({ id: caseId, target: "case" }));
    expect(mocks.access).toHaveBeenCalledWith(["administrator", "moderator"]);
    expect(screen.getByText("Explicit evidence form for case")).toBeInTheDocument();
    expect(mocks.queue).not.toHaveBeenCalled();
  });
  it.each(["denied", "off"])("withholds evidence form for %s", async condition => {
    if (condition === "denied") mocks.access.mockResolvedValue({ allowed: false, reason: "mfa" });
    else mocks.enabled.mockReturnValue(false);
    render(await CasePage({ id: ticketId, target: "ticket" }));
    expect(screen.queryByText("Explicit evidence form for ticket")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
  it("rejects malformed detail identifiers before authorization", async () => {
    await expect(CasePage({ id: "invalid", target: "case" })).rejects.toThrow("NOT_FOUND");
    expect(mocks.access).not.toHaveBeenCalled();
  });
});
