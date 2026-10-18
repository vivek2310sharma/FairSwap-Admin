import Link from "next/link";
import type { StaffRole } from "@/lib/auth/guard";
import {
  ShieldAlert,
  Users,
  Flag,
  Headphones,
  Lock,
  ShieldCheck,
  History,
  FolderTree,
  MapPin,
  Shield,
  Activity,
} from "lucide-react";

interface OperationalArea {
  path: string;
  title: string;
  description: string;
  category: "Trust & Safety" | "Customer Operations" | "Catalogue" | "Administration";
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly StaffRole[];
}

const areas: OperationalArea[] = [
  {
    path: "listings",
    title: "Moderation Queue",
    description: "Review pending listings, photographs and status history; approve, reject or remove through the existing backend.",
    category: "Trust & Safety",
    icon: ShieldAlert,
    roles: ["administrator", "moderator"],
  },
  {
    path: "users",
    title: "User Management",
    description: "Search accounts, inspect listings and reports, and manage suspensions with an audited reason.",
    category: "Trust & Safety",
    icon: Users,
    roles: ["administrator", "moderator"],
  },
  {
    path: "reports",
    title: "User & Content Reports",
    description: "Investigate reported content and case-scoped message evidence; record a resolution.",
    category: "Trust & Safety",
    icon: Flag,
    roles: ["administrator", "moderator"],
  },
  {
    path: "support",
    title: "Support & Appeals",
    description: "Read conversations, add private staff notes, reply to customers and manage ticket state.",
    category: "Customer Operations",
    icon: Headphones,
    roles: ["administrator", "support_agent"],
  },
  {
    path: "privacy",
    title: "Privacy Requests",
    description: "Review requests and update their status. Account deletion awaits a staff-scoped backend orchestration capability; no data-export action exists in the source screen.",
    category: "Customer Operations",
    icon: Lock,
    roles: ["administrator"],
  },
  {
    path: "staff",
    title: "Staff Management",
    description: "Assign or revoke existing staff roles through audited backend procedures.",
    category: "Administration",
    icon: ShieldCheck,
    roles: ["administrator"],
  },
  {
    path: "audit",
    title: "Security Audit Trail",
    description: "Browse the latest 50 privileged-operation audit entries.",
    category: "Administration",
    icon: History,
    roles: ["administrator"],
  },
  {
    path: "categories",
    title: "Categories & Schemas",
    description: "Create and activate categories; inspect their structured attribute schemas. Schema editing is not implemented in the source.",
    category: "Catalogue",
    icon: FolderTree,
    roles: ["administrator", "content_editor"],
  },
  {
    path: "locations",
    title: "Locations",
    description: "Create pilot cities and localities and manage their active status.",
    category: "Catalogue",
    icon: MapPin,
    roles: ["administrator"],
  },
];

const roleTitles: Record<StaffRole, string> = {
  administrator: "Administrator Workspace",
  moderator: "Trust & Safety Workspace",
  support_agent: "Customer Support Workspace",
  content_editor: "Catalogue Editor Workspace",
};

export function AdminOverview({ role }: { role: StaffRole }) {
  const visibleAreas = areas.filter((area) => area.roles.includes(role));

  return (
    <section className="admin-overview space-y-8">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Verified Session · {roleTitles[role]}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              FairSwap Operational Hub
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Welcome back. Operations connect directly to your assigned backend using your verified staff credentials. Select an operational module below to manage marketplace activities.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs text-slate-300">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">System Status</div>
              <div className="text-emerald-400 font-medium">All Systems Operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Module Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Operational Modules
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Showing {visibleAreas.length} authorized {visibleAreas.length === 1 ? "area" : "areas"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAreas.map((area) => {
            const Icon = area.icon;
            return (
              <article
                key={area.path}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1 rounded-md bg-slate-100">
                      {area.category}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {area.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    href={`/admin/${area.path}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors focus:outline-hidden"
                  >
                    <span>Open {area.title} →</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
