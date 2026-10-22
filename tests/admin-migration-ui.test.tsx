import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
const calls = vi.hoisted(() => ({ decision: vi.fn(), report: vi.fn(), reply: vi.fn(), ticket: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push:calls.push,refresh:calls.refresh }) }));
vi.mock("@/app/admin/listings/actions", () => ({ moderateListingAction:calls.decision }));
vi.mock("@/app/admin/reports/actions", () => ({ resolveReportAction:calls.report }));
vi.mock("@/app/admin/support/actions", () => ({ staffReplySupportTicketAction:calls.reply,updateTicketStatusAction:calls.ticket }));
import ModerationActions from "@/app/admin/listings/[listingId]/ModerationActions";
import { ReportResolutionForm } from "@/components/communication/ReportResolutionForm";
import { StaffSupportReplyForm } from "@/components/communication/StaffSupportReplyForm";
import { AdminOverview } from "@/components/admin-overview";
const id = "22222222-2222-4222-8222-222222222222";
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window,"confirm").mockReturnValue(true); });
describe("migrated forms and navigation", () => {
  it("prevents duplicate decisions while awaiting acknowledgement, carries reviewed revision and navigates only on success", async () => {
    let finish!: (result: { success:true }) => void;
    calls.decision.mockImplementation(() => new Promise(resolve => { finish=resolve; }));
    render(<ModerationActions listingId={id} isSelfListing={false} canApprove revision={2} status="pending_review" />);
    const button = screen.getByRole("button",{ name:/Approve Listing/ });
    fireEvent.click(button); fireEvent.click(button);
    expect(calls.decision).toHaveBeenCalledTimes(1); expect(calls.decision).toHaveBeenCalledWith(id,"approve",undefined,2,"pending_review");
    expect(calls.push).not.toHaveBeenCalled();
    await act(async () => finish({ success:true })); expect(calls.push).toHaveBeenCalledWith("/admin/listings");
  });
  it("contains failed decision transport and releases pending state", async () => {
    calls.decision.mockRejectedValue(new Error("SECRET_SENTINEL"));
    render(<ModerationActions listingId={id} isSelfListing={false} canApprove revision={2} status="pending_review" />);
    fireEvent.click(screen.getByRole("button",{ name:/Approve Listing/ }));
    await screen.findByText("Operation not confirmed. Refresh before retrying.");
    expect(screen.getByRole("button",{ name:/Approve Listing/ })).toBeEnabled(); expect(calls.push).not.toHaveBeenCalled(); expect(document.body.textContent).not.toContain("SECRET_SENTINEL");
  });
  it("respects cancelled confirmation and self-review denial", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const view=render(<ModerationActions listingId={id} isSelfListing={false} canApprove revision={2} status="pending_review" />);
    fireEvent.click(screen.getByRole("button",{ name:/Approve Listing/ })); expect(calls.decision).not.toHaveBeenCalled();
    view.rerender(<ModerationActions listingId={id} isSelfListing canApprove revision={2} status="pending_review" />); expect(screen.queryByRole("button",{ name:/Approve Listing/ })).not.toBeInTheDocument();
  });
  it("disables rejection of active listings but keeps removal available", () => {
    render(<ModerationActions listingId={id} isSelfListing={false} canApprove={false} revision={2} status="active" />);
    expect(screen.getByRole("button",{ name:/Reject with Reason/ })).toBeDisabled(); expect(screen.getByRole("button",{ name:/Remove Listing/ })).toBeEnabled();
  });
  it("does not expose approval or rejection actions for an unreleased family",()=>{
    render(<ModerationActions listingId={id} isSelfListing={false} canApprove={false} familyReviewBlocked revision={2} status="pending_review" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Vehicle and Property reviews are not released");
    expect(screen.queryByRole("button",{name:/Approve Listing|Reject with Reason/})).not.toBeInTheDocument();
    expect(calls.decision).not.toHaveBeenCalled();
  });
  it("does not show report success for an empty or rejected result", async () => {
    calls.report.mockRejectedValue(new Error("SECRET_SENTINEL"));
    render(<ReportResolutionForm reportId={id} currentStatus="pending" />);
    fireEvent.click(screen.getByRole("button",{ name:/Update Report Status/ }));
    await screen.findByText("Operation not confirmed. Refresh before retrying.");
    expect(calls.refresh).not.toHaveBeenCalled(); expect(document.body.textContent).not.toContain("SECRET_SENTINEL");
  });
  it("keeps customer replies distinct from internal notes and handles transport failure", async () => {
    calls.reply.mockResolvedValue({ success:true,message:"Internal note added." });
    render(<StaffSupportReplyForm ticketId={id} currentStatus="open" currentPriority="normal" />);
    fireEvent.click(screen.getByRole("button",{ name:"Internal Note" }));
    fireEvent.change(screen.getByPlaceholderText("Write an internal staff note regarding this case..."),{ target:{ value:"Synthetic internal note" } });
    fireEvent.click(screen.getByRole("button",{ name:"Save Internal Note" }));
    await screen.findByText("Internal note added."); expect(calls.reply).toHaveBeenCalledWith(id,"Synthetic internal note",true);
    calls.ticket.mockRejectedValue(new Error("SECRET_SENTINEL")); fireEvent.click(screen.getByRole("button",{ name:"Save State" }));
    await screen.findByText("Operation not confirmed. Refresh before retrying.");
    await waitFor(() => expect(screen.getByRole("button",{ name:"Save State" })).toBeEnabled()); expect(document.body.textContent).not.toContain("SECRET_SENTINEL");
  });
  it.each([
    ["administrator",9], ["moderator",3], ["support_agent",1], ["content_editor",1],
  ] as const)("provides coherent accessible navigation for %s", (role,count) => {
    render(<AdminOverview role={role} />);
    const links=screen.getAllByRole("link"); expect(links).toHaveLength(count);
    expect(links.every(link => link.getAttribute("href")?.startsWith("/admin/"))).toBe(true);
    if(role === "support_agent" || role === "content_editor") expect(screen.queryByRole("link",{ name:/Moderation Queue/ })).not.toBeInTheDocument();
  });
});
