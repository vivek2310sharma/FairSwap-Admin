"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="queue-message" role="alert"><h1>Test data unavailable</h1><p>This page could not be loaded safely. Your session or the backend contract may need attention.</p><button onClick={reset}>Try again</button></section>;
}
