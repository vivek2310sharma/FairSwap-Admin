import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/app/auth/actions", () => ({ signInAction: vi.fn(), enrollAction: vi.fn(), verifyAction: vi.fn(), signOutAction: vi.fn(), recheckAction: vi.fn() }));
import { SignInForm, MfaForms, SessionControls } from "@/components/auth-forms";
import SignInPage from "@/app/auth/sign-in/page";

describe("accessible auth UI and disabled configuration", () => {
  it("keeps sign-in disabled with configuration unset and makes no calls", () => {
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", undefined);
    render(<SignInPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("configuration is unavailable");
    expect(screen.queryByRole("button")).not.toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
  });
  it("provides labelled email/password inputs and client validation", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Staff email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    fireEvent.submit(screen.getByRole("button").closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent("valid email and password");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not enroll automatically and shows an explicit setup button", () => {
    render(<MfaForms factors={[]} />);
    expect(screen.getByRole("button", { name: "Begin TOTP enrollment" })).toBeVisible();
    expect(screen.queryByLabelText("Six-digit authenticator code")).not.toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
  });
  it("existing-factor challenge provides no enrollment bypass and validates the code", () => {
    render(<MfaForms factors={[{ id: "22222222-2222-4222-8222-222222222222", status: "verified" }]} />);
    expect(screen.queryByRole("button", { name: "Begin TOTP enrollment" })).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Verify code" }).closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent("six-digit code");
  });
  it("policy failures have distinct retry and local signout controls", () => {
    render(<SessionControls retry />);
    expect(screen.getByRole("button", { name: "Recheck access" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out of Admin" })).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
});
