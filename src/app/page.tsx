import { FoundationShell } from "@/components/foundation-shell";
import { validateFoundationConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Home() {
  const config = validateFoundationConfig({
    deploymentEnvironment: process.env.FAIRSWAP_DEPLOYMENT_ENV,
    supabaseUrl: process.env.FAIRSWAP_SUPABASE_URL,
  });

  return <FoundationShell config={config} />;
}
