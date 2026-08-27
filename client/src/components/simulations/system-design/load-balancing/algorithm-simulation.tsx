"use client";

import { Pause, Play, RotateCcw, Server, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Packet {
  id: string;
  clientIP: string;
  clientIndex: number;
  targetServerId: string;
  step: "to-lb" | "to-server";
  progress: number;
  color: string;
}

interface ServerState {
  id: string;
  name: string;
  weight: number;
  requests: number;
  activeConnections: number;
  cpu: number;
  isSlow: boolean;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "lb" | "server";
}

const CLIENTS = [
  { id: "client_1", name: "User A", ip: "198.51.100.42", color: "#a855f7" }, // Purple
  { id: "client_2", name: "User B", ip: "203.0.113.88", color: "#3b82f6" }, // Blue
  { id: "client_3", name: "User C", ip: "192.0.2.77", color: "#10b981" }, // Emerald
];

const ALGO_DESCRIPTIONS = {
  round_robin: {
    title: "Round Robin",
    desc: "Distributes requests sequentially down the list of servers. Ideal when servers are of equal specification and tasks are homogeneous.",
    pros: "Simple, state-free, zero computational overhead.",
    cons: "Assumes homogeneous server capacity and short, equal request durations.",
  },
  weighted_round_robin: {
    title: "Weighted Round Robin",
    desc: "Directs requests to servers based on pre-assigned weight. Server 1 has a weight of 3, meaning it receives 3x more requests than Servers 2 or 3.",
    pros: "Handles heterogeneous server pools (different CPU/memory specs).",
    cons: "Static weights do not adapt to real-time workload fluctuations.",
  },
  least_connections: {
    title: "Least Connections",
    desc: "Dynamically routes requests to the server with the fewest active connections. Highly useful for long-lived tasks or databases.",
    pros: "Adapts to varying request durations and protects overloaded servers.",
    cons: "Requires tracking active connection state at the load balancer.",
  },
  ip_hash: {
    title: "IP Hash (Session Affinity)",
    desc: "Hashes the client's IP address to map them consistently to the same backend server. Ensures session stickiness without shared database state.",
    pros: "Provides local session caching benefits; guarantees user persistence.",
    cons: "Can lead to uneven distribution if many users share a NAT gateway IP.",
  },
};

const CODE_SNIPPETS = {
  round_robin: `class RoundRobin {
  private index = 0;
  private servers = ["Server 1", "Server 2", "Server 3"];

  getNextServer() {
    const server = this.servers[this.index];
    this.index = (this.index + 1) % this.servers.length;
    return server;
  }
}`,
  weighted_round_robin: `interface WeightedServer {
    host: string;
    weight: number;
}
 
class WeightedRoundRobin {
    private servers: WeightedServer[];
    private currentIndex = 0;
    private currentWeight = 0;
    private maxWeight = 0;
 
    constructor(servers: WeightedServer[]) {
        this.servers = servers;
        this.maxWeight = Math.max(...servers.map(s => s.weight));
    }
 
    getNextServer(): string {
        while (true) {
            this.currentIndex = (this.currentIndex + 1) % this.servers.length;
            if (this.currentIndex === 0) {
                this.currentWeight = this.currentWeight - 1;
                if (this.currentWeight <= 0) {
                    this.currentWeight = this.maxWeight;
                }
            }
            if (this.servers[this.currentIndex].weight >= this.currentWeight) {
                return this.servers[this.currentIndex].host;
            }
        }
    }
}`,
  least_connections: `class LeastConnections {
  private servers = [
    { name: "Server 1", activeConnections: 0 },
    { name: "Server 2", activeConnections: 0 },
    { name: "Server 3", activeConnections: 0 }
  ];

  getNextServer() {
    // Route to server with fewest active connections
    return this.servers.reduce((prev, curr) => 
      prev.activeConnections <= curr.activeConnections ? prev : curr
    );
  }
}`,
  ip_hash: `class IPHash {
  private servers = ["Server 1", "Server 2", "Server 3"];

  getNextServer(clientIP) {
    // Hash client IP to select a server
    const hash = clientIP.split(".")
      .reduce((acc, octet) => acc + parseInt(octet), 0);
    
    return this.servers[hash % this.servers.length];
  }
}`,
};

export default function AlgorithmSimulation() {
  const [algorithm, setAlgorithm] = useState<
    "round_robin" | "weighted_round_robin" | "least_connections" | "ip_hash"
  >("round_robin");
  const [activeClientId, setActiveClientId] = useState("client_1");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Server stats state
  const [servers, setServers] = useState<ServerState[]>([
    {
      id: "server_1",
      name: "Server 1 (High Spec)",
      weight: 3,
      requests: 0,
      activeConnections: 0,
      cpu: 10,
      isSlow: false,
    },
    {
      id: "server_2",
      name: "Server 2 (Mid Spec)",
      weight: 1,
      requests: 0,
      activeConnections: 0,
      cpu: 10,
      isSlow: false,
    },
    {
      id: "server_3",
      name: "Server 3 (Mid Spec)",
      weight: 1,
      requests: 0,
      activeConnections: 0,
      cpu: 10,
      isSlow: false,
    },
  ]);

  // Keep refs for callbacks to avoid closure traps
  const algorithmRef = useRef(algorithm);
  const serversRef = useRef(servers);
  const rrIndexRef = useRef(0);
  const wrrIndexRef = useRef(0);

  useEffect(() => {
    algorithmRef.current = algorithm;
  }, [algorithm]);

  useEffect(() => {
    serversRef.current = servers;
  }, [servers]);

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [{ timestamp, message, type }, ...prev.slice(0, 30)]);
  }, []);

  // Handle server request completion after processing delay
  const processRequestOnServer = (serverId: string, isSlow: boolean) => {
    // Increment requests immediately
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === serverId) {
          const nextCpu = Math.min(
            95,
            s.cpu + (isSlow ? 5 : Math.floor(Math.random() * 15) + 10),
          );
          return {
            ...s,
            requests: s.requests + 1,
            activeConnections: s.activeConnections + 1,
            cpu: nextCpu,
          };
        }
        return s;
      }),
    );

    // Simulate connection duration
    const delay = isSlow ? 4500 : 1500;
    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === serverId) {
            return {
              ...s,
              activeConnections: Math.max(0, s.activeConnections - 1),
              cpu: Math.max(10, s.cpu - (isSlow ? 5 : 15)),
            };
          }
          return s;
        }),
      );
      addLog(
        `Server ${serverId.replace("server_", "")} finished processing request. Connection closed.`,
        "server",
      );
    }, delay);
  };

  // Run the algorithm routing
  const getRouteTarget = (ip: string, clientIdx: number): string => {
    const currentAlgo = algorithmRef.current;
    const currentServers = serversRef.current;

    if (currentAlgo === "round_robin") {
      const targetIdx = rrIndexRef.current;
      rrIndexRef.current = (targetIdx + 1) % 3;
      addLog(
        `[LB] Round Robin chose index ${targetIdx} -> Server ${targetIdx + 1}`,
        "lb",
      );
      return `server_${targetIdx + 1}`;
    }

    if (currentAlgo === "weighted_round_robin") {
      // Sequence representing weights (3:1:1): S1, S1, S1, S2, S3
      const seq = ["server_1", "server_1", "server_1", "server_2", "server_3"];
      const targetIdx = wrrIndexRef.current;
      wrrIndexRef.current = (targetIdx + 1) % seq.length;
      addLog(
        `[LB] Weighted RR sequence index ${targetIdx} -> ${seq[targetIdx].replace("server_", "Server ")}`,
        "lb",
      );
      return seq[targetIdx];
    }

    if (currentAlgo === "least_connections") {
      // Find server with minimum connections
      const s1 = currentServers[0].activeConnections;
      const s2 = currentServers[1].activeConnections;
      const s3 = currentServers[2].activeConnections;

      addLog(
        `[LB] Scanning connections: S1: ${s1}, S2: ${s2}, S3: ${s3}`,
        "lb",
      );

      let minServer = "server_1";
      let minVal = s1;

      if (s2 < minVal) {
        minServer = "server_2";
        minVal = s2;
      }
      if (s3 < minVal) {
        minServer = "server_3";
        minVal = s3;
      }

      addLog(
        `[LB] Least Connections routed to ${minServer.replace("server_", "Server ")}`,
        "lb",
      );
      return minServer;
    }

    // IP Hash
    // 198.51.100.42 (User A) -> Server 1
    // 203.0.113.88 (User B) -> Server 2
    // 192.0.2.77 (User C) -> Server 3
    let serverNum = 1;
    if (ip === "198.51.100.42") serverNum = 1;
    else if (ip === "203.0.113.88") serverNum = 2;
    else serverNum = 3;

    addLog(
      `[LB] IP Hash: ${ip} hashes consistently to Server ${serverNum}`,
      "lb",
    );
    return `server_${serverNum}`;
  };

  // Spawn a packet
  const triggerRequest = (clientId: string) => {
    const client = CLIENTS.find((c) => c.id === clientId);
    if (!client) return;

    const packetId = Math.random().toString(36).substring(7);
    const clientIndex = CLIENTS.indexOf(client);

    // Initial dummy target. Calculated on reaching the LB.
    const newPacket: Packet = {
      id: packetId,
      clientIP: client.ip,
      clientIndex,
      targetServerId: "",
      step: "to-lb",
      progress: 0,
      color: client.color,
    };

    setPackets((prev) => [...prev, newPacket]);
    addLog(`[Client] Initiated request from IP: ${client.ip}`, "info");
  };

  // Trigger multiple requests in a burst
  const triggerBurst = () => {
    addLog("[Client] Initiated burst of 5 requests.", "info");
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        // Distribute burst across different clients for interesting IP Hash tests
        const randomClient = CLIENTS[i % CLIENTS.length].id;
        triggerRequest(randomClient);
      }, i * 150);
    }
  };

  // Toggle server latency
  const toggleServerLatency = (serverId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === serverId) {
          const nextSlow = !s.isSlow;
          addLog(
            `Server ${serverId.replace("server_", "")} latency set to ${nextSlow ? "SLOW (4.5s processing)" : "NORMAL (1.5s)"}.`,
            "info",
          );
          return { ...s, isSlow: nextSlow };
        }
        return s;
      }),
    );
  };

  const resetAllStats = () => {
    setPackets([]);
    setIsPaused(false);
    setLogs([]);
    setServers([
      {
        id: "server_1",
        name: "Server 1 (High Spec)",
        weight: 3,
        requests: 0,
        activeConnections: 0,
        cpu: 10,
        isSlow: false,
      },
      {
        id: "server_2",
        name: "Server 2 (Mid Spec)",
        weight: 1,
        requests: 0,
        activeConnections: 0,
        cpu: 10,
        isSlow: false,
      },
      {
        id: "server_3",
        name: "Server 3 (Mid Spec)",
        weight: 1,
        requests: 0,
        activeConnections: 0,
        cpu: 10,
        isSlow: false,
      },
    ]);
    rrIndexRef.current = 0;
    wrrIndexRef.current = 0;
    addLog("Algorithm simulation state reset.", "info");
  };

  // Packet animation loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setPackets((prev) => {
        const next: Packet[] = [];
        for (const p of prev) {
          const nextProgress = p.progress + 6; // Move speed
          if (p.step === "to-lb" && nextProgress >= 100) {
            // Reached LB: perform routing decision!
            const routedServerId = getRouteTarget(p.clientIP, p.clientIndex);
            next.push({
              ...p,
              step: "to-server",
              progress: 0,
              targetServerId: routedServerId,
            });
          } else if (p.step === "to-server" && nextProgress >= 100) {
            // Reached server: begin processing on server
            const targetServer = serversRef.current.find(
              (s) => s.id === p.targetServerId,
            );
            processRequestOnServer(
              p.targetServerId,
              targetServer?.isSlow || false,
            );
            // Packet completes its journey, don't re-push (removed)
          } else {
            next.push({ ...p, progress: nextProgress });
          }
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [addLog, isPaused]);

  const activeAlgoDesc = ALGO_DESCRIPTIONS[algorithm];

  return (
    <div className="w-full my-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/85 backdrop-blur-md shadow-2xl flex flex-col gap-6 select-none text-zinc-900 dark:text-zinc-100">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-4 gap-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Load Balancer Algorithms
          </h3>
          <p className="text-xs text-zinc-650 dark:text-zinc-400">
            Compare routing logic across Server pools in real-time. Trigger
            bursts to inspect pattern distribution.
          </p>
        </div>
        <div className="flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
              isPaused
                ? "bg-amber-650 text-white shadow-lg shadow-amber-900/15"
                : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            )}
          </button>

          {/* Reset Buttons */}
          <button
            type="button"
            onClick={resetAllStats}
            className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-850 dark:hover:border-zinc-750 dark:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Stats
          </button>
        </div>
      </div>

      {/* Algorithm Selector segmented tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-xl border  dark:border-zinc-850">
        {(
          [
            "round_robin",
            "weighted_round_robin",
            "least_connections",
            "ip_hash",
          ] as const
        ).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setAlgorithm(type);
              addLog(
                `Changed algorithm to ${type.toUpperCase().replace(/_/g, " ")}`,
                "info",
              );
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              algorithm === type
                ? "bg-white dark:bg-zinc-100 text-zinc-950 shadow-sm font-extrabold"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-850/40"
            }`}
          >
            {type === "round_robin"
              ? "Round Robin"
              : type === "weighted_round_robin"
                ? "Weighted RR (3:1:1)"
                : type === "least_connections"
                  ? "Least Connections"
                  : "IP Hash Affinity"}
          </button>
        ))}
      </div>

      {/* Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Visualization Canvas (60%) */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative h-[600px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-black/60 overflow-hidden">
            {/* SVG Wire Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-40">
              <title>Connection pathways</title>
              {/* Client 1 to LB */}
              <line
                x1="12%"
                y1="25%"
                x2="50%"
                y2="50%"
                className="stroke-zinc-300 dark:stroke-zinc-650"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Client 2 to LB */}
              <line
                x1="12%"
                y1="50%"
                x2="50%"
                y2="50%"
                className="stroke-zinc-300 dark:stroke-zinc-650"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Client 3 to LB */}
              <line
                x1="12%"
                y1="75%"
                x2="50%"
                y2="50%"
                className="stroke-zinc-300 dark:stroke-zinc-650"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* LB to Server 1 */}
              <line
                x1="50%"
                y1="50%"
                x2="88%"
                y2="25%"
                className="stroke-zinc-300 dark:stroke-zinc-650"
                strokeWidth="1.5"
              />
              {/* LB to Server 2 */}
              <line
                x1="50%"
                y1="50%"
                x2="88%"
                y2="50%"
                className="stroke-zinc-300 dark:stroke-zinc-650"
                strokeWidth="1.5"
              />
              {/* LB to Server 3 */}
              <line
                x1="50%"
                y1="50%"
                x2="88%"
                y2="75%"
                className="stroke-zinc-300 dark:stroke-zinc-650"
                strokeWidth="1.5"
              />
            </svg>

            {/* Render Clients */}
            {CLIENTS.map((client, idx) => {
              const yPos = idx === 0 ? "25%" : idx === 1 ? "50%" : "75%";
              const isActive = activeClientId === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => setActiveClientId(client.id)}
                  style={{ top: yPos }}
                  className={`absolute left-[12%] -translate-x-1/2 -translate-y-1/2 w-[120px] p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-200 shadow-md scale-105 text-zinc-950 dark:text-zinc-50"
                      : "bg-white dark:bg-zinc-950/90 border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 justify-center border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-1">
                    <User
                      className="w-3.5 h-3.5"
                      style={{ color: client.color }}
                    />
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                      {client.name}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-zinc-500">
                    {client.ip}
                  </div>
                </div>
              );
            })}

            {/* Render Load Balancer */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-xl text-center">
              <div className="flex items-center gap-1.5 justify-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-1.5">
                <span className="text-[10px] font-extrabold tracking-wider text-zinc-600 dark:text-zinc-400 uppercase">
                  Load Balancer
                </span>
              </div>
              <div className="text-[9px] bg-zinc-900 dark:bg-zinc-950 text-white font-bold px-1.5 py-0.5 rounded inline-block font-mono border border-zinc-800 dark:border-zinc-750">
                {algorithm.replace(/_/g, " ").toUpperCase()}
              </div>
            </div>

            {/* Render Servers */}
            {servers.map((s, idx) => {
              const yPos = idx === 0 ? "25%" : idx === 1 ? "50%" : "75%";
              return (
                <div
                  key={s.id}
                  style={{ top: yPos }}
                  className={`absolute right-[12%] translate-x-1/2 -translate-y-1/2 w-[140px] p-2.5 rounded-xl border bg-white dark:bg-zinc-950/90 shadow-lg text-left transition-colors border-zinc-200 dark:border-zinc-850 ${
                    s.isSlow ? "border-amber-900/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-1">
                    <span className="text-[10px] font-bold text-zinc-850 dark:text-zinc-300 flex items-center gap-1">
                      <Server className="w-3 h-3 text-purple-400" />S{idx + 1}
                    </span>
                    <span className="text-[7.5px] bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 px-1 rounded font-bold font-mono">
                      Wt: {s.weight}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[8.5px]">
                    <div className="flex justify-between text-zinc-550 dark:text-zinc-500">
                      <span>Conns:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                        {s.activeConnections}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-550 dark:text-zinc-500">
                      <span>Reqs:</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold font-mono">
                        {s.requests}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-550 dark:text-zinc-500">
                      <span>CPU:</span>
                      <span className="text-zinc-605 dark:text-zinc-400 font-mono">
                        {s.cpu}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Render Flowing Packets */}
            {packets.map((p) => {
              // Interpolate coordinates
              let x = 0;
              let y = 0;

              // Client coordinates
              const clientY =
                p.clientIndex === 0 ? 25 : p.clientIndex === 1 ? 50 : 75;
              const clientX = 12;

              // LB coordinates
              const lbX = 50;
              const lbY = 50;

              // Server coordinates
              const serverIdx = servers.findIndex(
                (s) => s.id === p.targetServerId,
              );
              const serverY = serverIdx === 0 ? 25 : serverIdx === 1 ? 50 : 75;
              const serverX = 88;

              if (p.step === "to-lb") {
                x = clientX + (lbX - clientX) * (p.progress / 100);
                y = clientY + (lbY - clientY) * (p.progress / 100);
              } else {
                x = lbX + (serverX - lbX) * (p.progress / 100);
                y = lbY + (serverY - lbY) * (p.progress / 100);
              }

              return (
                <div
                  key={p.id}
                  className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: p.color,
                    boxShadow: `0 0 10px ${p.color}`,
                    transition: "all 40ms linear",
                  }}
                />
              );
            })}
          </div>

          {/* Trigger Panel */}
          <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block">
                Simulate Traffic Load
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerRequest(activeClientId)}
                  className="flex-1 py-2 px-3 rounded-xl dark:text-white bg-purple-655 hover:bg-purple-600 hover:text-white text-sm text-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/20"
                >
                  Send Request
                </button>
                <button
                  type="button"
                  onClick={triggerBurst}
                  className="flex-1 py-2 px-3 rounded-xl  hover:bg-zinc-800 text-sm hover:text-white dark:text-white text-zinc-700 dark:bg-zinc-900 dark:border-zinc-850 dark:hover:bg-zinc-800 shadow-lg dark:hover:border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Send Burst (5x)
                </button>
              </div>
            </div>

            <div className="h-px sm:h-16 w-full sm:w-px dark:bg-zinc-700 bg-zinc-300" />

            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider  block">
                Simulate Latency Bottlenecks
              </span>
              <div className="flex gap-1.5">
                {servers.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleServerLatency(s.id)}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-bold transition-all border cursor-pointer ${
                      s.isSlow
                        ? "bg-amber-500/10 text-amber-550 dark:text-amber-400 border-amber-500/40"
                        : "bg-white dark:bg-zinc-955 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Slow S{idx + 1} {s.isSlow ? "ON" : "OFF"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Decisions & Logs Console */}
          <div className="h-[140px] bg-zinc-50 dark:bg-zinc-950 rounded-xl border  dark:border-zinc-850 flex flex-col overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b  dark:border-zinc-850">
              <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
                Decisions & Logs
              </span>
            </div>
            <div className="p-2.5 flex-1 overflow-y-auto space-y-1 font-mono text-[9px] select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-400 dark:text-zinc-650 text-center pt-8">
                  No events triggered. Send traffic to start logging decisions.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex gap-1.5 text-zinc-700 dark:text-zinc-400"
                  >
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {log.timestamp}
                    </span>
                    <span
                      className={`font-bold shrink-0 ${
                        log.type === "info"
                          ? "text-blue-550 dark:text-blue-400"
                          : log.type === "lb"
                            ? "text-purple-650 dark:text-purple-400"
                            : "text-emerald-550 dark:text-emerald-400"
                      }`}
                    >
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="truncate">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Educational Details & Live Code (40%) */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/30 border dark:border-zinc-800/80 p-5 rounded-xl">
          {/* Explanation Info */}
          <div className="space-y-2 pb-3 border-b  dark:border-zinc-800">
            <h4 className="text-sm font-bold text-purple-650 dark:text-purple-400">
              {activeAlgoDesc.title} Overview
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {activeAlgoDesc.desc}
            </p>
            <div className="grid grid-cols-1 gap-1 text-[10.5px] pt-1">
              <div>
                <span className="font-bold text-green-600 dark:text-green-400 block uppercase tracking-wider text-[8px] mb-0.5">
                  Pros
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {activeAlgoDesc.pros}
                </span>
              </div>
              <div className="mt-1">
                <span className="font-bold text-red-600 dark:text-red-400 block uppercase tracking-wider text-[8px] mb-0.5">
                  Cons
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {activeAlgoDesc.cons}
                </span>
              </div>
            </div>
          </div>

          {/* Code Snippet Window */}
          <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 rounded-xl border  dark:border-zinc-850 overflow-hidden min-h-[300px]">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b dark:border-zinc-850 flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
                Algorithm Logic
              </span>
              <span className="text-[8px] bg-purple-500/25 text-purple-650 dark:text-purple-300 px-1 rounded font-mono font-bold">
                TypeScript
              </span>
            </div>
            <div className="p-3 font-mono text-[9px] text-zinc-700 dark:text-zinc-400 overflow-x-auto whitespace-pre leading-relaxed select-text">
              {CODE_SNIPPETS[algorithm]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
