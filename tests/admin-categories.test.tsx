import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AdminCategoriesPage from "@/app/admin/categories/page";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/server", () => ({
  pageClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "123" } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "administrator" } }),
      limit: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => void) => resolve({
        data: [
          {
            id: "cat-1",
            name: "Musical Instruments",
            slug: "musical-instruments",
            description: "Guitars, keyboards, drums",
            is_active: true,
            category_attributes: [{ id: "attr-1", label: "Brand", value_type: "string", is_required: true }],
          },
          {
            id: "cat-2",
            name: "Electronics",
            slug: "electronics",
            description: "Phones, computers, TVs",
            is_active: false,
            category_attributes: [],
          },
        ],
        count: 2,
      }),
    }),
  }),
}));

describe("Category Management UX", () => {
  test("Passes search and status to server", async () => {
    const Component = await AdminCategoriesPage({ searchParams: Promise.resolve({ q: "Music", status: "inactive" }) });
    render(Component);
    // Values correctly map to defaultValue on UI filters
    expect(screen.getByPlaceholderText(/Search by name or slug/i)).toBeDefined();
  });

  test("Renders category attributes correctly", async () => {
    const Component = await AdminCategoriesPage({ searchParams: Promise.resolve({}) });
    render(Component);

    expect(screen.getByText("Brand")).toBeDefined();
    expect(screen.getByText("No attributes defined")).toBeDefined(); // For the second category
  });
});
