import { readAuthConfig } from "@/lib/auth/runtime-config";
import { requireStaffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireStaffAccess(STAFF_ROLES);
  if (!access.allowed) return children;

  const authConfig = readAuthConfig();

  return (
    <AdminShell
      role={access.role}
      environmentLabel={authConfig?.label ?? "DISABLED"}
      isProduction={authConfig?.environment === "production"}
    >
      {children}
    </AdminShell>
  );
}
