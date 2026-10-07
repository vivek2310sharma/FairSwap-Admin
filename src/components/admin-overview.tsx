import Link from "next/link";
import type { StaffRole } from "@/lib/auth/guard";
const areas = [
  { path: "listings", title: "Moderation Queue", description: "Review pending listings, photographs and status history; approve, reject or remove through the existing backend.", roles: ["administrator", "moderator"] },
  { path: "users", title: "User Management", description: "Search accounts, inspect listings and reports, and manage suspensions with an audited reason.", roles: ["administrator", "moderator"] },
  { path: "reports", title: "User & Content Reports", description: "Investigate reported content and case-scoped message evidence; record a resolution.", roles: ["administrator", "moderator"] },
  { path: "support", title: "Support & Appeals", description: "Read conversations, add private staff notes, reply to customers and manage ticket state.", roles: ["administrator", "support_agent"] },
  { path: "privacy", title: "Privacy Requests", description: "Review requests and update their status. Account deletion awaits a staff-scoped backend orchestration capability; no data-export action exists in the source screen.", roles: ["administrator"] },
  { path: "staff", title: "Staff Management", description: "Assign or revoke existing staff roles through audited backend procedures.", roles: ["administrator"] },
  { path: "audit", title: "Security Audit Trail", description: "Browse the latest 50 privileged-operation audit entries.", roles: ["administrator"] },
  { path: "categories", title: "Categories & Schemas", description: "Create and activate categories; inspect their structured attribute schemas. Schema editing is not implemented in the source.", roles: ["administrator", "content_editor"] },
  { path: "locations", title: "Locations", description: "Create pilot cities and localities and manage their active status.", roles: ["administrator"] },
];
export function AdminOverview({ role }: { role: StaffRole }) {
  return <section className="admin-overview"><h2>Admin Operations</h2><p>Role: {role}. All operations use FairSwapTest and your own verified staff session.</p>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{areas.filter((area) => area.roles.includes(role)).map((area) => <article key={area.path} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-bold">{area.title}</h3><p>{area.description}</p><Link href={`/admin/${area.path}`} prefetch={false}>Open {area.title} →</Link></article>)}</div>
  </section>;
}
