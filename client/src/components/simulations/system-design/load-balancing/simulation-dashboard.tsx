"use client";

import { Activity, Lock, Network } from "lucide-react";
import { useState } from "react";
import AlgorithmSimulationWrapper from "./algorithm-simulation-wrapper";
import NetworkSimulationWrapper from "./network-simulation-wrapper";
import SslSimulationWrapper from "./ssl-simulation-wrapper";

export default function SimulationDashboard() {
  const [activeTab, setActiveTab] = useState<
    "multi_tier" | "algorithms" | "ssl_tls"
  >("multi_tier");

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Simulation Dashboard Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-2">
          Select Simulation Mode
        </span>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("multi_tier")}
            className={`flex-1 sm:flex-initial py-1.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTab === "multi_tier"
                ? "bg-purple-650 text-black dark:text-white shadow-lg shadow-purple-900/10"
                : "bg-transparent text-zinc-650 hover:text-zinc-950 border-transparent dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Network className="w-4 h-4" />
            1. Multi-Tier Flow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("algorithms")}
            className={`flex-1 sm:flex-initial py-1.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTab === "algorithms"
                ? "bg-purple-650 text-black dark:text-white  shadow-lg shadow-purple-900/10"
                : "bg-transparent text-zinc-650 hover:text-zinc-950 border-transparent dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            2. Algorithms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ssl_tls")}
            className={`flex-1 sm:flex-initial py-1.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTab === "ssl_tls"
                ? "bg-purple-650 text-black dark:text-white  shadow-lg shadow-purple-900/10"
                : "bg-transparent text-zinc-650 hover:text-zinc-950 border-transparent dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            3. SSL/TLS Strategies
          </button>
        </div>
      </div>

      {/* Render Selected Simulation */}
      <div className="w-full">
        {activeTab === "multi_tier" ? (
          <NetworkSimulationWrapper />
        ) : activeTab === "algorithms" ? (
          <AlgorithmSimulationWrapper />
        ) : (
          <SslSimulationWrapper />
        )}
      </div>
    </div>
  );
}
