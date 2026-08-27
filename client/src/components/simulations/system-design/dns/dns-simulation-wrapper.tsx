import { lazy, Suspense } from "react";

const DnsSimulation = lazy(() => import("./dns-simulation"));

export default function DnsSimulationWrapper() {
  return <Suspense fallback={<div className="simulation-loading">Loading DNS simulation…</div>}><DnsSimulation /></Suspense>;
}
