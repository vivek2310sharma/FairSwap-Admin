import { ENVIRONMENTS, type FoundationConfig } from "@/lib/config";

const configMessages: Record<FoundationConfig["status"], string> = {
  unconfigured: "Deployment configuration is missing. Staff workflows remain disabled.",
  invalid: "Deployment configuration is invalid. Staff workflows remain disabled.",
  validated:
    "Target configuration is validated. No backend connection is established. Staff workflows remain disabled.",
};

export function FoundationShell({ config }: { config: FoundationConfig }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-semibold tracking-widest text-teal-700">
        ADMIN-01A
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        FairSwap Admin — {config.status === "validated" ? ENVIRONMENTS[config.deploymentEnvironment].label : "DISABLED"}
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        Foundation only. Staff workflows are not implemented.
      </p>
      <section
        aria-labelledby="configuration-heading"
        className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="configuration-heading" className="text-lg font-semibold">
          Configuration status
        </h2>
        <p role="status" className="mt-3 leading-relaxed text-slate-600">
          {configMessages[config.status]}
        </p>
      </section>
    </main>
  );
}
