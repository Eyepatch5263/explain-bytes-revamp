import { lazy, Suspense } from "react";

const DatabaseSimulation = lazy(() => import("./database-simulation"));

export default function DatabaseSimulationWrapper() {
  return <Suspense fallback={<div className="simulation-loading">Loading database simulation…</div>}><DatabaseSimulation /></Suspense>;
}
