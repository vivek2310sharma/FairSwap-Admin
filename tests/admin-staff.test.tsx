import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import StaffForm from "@/app/admin/staff/staff-form";
import { StaffSearch } from "@/app/admin/staff/staff-search";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  requestClient: vi.fn(),
}));

vi.mock("@/app/admin/staff/actions", () => ({
  searchUsersAction: vi.fn().mockResolvedValue({
    data: [
      {
        user_id: "00000000-0000-0000-0000-000000000001",
        display_name: "Test User 1",
        email: "test1@example.com",
        account_status: "active",
        role: null,
      },
      {
        user_id: "00000000-0000-0000-0000-000000000002",
        display_name: "Test User 2",
        email: "test2@example.com",
        account_status: "active",
        role: "moderator",
      },
    ],
  }),
}));

// Mock useActionState since it is React 19 specific and might cause issues in older React Testing environments
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [{ error: null, success: false }, vi.fn(), false],
    useTransition: () => [false, (cb: () => void) => cb()],
  };
});


describe("Staff Management UX", () => {
  test("StaffSearch displays results when searched", async () => {
    const onSelect = vi.fn();
    render(<StaffSearch onSelect={onSelect} />);

    const input = screen.getByPlaceholderText(/Search by name, email, or UUID/i);
    const searchButton = screen.getByRole("button", { name: "Search" });

    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.click(searchButton);

    const user1 = await screen.findByText("Test User 1");
    expect(user1).toBeDefined();

    const user2 = await screen.findByText("Test User 2");
    expect(user2).toBeDefined();

    const selectButtons = await screen.findAllByRole("button", { name: /Select/i });
    expect(selectButtons).toHaveLength(2);

    fireEvent.click(selectButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ user_id: "00000000-0000-0000-0000-000000000001" }));
  });

  test("StaffForm enables submission only after user selection", async () => {
    render(<StaffForm />);

    // Check if the Assign Staff Role button is initially absent or disabled
    const assignButton1 = screen.queryByRole("button", { name: "Assign Staff Role" });
    if (assignButton1) {
        expect((assignButton1 as HTMLButtonElement).disabled).toBe(true);
    }

    const input = screen.getByPlaceholderText(/Search by name, email, or UUID/i);
    const searchButton = screen.getByRole("button", { name: "Search" });

    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.click(searchButton);

    const selectButtons = await screen.findAllByRole("button", { name: /Select/i });
    fireEvent.click(selectButtons[0]);

    // Check if the Selected User section appeared
    expect(screen.getByText("Selected User")).toBeDefined();
    expect(screen.getByText("Test User 1")).toBeDefined();

    const assignButton2 = screen.getByRole("button", { name: "Assign Staff Role" });
    expect(assignButton2).toBeDefined();
    expect((assignButton2 as HTMLButtonElement).disabled).toBe(false);
  });

  test("StaffForm warns about production availability and disables buttons", () => {
     render(<StaffForm isProduction={true} />);
     expect(screen.getByText(/Production staff role assignment and revocation are currently disabled/)).toBeDefined();

     const assignButton = screen.queryByRole("button", { name: "Assign Staff Role" });
     if (assignButton) {
         expect((assignButton as HTMLButtonElement).disabled).toBe(true);
     }
  });
});
