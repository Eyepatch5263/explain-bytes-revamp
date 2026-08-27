import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const DnsSimulation = lazy(() => import("./dns-simulation"));

export default function DnsSimulationWrapper() {
  return <Suspense fallback={<LoadingSkeleton kind="simulation" label="Loading DNS simulation" />}><DnsSimulation /></Suspense>;
}
