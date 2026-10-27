import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CaseWorkspace, EvidenceDisplay } from "@/components/ratings/case-workspace";
import type { RatingsResult } from "@/lib/admin/ratings/contract";
import { caseId, evidenceFixture, ticketId } from "./ratings-fixtures";
const action = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/ratings/actions", () => ({ ratingsAction: action }));

beforeEach(() => {
  action.mockReset();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
async function openEvidence(target: "case" | "ticket" = "case") {
  action.mockResolvedValueOnce({ success: true, evidence: evidenceFixture(), message: "Evidence read audited" });
  render(<CaseWorkspace id={target === "ticket" ? ticketId : caseId} target={target} />);
  fireEvent.change(screen.getByLabelText(/Staff reason/), { target: { value: "Synthetic evidence reason" } });
  fireEvent.click(screen.getByRole("button", { name: "View Evidence" }));
  await screen.findByRole("region", { name: "Authorized Ratings evidence" });
}
describe("Ratings confidentiality and accessible moderation workflow", () => {
  it("does not request or render evidence on mount and labels reason input", () => {
    render(<CaseWorkspace id={caseId} target="case" />);
    expect(action).not.toHaveBeenCalled();
    expect(screen.queryByText("Synthetic sealed evidence")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Staff reason/)).toHaveAttribute("aria-describedby");
  });
  it("requests reason-required evidence explicitly and clears the reason afterward", async () => {
    await openEvidence();
    expect(action).toHaveBeenCalledWith({ operation: "ratings", target: "case", id: caseId, action: "evidence", reason: "Synthetic evidence reason" });
    expect(screen.getByText("Synthetic sealed evidence")).toBeInTheDocument();
    expect(screen.getByText(/Sealed — private/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Staff reason/)).toHaveValue("");
    expect(screen.getByText(/not proof of fraud/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear displayed evidence" }));
    expect(screen.queryByText("Synthetic sealed evidence")).not.toBeInTheDocument();
  });
  it("prevents invalid reasons, then opens a named confirmation and supports cancel", async () => {
    await openEvidence();
    fireEvent.click(screen.getByRole("button", { name: "Void trade permanently" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/reason/);
    expect(action).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText(/Staff reason/), { target: { value: "Synthetic void finding" } });
    fireEvent.click(screen.getByRole("button", { name: "Void trade permanently" }));
    const dialog = screen.getByRole("dialog", { name: /Confirm Void/ });
    expect(within(dialog).getByText(/no undo in V1/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(action).toHaveBeenCalledTimes(1);
  });
  it("confirms once and removes stale evidence after a successful mutation", async () => {
    await openEvidence();
    action.mockResolvedValueOnce({ success: true, message: "Backend action audited" });
    fireEvent.change(screen.getByLabelText(/Staff reason/), { target: { value: "Synthetic moderation finding" } });
    fireEvent.click(screen.getByRole("button", { name: "Hide reported review" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
    await screen.findByText("Backend action audited");
    expect(screen.queryByText("Synthetic sealed evidence")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide reported review" })).not.toBeInTheDocument();
    expect(action).toHaveBeenCalledTimes(2);
  });
  it("disables requests while pending and does not retry after an uncertain outcome", async () => {
    await openEvidence("ticket");
    let finish!: (result: RatingsResult) => void;
    action.mockImplementationOnce(() => new Promise<RatingsResult>(resolve => { finish = resolve; }));
    fireEvent.change(screen.getByLabelText(/Staff reason/), { target: { value: "Synthetic risk finding" } });
    fireEvent.click(screen.getByRole("button", { name: "Exclude from reputation" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
    expect(screen.getByRole("button", { name: /Request in progress/ })).toBeDisabled();
    finish({ error: "Operation not confirmed" });
    await screen.findByRole("alert");
    expect(screen.queryByText("Synthetic sealed evidence")).not.toBeInTheDocument();
    expect(action).toHaveBeenLastCalledWith({ operation: "ratings", target: "ticket", id: ticketId, action: "exclude", reason: "Synthetic risk finding" });
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
  });
  it("renders evidence as escaped text and preserves a zero score", () => {
    const evidence = evidenceFixture(); evidence.reviews[0].body = "<script>private</script>";
    const { container } = render(<EvidenceDisplay evidence={evidence} />);
    expect(screen.getByText("<script>private</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Support thread/ })).toHaveAttribute("href", `/admin/support/${ticketId}`);
  });
});
