"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffRole } from "@/lib/auth/guard";
import { SessionControls } from "@/components/auth-forms";
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Flag,
  Headphones,
  Lock,
  FolderTree,
  MapPin,
  ShieldCheck,
  History,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly StaffRole[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["administrator", "moderator", "support_agent", "content_editor"],
      },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      {
        label: "Listings",
        href: "/admin/listings",
        icon: ShieldAlert,
        roles: ["administrator", "moderator"],
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        roles: ["administrator", "moderator"],
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: Flag,
        roles: ["administrator", "moderator"],
      },
    ],
  },
  {
    title: "Customer Operations",
    items: [
      {
        label: "Support & Appeals",
        href: "/admin/support",
        icon: Headphones,
        roles: ["administrator", "support_agent"],
      },
      {
        label: "Privacy",
        href: "/admin/privacy",
        icon: Lock,
        roles: ["administrator"],
      },
    ],
  },
  {
    title: "Catalogue",
    items: [
      {
        label: "Categories",
        href: "/admin/categories",
        icon: FolderTree,
        roles: ["administrator", "content_editor"],
      },
      {
        label: "Locations",
        href: "/admin/locations",
        icon: MapPin,
        roles: ["administrator"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Staff",
        href: "/admin/staff",
        icon: ShieldCheck,
        roles: ["administrator"],
      },
      {
        label: "Audit",
        href: "/admin/audit",
        icon: History,
        roles: ["administrator"],
      },
    ],
  },
];

interface AdminShellProps {
  role: StaffRole;
  userEmail?: string;
  environmentLabel: string;
  isProduction: boolean;
  children: React.ReactNode;
}

export function AdminShell({
  role,
  userEmail,
  environmentLabel,
  isProduction,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isInitialMount = useRef(true);

  // Close mobile drawer on route change without setState inside useEffect
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Handle focus management and escape key for mobile drawer
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (mobileOpen) {
      closeButtonRef.current?.focus();
    } else {
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Filter groups and items by role
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);

  const isLinkActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Find page title for top bar context
  let currentTitle = "Dashboard";
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href !== "/admin" && pathname.startsWith(item.href)) {
        currentTitle = item.label;
        break;
      }
    }
  }

  const roleLabelMap: Record<StaffRole, string> = {
    administrator: "Administrator",
    moderator: "Moderator",
    support_agent: "Support Agent",
    content_editor: "Content Editor",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              FairSwap <span className="text-emerald-600 font-medium">Admin</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              isProduction
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            {environmentLabel}
          </span>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        aria-label="Mobile navigation drawer"
        {...(mobileOpen ? { role: "dialog", "aria-modal": true } : { "aria-hidden": true })}
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-100 z-50 transform transition-transform duration-200 ease-in-out md:hidden flex flex-col shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight">
                FairSwap Admin
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {environmentLabel} Portal
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            tabIndex={mobileOpen ? 0 : -1}
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Admin areas" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      tabIndex={mobileOpen ? 0 : -1}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-100 truncate">
                {userEmail || "Verified Staff Session"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xs px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/60">
                  {roleLabelMap[role]}
                </span>
                <span className="text-2xs text-slate-400 font-mono">AAL2</span>
              </div>
            </div>
          </div>
          <SessionControls />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        aria-label="Desktop sidebar"
        className={`hidden md:flex flex-col sticky top-0 h-screen border-r border-slate-200 bg-slate-900 text-slate-100 transition-all duration-200 shrink-0 z-20 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? "justify-center w-full" : ""}`}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-base tracking-tight truncate">
                  FairSwap <span className="text-emerald-400 font-medium">Admin</span>
                </span>
                <span className="text-xs text-slate-400 font-medium truncate">
                  {environmentLabel} Environment
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="p-2 border-b border-slate-800 flex justify-center">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav aria-label="Admin areas" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                      } ${
                        active
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-100 truncate" title={userEmail}>
                    {userEmail || "Verified Staff Session"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-2xs px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/60">
                      {roleLabelMap[role]}
                    </span>
                    <span className="text-2xs text-slate-400 font-mono">AAL2</span>
                  </div>
                </div>
              </div>
              <div className="pt-1">
                <SessionControls />
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <SessionControls />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                isProduction
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isProduction ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              {environmentLabel}
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="font-semibold">{userEmail || roleLabelMap[role]}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-emerald-700 font-semibold">AAL2</span>
            </div>
          </div>
        </header>

        {/* Production Restriction Notice Banner */}
        {isProduction && (
          <aside aria-label="Environment notices" className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              <strong>Production Environment Notice:</strong> Initial release — listing removal, account status, staff roles, and privacy status changes are unavailable.
            </p>
          </aside>
        )}

        {/* Page Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
