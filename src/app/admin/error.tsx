"use client";
export default function AdminError({ error, reset }: { error?: Error & { digest?: string }; reset: () => void }) {
  const reference = error?.digest && /^[0-9]{1,20}$/.test(error.digest) ? error.digest : null;
  return <section className="queue-message" role="alert"><h1>Data unavailable</h1><p>This page could not be loaded safely. Your session or the backend contract may need attention.</p>{reference && <p>Incident reference: {reference}</p>}<button onClick={reset}>Try again</button></section>;
}
