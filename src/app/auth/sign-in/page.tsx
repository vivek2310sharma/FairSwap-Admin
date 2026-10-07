import { SignInForm } from "@/components/auth-forms";
import { readAuthConfig } from "@/lib/auth/runtime-config";

export const dynamic = "force-dynamic";
export default function SignInPage() {
  return <main className="auth-shell"><h1>FairSwap Admin — TEST</h1><h2>Staff sign-in</h2>
    {readAuthConfig() ? <SignInForm /> : <p role="alert">Test authentication configuration is unavailable. Sign-in is disabled.</p>}
    <p>Existing staff accounts only. No signup or password recovery is available here.</p>
  </main>;
}
