import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const NetworkSimulation = lazy(() => import("./network-simulation"));

export default function NetworkSimulationWrapper() {
  return <Suspense fallback={<LoadingSkeleton kind="simulation" label="Loading multi-tier flow" />}><NetworkSimulation /></Suspense>;
}
