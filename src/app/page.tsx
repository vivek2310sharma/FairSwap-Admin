import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home(): never {
  // The existing Admin route owns session, MFA, role and policy checks.
  redirect("/admin");
}
