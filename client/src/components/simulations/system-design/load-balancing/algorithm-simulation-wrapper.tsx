import { lazy, Suspense } from "react";

const AlgorithmSimulation = lazy(() => import("./algorithm-simulation"));

export default function AlgorithmSimulationWrapper() {
  return <Suspense fallback={<div className="simulation-loading">Loading algorithm simulation…</div>}><AlgorithmSimulation /></Suspense>;
}
