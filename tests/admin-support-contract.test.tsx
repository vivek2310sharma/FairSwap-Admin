import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { createFakeAdminClient, type TableOutcome } from "./helpers/fake-admin-client";

const mocks = vi.hoisted(() => ({
  pageClient: vi.fn(),
  redirect: vi.fn((target: string): never => {
    throw new Error(`REDIRECT:${target}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  replyFormProps: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/server", () => ({ pageClient: mocks.pageClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock("@/components/communication/StaffSupportReplyForm", () => ({
  StaffSupportReplyForm: (props: Record<string, unknown>) => {
    mocks.replyFormProps(props);
    return <div data-testid="reply-form" />;
  },
}));

import AdminSupportPage from "@/app/admin/support/page";
import AdminSupportDetailPage from "@/app/admin/support/[id]/page";
import {
  classifySupportSender,
  describeTicketCustomer,
  formatSupportTicketReference,
} from "@/lib/admin/support-ticket-display";

const CUSTOMER_ID = "11111111-2222-4333-8444-555555555555";
const STAFF_ID = "99999999-8888-4777-8666-555555555555";
const TICKET_ID = "9b2f6f1e-1234-4abc-8def-0123456789ab";

const safetyTicket = {
  id: TICKET_ID,
  user_id: CUSTOMER_ID,
  category: "safety",
  subject: "Fake courier link",
  status: "open",
  priority: "normal",
  assigned_to: null,
  created_at: "2026-10-23T08:00:00.000Z",
  updated_at: "2026-10-23T08:05:00.000Z",
};

type Tables = Record<string, TableOutcome>;

function setup(overrides: Tables = {}, user: { id: string } | null = { id: "staff-1" }) {
  const fake = createFakeAdminClient({
    user,
    tables: {
      staff_roles: { data: { role: "support_agent" } },
      support_tickets: { data: [safetyTicket] },
      profiles: { data: [{ id: CUSTOMER_ID, display_name: "Asha Verma" }] },
      user_accounts: { data: { user_id: CUSTOMER_ID, account_status: "active" } },
      support_messages: { data: [] },
      ...overrides,
    },
  });
  mocks.pageClient.mockResolvedValue(fake.client);
  return fake;
}

const detailParams = (id = TICKET_ID) => ({ params: Promise.resolve({ id }) });
const queueProps = (status?: string) => ({ searchParams: Promise.resolve(status ? { status } : {}) });

const message = (over: Partial<{ id: string; sender_id: string | null; is_internal_note: boolean; content: string }>) => ({
  id: "m1",
  ticket_id: TICKET_ID,
  sender_id: CUSTOMER_ID,
  is_internal_note: false,
  content: "Hello",
  created_at: "2026-10-23T08:00:00.000Z",
  ...over,
});

describe("support queue: canonical contract", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  test("reads only columns that exist on support_tickets, with no ticket_number", async () => {
    const fake = setup();
    render(await AdminSupportPage(queueProps()));

    const q = fake.queries.find((x) => x.table === "support_tickets");
    expect(q?.select).toBe("id, user_id, category, subject, status, priority, created_at, updated_at");
    expect(q?.select).not.toContain("ticket_number");
    expect(q?.limit).toBe(100);
    expect(q?.eq).toContainEqual(["status", "open"]);
  });

  test("a safety ticket appears in the open queue and is not read from the reports table", async () => {
    const fake = setup();
    render(await AdminSupportPage(queueProps()));

    const link = screen.getByRole("link", { name: /Handle/ });
    expect(link).toHaveAttribute("href", `/admin/support/${TICKET_ID}`);
    const row = link.closest("tr")!;
    expect(row).toHaveTextContent("Fake courier link");
    expect(row).toHaveTextContent("safety");
    expect(row).toHaveTextContent("Asha Verma");
    expect(fake.queries.some((x) => x.table === "reports")).toBe(false);
  });

  test("shows a short reference derived from the id, while links keep the full UUID", async () => {
    setup();
    render(await AdminSupportPage(queueProps()));

    expect(screen.getByText("#9B2F6F1E")).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(TICKET_ID))).toBeNull();
    expect(screen.getByRole("link", { name: /Handle/ }).getAttribute("href")).toContain(TICKET_ID);
  });

  test("a genuinely empty queue shows the empty state, not an error", async () => {
    setup({ support_tickets: { data: [] } });
    render(await AdminSupportPage(queueProps()));

    expect(screen.getByText("No open tickets found")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("a failed read (thrown by pageClient) renders an explicit failure, never an empty queue", async () => {
    setup({ support_tickets: { throws: true } });
    render(await AdminSupportPage(queueProps()));

    expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.getByRole("alert")).toHaveTextContent("not an empty queue");
    expect(screen.queryByText(/No open tickets found/)).toBeNull();
  });

  test("a returned database error is treated the same way and its raw text never reaches the UI", async () => {
    setup({
      support_tickets: { error: { message: 'column support_tickets.ticket_number does not exist', code: "42703" } },
    });
    const { container } = render(await AdminSupportPage(queueProps()));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/No open tickets found/)).toBeNull();
    expect(container.textContent).not.toMatch(/ticket_number|42703|does not exist/);
  });

  test("customer labels: unreadable profile is 'Customer unavailable', only a null owner is 'Deleted user'", async () => {
    setup({
      support_tickets: {
        data: [
          { ...safetyTicket, id: "aaaaaaaa-1111-4111-8111-111111111111", user_id: CUSTOMER_ID },
          { ...safetyTicket, id: "bbbbbbbb-2222-4222-8222-222222222222", user_id: null },
        ],
      },
      profiles: { throws: true },
    });
    render(await AdminSupportPage(queueProps()));

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Customer unavailable");
    expect(rows[0]).not.toHaveTextContent("Deleted user");
    expect(rows[1]).toHaveTextContent("Deleted user");
    // The queue itself survives a profile-read failure.
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("keeps the staff gates: role allowlist, sign-in redirect and non-support roles", async () => {
    setup();
    await AdminSupportPage(queueProps());
    expect(mocks.pageClient).toHaveBeenCalledWith(["administrator", "support_agent"]);

    setup({}, null);
    await expect(AdminSupportPage(queueProps())).rejects.toThrow("REDIRECT:/auth/sign-in?next=/admin/support");

    setup({ staff_roles: { data: { role: "moderator" } } });
    await expect(AdminSupportPage(queueProps())).rejects.toThrow("REDIRECT:/admin");
  });
});

describe("support detail: canonical contract", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  test("reads only canonical ticket and message columns, with no is_staff_reply or profiles embed", async () => {
    const fake = setup();
    render(await AdminSupportDetailPage(detailParams()));

    const ticketQuery = fake.queries.find((x) => x.table === "support_tickets");
    expect(ticketQuery?.select).not.toContain("ticket_number");
    expect(ticketQuery?.eq).toContainEqual(["id", TICKET_ID]);
    const messageQuery = fake.queries.find((x) => x.table === "support_messages");
    expect(messageQuery?.select).toBe("id, ticket_id, sender_id, is_internal_note, content, created_at");
    expect(messageQuery?.select).not.toMatch(/is_staff_reply|profiles|sender:/);
    expect(messageQuery?.eq).toContainEqual(["ticket_id", TICKET_ID]);
    expect(messageQuery?.order).toBe("created_at");
  });

  test("a missing ticket is a 404; a failed read is an explicit error, not a 404", async () => {
    setup({ support_tickets: { data: null } });
    await expect(AdminSupportDetailPage(detailParams())).rejects.toThrow("NEXT_NOT_FOUND");

    mocks.notFound.mockClear();
    setup({ support_tickets: { throws: true } });
    render(await AdminSupportDetailPage(detailParams()));
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.getByRole("alert")).toHaveTextContent("not a missing ticket");
    expect(screen.queryByTestId("reply-form")).toBeNull();
  });

  test("a returned ticket query error is also an explicit failure with no raw text", async () => {
    setup({ support_tickets: { error: { message: "permission denied for table support_tickets", code: "42501" } } });
    const { container } = render(await AdminSupportDetailPage(detailParams()));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/permission denied|42501|support_tickets/);
  });

  test("a malformed id is a 404 without any query", async () => {
    const fake = setup();
    await expect(AdminSupportDetailPage(detailParams("not-a-uuid"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(fake.queries).toHaveLength(0);
  });

  test("a message query failure shows an explicit state, not 'No messages', and withholds the reply form", async () => {
    setup({ support_messages: { throws: true } });
    render(await AdminSupportDetailPage(detailParams()));

    expect(screen.getByRole("alert")).toHaveTextContent("messages for this ticket could not be loaded");
    expect(screen.queryByText(/No messages recorded/)).toBeNull();
    expect(screen.queryByTestId("reply-form")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("unavailable until the conversation can be loaded");
  });

  test("a genuinely empty thread shows the empty state and still offers the reply form", async () => {
    setup({ support_messages: { data: [] } });
    render(await AdminSupportDetailPage(detailParams()));

    expect(screen.getByText(/No messages recorded/)).toBeInTheDocument();
    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("passes the full ticket UUID, never the short reference, to the reply and status form", async () => {
    setup();
    render(await AdminSupportDetailPage(detailParams()));

    expect(screen.getByText("#9B2F6F1E")).toBeInTheDocument();
    expect(mocks.replyFormProps).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: TICKET_ID, currentStatus: "open", currentPriority: "normal" })
    );
  });

  test("attributes messages: customer, support team, internal note and unavailable", async () => {
    setup({
      support_messages: {
        data: [
          message({ id: "c", sender_id: CUSTOMER_ID, content: "I was asked to pay a courier fee." }),
          message({ id: "s", sender_id: STAFF_ID, content: "Thanks, we are reviewing it." }),
          message({ id: "n", sender_id: STAFF_ID, is_internal_note: true, content: "Check for repeat reports." }),
          message({ id: "u", sender_id: null, content: "Message from a removed account." }),
        ],
      },
    });
    render(await AdminSupportDetailPage(detailParams()));

    const thread = (text: string) => screen.getByText(text).closest("div.rounded-xl") as HTMLElement;
    expect(thread("I was asked to pay a courier fee.")).toHaveTextContent("Asha Verma (Customer)");
    expect(thread("Thanks, we are reviewing it.")).toHaveTextContent("Support team (Staff Reply)");
    expect(thread("Check for repeat reports.")).toHaveTextContent("Internal Note (Staff Only)");
    expect(thread("Message from a removed account.")).toHaveTextContent("Sender unavailable");
    expect(within(thread("Message from a removed account.")).queryByText(/Staff Reply|Customer/)).toBeNull();
  });

  test("when the ticket has no owner, non-internal messages are 'Sender unavailable', never guessed", async () => {
    setup({
      support_tickets: { data: { ...safetyTicket, user_id: null } },
      support_messages: { data: [message({ sender_id: STAFF_ID, content: "Reply on an orphaned ticket" })] },
    });
    render(await AdminSupportDetailPage(detailParams()));

    const card = screen.getByText("Reply on an orphaned ticket").closest("div.rounded-xl")!;
    expect(card).toHaveTextContent("Sender unavailable");
    expect(screen.getAllByText("Deleted user").length).toBeGreaterThan(0);
  });

  test("keeps the staff gates and never leaks raw errors on the detail page", async () => {
    setup();
    await AdminSupportDetailPage(detailParams());
    expect(mocks.pageClient).toHaveBeenCalledWith(["administrator", "support_agent"]);

    setup({ staff_roles: { data: { role: "moderator" } } });
    await expect(AdminSupportDetailPage(detailParams())).rejects.toThrow("REDIRECT:/admin");

    setup({}, null);
    await expect(AdminSupportDetailPage(detailParams())).rejects.toThrow(
      `REDIRECT:/auth/sign-in?next=/admin/support/${TICKET_ID}`
    );
  });
});

describe("support-ticket-display helpers", () => {
  test("reference is a short deterministic display value, not an identifier", () => {
    expect(formatSupportTicketReference(TICKET_ID)).toBe("9B2F6F1E");
    expect(formatSupportTicketReference(TICKET_ID)).toHaveLength(8);
    // Different ids can in principle share a prefix: the helper never claims uniqueness.
    expect(formatSupportTicketReference("9b2f6f1e-0000-4000-8000-000000000001")).toBe(
      formatSupportTicketReference("9b2f6f1e-ffff-4fff-8fff-ffffffffffff")
    );
  });

  test("sender classification covers null ids and internal notes", () => {
    expect(classifySupportSender({ sender_id: CUSTOMER_ID, is_internal_note: false }, CUSTOMER_ID)).toBe("customer");
    expect(classifySupportSender({ sender_id: STAFF_ID, is_internal_note: false }, CUSTOMER_ID)).toBe("staff");
    expect(classifySupportSender({ sender_id: STAFF_ID, is_internal_note: true }, CUSTOMER_ID)).toBe("internal_note");
    expect(classifySupportSender({ sender_id: null, is_internal_note: true }, CUSTOMER_ID)).toBe("internal_note");
    expect(classifySupportSender({ sender_id: null, is_internal_note: false }, CUSTOMER_ID)).toBe("unavailable");
    expect(classifySupportSender({ sender_id: STAFF_ID, is_internal_note: false }, null)).toBe("unavailable");
    expect(classifySupportSender({ sender_id: null, is_internal_note: false }, null)).toBe("unavailable");
  });

  test("customer label never claims deletion for a merely unreadable profile", () => {
    expect(describeTicketCustomer(CUSTOMER_ID, "Asha")).toBe("Asha");
    expect(describeTicketCustomer(CUSTOMER_ID, undefined)).toBe("Customer unavailable");
    expect(describeTicketCustomer(CUSTOMER_ID, "   ")).toBe("Customer unavailable");
    expect(describeTicketCustomer(null, "Asha")).toBe("Deleted user");
  });
});

describe("source contract regression", () => {
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

  test("support pages no longer reference columns or relationships absent from the canonical schema", () => {
    for (const file of ["src/app/admin/support/page.tsx", "src/app/admin/support/[id]/page.tsx"]) {
      const content = read(file);
      expect(content, file).not.toContain("ticket_number");
      expect(content, file).not.toContain("is_staff_reply");
      expect(content, file).not.toMatch(/sender:\s*profiles/);
    }
  });

  test("the pages neither log nor print ticket content", () => {
    for (const file of ["src/app/admin/support/page.tsx", "src/app/admin/support/[id]/page.tsx"]) {
      expect(read(file), file).not.toMatch(/console\.(log|error|warn|info)/);
    }
  });

  test("mutations and the guarded server actions are untouched by this change", () => {
    // Behavioural guard: the reply form still posts the full ticket UUID through the existing actions.
    const form = read("src/components/communication/StaffSupportReplyForm.tsx");
    expect(form).toContain("ticketId");
    expect(read("src/lib/admin/mutations.ts")).toContain("admin_reply_support_ticket");
  });
});
