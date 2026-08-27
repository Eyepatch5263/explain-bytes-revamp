import { lazy, Suspense } from "react";

const NetworkSimulation = lazy(() => import("./network-simulation"));

export default function NetworkSimulationWrapper() {
  return <Suspense fallback={<div className="simulation-loading">Loading network simulation…</div>}><NetworkSimulation /></Suspense>;
}
