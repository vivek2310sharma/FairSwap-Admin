import Link from "next/link";
import { requireStaffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { SessionControls } from "@/components/auth-forms";
const areas = [
  ["Overview", "", STAFF_ROLES], ["Listings", "/listings", ["administrator", "moderator"]],
  ["Users", "/users", ["administrator", "moderator"]], ["Reports", "/reports", ["administrator", "moderator"]],
  ["Support & appeals", "/support", ["administrator", "support_agent"]], ["Privacy", "/privacy", ["administrator"]],
  ["Staff", "/staff", ["administrator"]], ["Audit", "/audit", ["administrator"]],
  ["Categories", "/categories", ["administrator", "content_editor"]], ["Locations", "/locations", ["administrator"]],
] as const;
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireStaffAccess(STAFF_ROLES);
  if (!access.allowed) return children;
  return <div className="admin-portal"><header className="admin-nav"><strong>FairSwap Admin · TEST</strong><span>AAL2 · {access.role}</span>
    <nav aria-label="Admin areas">{areas.filter(([, , roles]) => (roles as readonly string[]).includes(access.role)).map(([label,path]) => <Link key={path} href={`/admin${path}`} prefetch={false}>{label}</Link>)}</nav>
    <SessionControls />
  </header>{children}</div>;
}
