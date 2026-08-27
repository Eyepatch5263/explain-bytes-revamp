import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const AlgorithmSimulation = lazy(() => import("./algorithm-simulation"));

export default function AlgorithmSimulationWrapper() {
  return <Suspense fallback={<LoadingSkeleton kind="simulation" label="Loading routing algorithms" />}><AlgorithmSimulation /></Suspense>;
}
