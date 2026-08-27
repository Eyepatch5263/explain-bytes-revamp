import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const SslSimulation = lazy(() => import("./ssl-simulation"));

export default function SslSimulationWrapper() {
  return <Suspense fallback={<LoadingSkeleton kind="simulation" label="Loading SSL and TLS strategies" />}><SslSimulation /></Suspense>;
}
