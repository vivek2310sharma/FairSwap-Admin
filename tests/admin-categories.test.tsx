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
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "administrator" } }),
      order: vi.fn().mockResolvedValue({
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
      }),
    }),
  }),
}));

describe("Category Management UX", () => {
  test("Filters categories by name and displays correct count", async () => {
    const Component = await AdminCategoriesPage({ searchParams: Promise.resolve({ q: "Music" }) });
    render(Component);

    // Filter should show only one category
    expect(screen.getByText("Musical Instruments")).toBeDefined();
    expect(screen.queryByText("Electronics")).toBeNull();

    // Check results count
    expect(screen.getByText("1 result")).toBeDefined();
  });

  test("Filters categories by status", async () => {
    const Component = await AdminCategoriesPage({ searchParams: Promise.resolve({ status: "inactive" }) });
    render(Component);

    // Filter should show only inactive categories
    expect(screen.queryByText("Musical Instruments")).toBeNull();
    expect(screen.getByText("Electronics")).toBeDefined();

    expect(screen.getByText("1 result")).toBeDefined();
  });

  test("Renders category attributes correctly", async () => {
    const Component = await AdminCategoriesPage({ searchParams: Promise.resolve({}) });
    render(Component);

    expect(screen.getByText("Brand")).toBeDefined();
    expect(screen.getByText("No attributes defined")).toBeDefined(); // For the second category
  });
});
