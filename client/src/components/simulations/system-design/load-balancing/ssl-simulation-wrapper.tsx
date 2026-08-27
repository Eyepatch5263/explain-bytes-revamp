import { lazy, Suspense } from "react";

const SslSimulation = lazy(() => import("./ssl-simulation"));

export default function SslSimulationWrapper() {
  return <Suspense fallback={<div className="simulation-loading">Loading TLS simulation…</div>}><SslSimulation /></Suspense>;
}
