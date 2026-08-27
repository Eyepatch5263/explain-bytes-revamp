import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const DatabaseSimulation = lazy(() => import("./database-simulation"));

export default function DatabaseSimulationWrapper() {
  return <Suspense fallback={<LoadingSkeleton kind="simulation" label="Loading database simulation" />}><DatabaseSimulation /></Suspense>;
}
