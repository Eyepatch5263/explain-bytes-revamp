"use client";

import {
  Background,
  BaseEdge,
  type Edge,
  type EdgeProps,
  getBezierPath,
  Handle,
  type Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Cpu,
  Database,
  Network,
  Pause,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Packet {
  id: string;
  type: "api" | "static";
  phase:
    | "client-dns"
    | "dns-l4"
    | "l4-l7"
    | "l7-app"
    | "app-l7"
    | "l7-l4"
    | "l4-dns"
    | "dns-client"
    | "app-client-dsr";
  progress: number;
  l7Id: "l7_api" | "l7_static";
  appId: "app_static" | "app_api1" | "app_api2";
  color: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
  tier: "Client" | "DNS" | "L4" | "L7" | "App";
}

interface L4NodeProps {
  data: {
    connections: number;
  };
}

interface L7NodeProps {
  data: {
    type: string;
  };
}

// Custom Node Components
const ClientNode = () => (
  <div className="relative w-[140px] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white shadow-xl backdrop-blur-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
    <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[11px] font-bold tracking-wider text-zinc-550 dark:text-zinc-400 uppercase">
        User Agent
      </span>
    </div>
    <div className="space-y-1">
      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
        Web Browser
      </div>
      <div className="text-[9px] font-mono text-zinc-500">
        IP: 198.51.100.42
      </div>
    </div>
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    <Handle
      type="target"
      position={Position.Right}
      id="client-target"
      style={{ opacity: 0 }}
    />
    <Handle
      type="target"
      position={Position.Bottom}
      id="client-dsr-target"
      style={{ opacity: 0 }}
    />
  </div>
);

const DnsNode = () => (
  <div className="relative w-[140px] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white shadow-xl backdrop-blur-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
    <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-1.5">
      <Network className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
      <span className="text-[11px] font-bold tracking-wider text-zinc-550 dark:text-zinc-400 uppercase">
        DNS Tier
      </span>
    </div>
    <div className="space-y-1">
      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
        Anycast Routing
      </div>
      <div className="text-[9px] font-mono text-zinc-500">
        Resolves: 192.0.2.1
      </div>
    </div>
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

const L4Node = ({ data }: L4NodeProps) => (
  <div className="relative w-[140px] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white shadow-xl backdrop-blur-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-1.5">
      <div className="flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-amber-505 dark:text-amber-500 animate-pulse" />
        <span className="text-[11px] font-bold tracking-wider text-zinc-550 dark:text-zinc-400 uppercase">
          L4 Tier
        </span>
      </div>
      <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1 rounded font-mono">
        NLB/LVS
      </span>
    </div>
    <div className="space-y-1 text-left">
      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
        IP/Port Level
      </div>
      <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
        <span>Conns:</span>
        <span className="text-amber-600 dark:text-amber-500 font-bold">
          {data.connections}
        </span>
      </div>
    </div>
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

const L7Node = ({ data }: L7NodeProps) => (
  <div className="relative w-[140px] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white shadow-xl backdrop-blur-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-1.5">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-550 dark:text-emerald-400" />
        <span className="text-[11px] font-bold tracking-wider text-zinc-550 dark:text-zinc-400 uppercase">
          L7 Tier
        </span>
      </div>
      <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-1 rounded font-mono">
        NGINX
      </span>
    </div>
    <div className="space-y-1 text-left">
      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
        {data.type} Proxy
      </div>
      <div className="text-[9px] text-zinc-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>SSL Terminated</span>
      </div>
    </div>
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

interface AppNodeProps {
  data: {
    label: string;
    cpu: number;
    requests: number;
  };
}

const AppNode = ({ data }: AppNodeProps) => (
  <div className="relative w-[140px] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white shadow-xl backdrop-blur-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-1.5">
      <div className="flex items-center gap-1.5">
        <Server className="w-3.5 h-3.5 text-purple-550 dark:text-purple-400" />
        <span className="text-[11px] font-bold tracking-wider text-zinc-550 dark:text-zinc-400 uppercase">
          App Tier
        </span>
      </div>
    </div>
    <div className="space-y-1 text-left">
      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
        {data.label}
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[9px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" /> CPU:
          </span>
          <span
            className={`font-mono font-bold ${data.cpu > 70 ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}
          >
            {data.cpu}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Database className="w-2.5 h-2.5" /> Requests:
          </span>
          <span className="font-mono text-zinc-700 dark:text-zinc-300">
            {data.requests}
          </span>
        </div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle
      type="source"
      position={Position.Left}
      id="app-source"
      style={{ opacity: 0 }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="app-dsr-source"
      style={{ opacity: 0 }}
    />
  </div>
);

const nodeTypes = {
  clientNode: ClientNode,
  dnsNode: DnsNode,
  l4Node: L4Node,
  l7Node: L7Node,
  appNode: AppNode,
};

// Custom edge containing dynamic packet overlays
interface EdgePacket {
  id: string;
  type: "api" | "static";
  progress: number;
  color: string;
  isReverse?: boolean;
}

const AnimatedPacketEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const packets = (data?.packets || []) as EdgePacket[];

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      {packets.map((packet) => (
        <path
          key={packet.id}
          d={edgePath}
          fill="none"
          stroke={packet.color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="1 100"
          strokeDashoffset={
            packet.isReverse
              ? `${packet.progress * 100}%`
              : `${100 - packet.progress * 100}%`
          }
          className="transition-all duration-75"
          style={{ pointerEvents: "none" }}
        />
      ))}
    </>
  );
};

// Specialized curved dashed return line for DSR
const CurvedDsrEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps) => {
  // Manual quadratic bezier control point calculation to curve DOWN
  const controlX = (sourceX + targetX) / 2;
  const controlY = Math.max(sourceY, targetY) + 90;
  const edgePath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;

  const packets = (data?.packets || []) as EdgePacket[];

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="#6b7280"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        style={{ ...style, transition: "opacity 300ms ease" }}
      />
      {packets.map((packet) => (
        <path
          key={packet.id}
          d={edgePath}
          fill="none"
          stroke={packet.color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="1 100"
          strokeDashoffset={`${packet.progress * 100}%`}
          className="transition-all duration-75"
          style={{ pointerEvents: "none" }}
        />
      ))}
    </>
  );
};

const edgeTypes = {
  animatedPacketEdge: AnimatedPacketEdge,
  curvedDsrEdge: CurvedDsrEdge,
};

// Architectural explanations
const TIER_INFO: Record<
  string,
  {
    name: string;
    role: string;
    concepts: string[];
    examples: string[];
    realWorld: string;
  }
> = {
  client: {
    name: "User Agent / Client",
    role: "The starting point of the connection lifecycle. Initiates HTTP/HTTPS web requests and completes TCP handshakes.",
    concepts: [
      "TCP Handshake (SYN -> SYN-ACK -> ACK)",
      "DNS Resolution Lookup",
      "SSL/TLS Session Negotiation",
    ],
    examples: ["Google Chrome", "Mozilla Firefox", "Safari", "curl"],
    realWorld: "The endpoint that initiates connections to explainbytes.tech.",
  },
  dns: {
    name: "DNS Tier (Anycast IP)",
    role: "Translates human-readable hostnames into server IP addresses using a global distributed registry.",
    concepts: [
      "Anycast Routing (closest node)",
      "TTL (Time to Live) Caching",
      "GeoDNS Redirection",
    ],
    examples: [
      "Cloudflare DNS (1.1.1.1)",
      "Google Public DNS (8.8.8.8)",
      "Route 53",
    ],
    realWorld: "Maps explainbytes.tech to the nearest data center IP address.",
  },
  l4: {
    name: "Layer 4 Load Balancer",
    role: "Directs raw TCP/UDP streams at the transport layer without decrypting or parsing the application payload.",
    concepts: [
      "5-Tuple Hashing (src IP, src port, dst IP, dst port, protocol)",
      "TCP State Tracking",
      "NAT / IP Tunneling",
    ],
    examples: [
      "AWS Network Load Balancer (NLB)",
      "Linux Virtual Server (LVS)",
      "IPVS",
    ],
    realWorld: "Routes raw connections at millions of packets per second.",
  },
  l7_api: {
    name: "Layer 7 API Proxy / Gateway",
    role: "Inspects application headers, URLs, cookies, and payloads to route requests, terminate SSL, and enforce security policies.",
    concepts: [
      "SSL/TLS Decryption (Termination)",
      "HTTP Header-based Routing",
      "Sticky Session Management",
    ],
    examples: ["NGINX Plus", "Envoy Proxy", "HAProxy", "AWS ALB"],
    realWorld:
      "Decides path routing by inspecting incoming HTTP headers and paths.",
  },
  l7_static: {
    name: "Layer 7 CDN / Static Proxy",
    role: "Caches static assets closer to the user to reduce server round-trips and maximize performance.",
    concepts: [
      "Edge Node Caching",
      "Brotli / Gzip Compression",
      "Cache-Control Policy Evaluation",
    ],
    examples: ["Fastly", "Cloudflare CDN", "Akamai CDN", "Varnish Cache"],
    realWorld: "Returns images, stylesheets, and scripts directly from cache.",
  },
  app_static: {
    name: "Static Content Origin Server",
    role: "Serves static files (HTML, CSS, JS, images) from standard block storage or low-cost static web server pools.",
    concepts: [
      "Static File Delivery",
      "In-memory Asset Caching",
      "Index File Mapping",
    ],
    examples: ["Apache HTTP Server", "NGINX (static config)", "AWS S3 Bucket"],
    realWorld: "Retrieves raw assets to pass back through the CDN to the user.",
  },
  app_api1: {
    name: "API Application Instance 1",
    role: "Core dynamic compute node executing logical application instructions, database queries, and custom processing.",
    concepts: [
      "SSL Offloading",
      "Connection Pooling",
      "Horizontal Auto-scaling",
    ],
    examples: [
      "Node.js (Express)",
      "Go (Fiber/Gin)",
      "Python (FastAPI)",
      "JVM",
    ],
    realWorld:
      "Processes database operations and dynamic application computations.",
  },
  app_api2: {
    name: "API Application Instance 2",
    role: "Second application instance, load balanced by the Layer 7 Proxy using round-robin or least-connections strategy.",
    concepts: [
      "Horizontal Scaling",
      "Least-Connections Routing",
      "Shared Caching Tiers",
    ],
    examples: [
      "Node.js (Express)",
      "Go (Fiber/Gin)",
      "Python (FastAPI)",
      "JVM",
    ],
    realWorld: "Acts as a replica instance to distribute API traffic load.",
  },
};

export default function NetworkSimulation() {
  const [activePackets, setActivePackets] = useState<Packet[]>([]);
  const activePacketsRef = useRef(activePackets);
  useEffect(() => {
    activePacketsRef.current = activePackets;
  }, [activePackets]);
  const [dsrEnabled, setDsrEnabled] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(0.015); // Progress step size
  const [isPlaying, setIsPlaying] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connections, setConnections] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("l4");
  const [activeTab, setActiveTab] = useState<"walkthrough" | "dsr" | "console">(
    "walkthrough",
  );

  // Real-time Node Statistics
  const [appStats, setAppStats] = useState({
    static: { cpu: 12, requests: 0 },
    api1: { cpu: 18, requests: 0 },
    api2: { cpu: 15, requests: 0 },
  });

  const addLog = useCallback((message: string, tier: LogEntry["tier"]) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [{ timestamp, message, tier }, ...prev.slice(0, 49)]);
  }, []);

  // Set up React Flow elements
  const initialNodes: Node[] = [
    { id: "client", type: "clientNode", position: { x: 20, y: 140 }, data: {} },
    { id: "dns", type: "dnsNode", position: { x: 200, y: 140 }, data: {} },
    {
      id: "l4",
      type: "l4Node",
      position: { x: 380, y: 140 },
      data: { connections },
    },

    {
      id: "l7_api",
      type: "l7Node",
      position: { x: 560, y: 60 },
      data: { type: "API / Path" },
    },
    {
      id: "l7_static",
      type: "l7Node",
      position: { x: 560, y: 220 },
      data: { type: "Static CDN" },
    },

    {
      id: "app_static",
      type: "appNode",
      position: { x: 760, y: 20 },
      data: { label: "Static Server", ...appStats.static },
    },
    {
      id: "app_api1",
      type: "appNode",
      position: { x: 760, y: 140 },
      data: { label: "API instance 1", ...appStats.api1 },
    },
    {
      id: "app_api2",
      type: "appNode",
      position: { x: 760, y: 260 },
      data: { label: "API instance 2", ...appStats.api2 },
    },
  ];

  const initialEdges: Edge[] = [
    // Client to DNS
    {
      id: "e-client-dns",
      source: "client",
      target: "dns",
      type: "animatedPacketEdge",
    },
    // DNS to L4
    { id: "e-dns-l4", source: "dns", target: "l4", type: "animatedPacketEdge" },
    // L4 to L7 Layers
    {
      id: "e-l4-l7api",
      source: "l4",
      target: "l7_api",
      type: "animatedPacketEdge",
    },
    {
      id: "e-l4-l7static",
      source: "l4",
      target: "l7_static",
      type: "animatedPacketEdge",
    },
    // L7 Static to Static App Server
    {
      id: "e-l7static-app",
      source: "l7_static",
      target: "app_static",
      type: "animatedPacketEdge",
    },
    // L7 API to API App Servers
    {
      id: "e-l7api-app1",
      source: "l7_api",
      target: "app_api1",
      type: "animatedPacketEdge",
    },
    {
      id: "e-l7api-app2",
      source: "l7_api",
      target: "app_api2",
      type: "animatedPacketEdge",
    },
    // DSR Return paths (dashed, curved)
    {
      id: "e-appstatic-client-dsr",
      source: "app_static",
      sourceHandle: "app-dsr-source",
      target: "client",
      targetHandle: "client-dsr-target",
      type: "curvedDsrEdge",
      style: { opacity: 0 },
    },
    {
      id: "e-appapi1-client-dsr",
      source: "app_api1",
      sourceHandle: "app-dsr-source",
      target: "client",
      targetHandle: "client-dsr-target",
      type: "curvedDsrEdge",
      style: { opacity: 0 },
    },
    {
      id: "e-appapi2-client-dsr",
      source: "app_api2",
      sourceHandle: "app-dsr-source",
      target: "client",
      targetHandle: "client-dsr-target",
      type: "curvedDsrEdge",
      style: { opacity: 0 },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync connections and stats to React Flow nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === "l4") {
          return { ...node, data: { connections } };
        }
        if (node.id === "app_static") {
          return {
            ...node,
            data: { label: "Static Server", ...appStats.static },
          };
        }
        if (node.id === "app_api1") {
          return {
            ...node,
            data: { label: "API instance 1", ...appStats.api1 },
          };
        }
        if (node.id === "app_api2") {
          return {
            ...node,
            data: { label: "API instance 2", ...appStats.api2 },
          };
        }
        return node;
      }),
    );
  }, [connections, appStats, setNodes]);

  // Sync DSR edge visibility based on state
  useEffect(() => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        if (edge.id.endsWith("-dsr")) {
          return {
            ...edge,
            style: {
              ...edge.style,
              opacity: dsrEnabled ? 0.45 : 0,
            },
          };
        }
        return edge;
      }),
    );
  }, [dsrEnabled, setEdges]);

  // Map active packet coordinates back to React Flow edges for overlay rendering
  useEffect(() => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const matchingPackets = activePackets.filter((p) => {
          if (edge.id === "e-client-dns") {
            return p.phase === "client-dns" || p.phase === "dns-client";
          }
          if (edge.id === "e-dns-l4") {
            return p.phase === "dns-l4" || p.phase === "l4-dns";
          }
          if (edge.id === "e-l4-l7api") {
            return (
              p.l7Id === "l7_api" &&
              (p.phase === "l4-l7" || p.phase === "l7-l4")
            );
          }
          if (edge.id === "e-l4-l7static") {
            return (
              p.l7Id === "l7_static" &&
              (p.phase === "l4-l7" || p.phase === "l7-l4")
            );
          }
          if (edge.id === "e-l7static-app") {
            return (
              p.appId === "app_static" &&
              (p.phase === "l7-app" || p.phase === "app-l7")
            );
          }
          if (edge.id === "e-l7api-app1") {
            return (
              p.appId === "app_api1" &&
              (p.phase === "l7-app" || p.phase === "app-l7")
            );
          }
          if (edge.id === "e-l7api-app2") {
            return (
              p.appId === "app_api2" &&
              (p.phase === "l7-app" || p.phase === "app-l7")
            );
          }
          if (edge.id === "e-appstatic-client-dsr") {
            return p.appId === "app_static" && p.phase === "app-client-dsr";
          }
          if (edge.id === "e-appapi1-client-dsr") {
            return p.appId === "app_api1" && p.phase === "app-client-dsr";
          }
          if (edge.id === "e-appapi2-client-dsr") {
            return p.appId === "app_api2" && p.phase === "app-client-dsr";
          }
          return false;
        });

        const edgePackets = matchingPackets.map((p) => {
          const isReverse =
            p.phase === "dns-client" ||
            p.phase === "l4-dns" ||
            p.phase === "l7-l4" ||
            p.phase === "app-l7";
          return {
            id: p.id,
            type: p.type,
            progress: p.progress,
            color: p.color,
            isReverse,
          };
        });

        const edgeData = ("data" in edge && edge.data ? edge.data : {}) as {
          packets?: EdgePacket[];
        };
        return {
          ...edge,
          data: {
            ...edgeData,
            packets: edgePackets,
          },
        };
      }),
    );
  }, [activePackets, setEdges]);

  const sendRequest = (type: "api" | "static") => {
    const packetId = Math.random().toString(36).substring(7);

    // Choose appropriate targets
    const l7Id = type === "static" ? "l7_static" : "l7_api";
    let appId: Packet["appId"] = "app_static";

    if (type === "api") {
      appId =
        appStats.api1.requests <= appStats.api2.requests
          ? "app_api1"
          : "app_api2";
    }

    const newPacket: Packet = {
      id: packetId,
      type,
      phase: "client-dns",
      progress: 0,
      l7Id,
      appId,
      color: type === "static" ? "#3b82f6" : "#a855f7",
    };

    setActivePackets((prev) => [...prev, newPacket]);
    setConnections((prev) => prev + 1);
    addLog(
      `New request initialized: GET ${type === "static" ? "/static/logo.png" : "/api/v1/payments"}`,
      "Client",
    );
  };

  const handlePhaseChange = useCallback(
    (packet: Packet, nextPhase: Packet["phase"]) => {
      if (nextPhase === "dns-l4") {
        addLog(
          "DNS Anycast: Resolved domain. Routing packets to L4 Load Balancer VIP.",
          "DNS",
        );
      } else if (nextPhase === "l4-l7") {
        addLog(
          `Layer 4 LB: Inspected TCP header 5-tuple. Forwarding raw connection packets to ${packet.l7Id === "l7_static" ? "Static Proxy" : "API Proxy"}.`,
          "L4",
        );
      } else if (nextPhase === "l7-app") {
        addLog(
          `Layer 7 LB: Decrypted SSL/TLS. Inspected URL Path. Content-aware route to ${packet.appId}.`,
          "L7",
        );
      } else if (nextPhase === "app-l7") {
        const appKey =
          packet.appId === "app_static"
            ? "static"
            : packet.appId === "app_api1"
              ? "api1"
              : "api2";
        setAppStats((prev) => {
          const target = prev[appKey];
          const nextReqs = target.requests + 1;
          const nextCpu = Math.min(
            95,
            Math.max(
              10,
              Math.floor(Math.random() * 40) + (appKey === "static" ? 10 : 35),
            ),
          );
          return {
            ...prev,
            [appKey]: { cpu: nextCpu, requests: nextReqs },
          };
        });
        addLog(
          `App Server (${packet.appId}): Request processed successfully. Dispatching response via Load Balancers.`,
          "App",
        );
      } else if (nextPhase === "app-client-dsr") {
        const appKey =
          packet.appId === "app_static"
            ? "static"
            : packet.appId === "app_api1"
              ? "api1"
              : "api2";
        setAppStats((prev) => {
          const target = prev[appKey];
          const nextReqs = target.requests + 1;
          const nextCpu = Math.min(
            95,
            Math.max(
              10,
              Math.floor(Math.random() * 40) + (appKey === "static" ? 10 : 35),
            ),
          );
          return {
            ...prev,
            [appKey]: { cpu: nextCpu, requests: nextReqs },
          };
        });
        addLog(
          `App Server (${packet.appId}): Request processed. DSR Active: Dispatching response directly back to Client.`,
          "App",
        );
      }
    },
    [addLog],
  );

  // Main Packet Progress Loop
  useEffect(() => {
    if (!isPlaying || activePackets.length === 0) return;

    const interval = setInterval(() => {
      const currentPackets = activePacketsRef.current;
      const next: Packet[] = [];

      for (const p of currentPackets) {
        const nextProgress = p.progress + simulationSpeed;
        if (nextProgress >= 1) {
          let nextPhase: Packet["phase"] | null = null;

          if (p.phase === "client-dns") nextPhase = "dns-l4";
          else if (p.phase === "dns-l4") nextPhase = "l4-l7";
          else if (p.phase === "l4-l7") nextPhase = "l7-app";
          else if (p.phase === "l7-app") {
            nextPhase = dsrEnabled ? "app-client-dsr" : "app-l7";
          } else if (p.phase === "app-l7") nextPhase = "l7-l4";
          else if (p.phase === "l7-l4") nextPhase = "l4-dns";
          else if (p.phase === "l4-dns") nextPhase = "dns-client";

          if (nextPhase) {
            handlePhaseChange(p, nextPhase);
            next.push({ ...p, phase: nextPhase, progress: 0 });
          } else {
            setConnections((c) => Math.max(0, c - 1));
            addLog(
              "Response successfully arrived. Connection closed.",
              "Client",
            );
          }
        } else {
          next.push({ ...p, progress: nextProgress });
        }
      }

      setActivePackets(next);
    }, 30);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    activePackets.length,
    simulationSpeed,
    dsrEnabled,
    handlePhaseChange,
    addLog,
  ]);

  const resetSimulation = () => {
    setActivePackets([]);
    setLogs([]);
    setConnections(0);
    setAppStats({
      static: { cpu: 12, requests: 0 },
      api1: { cpu: 18, requests: 0 },
      api2: { cpu: 15, requests: 0 },
    });
    addLog("Simulation state reset.", "Client");
  };

  const selectedTier = TIER_INFO[selectedNodeId] || TIER_INFO.l4;

  return (
    <div className="w-full my-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/85 backdrop-blur-md shadow-2xl flex flex-col gap-6 select-none text-zinc-900 dark:text-zinc-100">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-4 gap-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Multi-Tier Load Balancing Sandbox
          </h3>
          <p className="text-xs text-zinc-650 dark:text-zinc-400">
            Visualize and inspect packet flow across infrastructure layers.
            Click components to inspect their system design details.
          </p>
        </div>

        {/* Top Control Panel */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-750 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-850 dark:hover:border-zinc-700 dark:text-zinc-205 transition-all flex items-center justify-center cursor-pointer"
            title={isPlaying ? "Pause Simulation" : "Start Simulation"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={resetSimulation}
            className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-750 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-850 dark:hover:border-zinc-700 dark:text-zinc-205 transition-all flex items-center justify-center cursor-pointer"
            title="Reset Stats & Packets"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-850" />

          {/* DSR Toggle Switch */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-1.5">
            <label
              className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              htmlFor="dsr-toggle"
            >
              Direct Server Return (DSR)
            </label>
            <input
              id="dsr-toggle"
              type="checkbox"
              checked={dsrEnabled}
              onChange={() => {
                setDsrEnabled(!dsrEnabled);
                addLog(
                  `DSR toggled ${!dsrEnabled ? "ON" : "OFF"}. Response packets will route accordingly.`,
                  "Client",
                );
              }}
              className="w-3.5 h-3.5 text-purple-650 bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 rounded focus:ring-purple-500 focus:ring-offset-zinc-900 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        <div className="relative h-[600px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-black/60 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            nodesConnectable={false}
            nodesDraggable={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnDrag={false}
            elementsSelectable={true}
            onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
          >
            <Background color="#a1a1aa" gap={16} size={1} />
          </ReactFlow>
        </div>

        {/* Controller Triggers */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl">
          <div className="flex-1 w-full flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block">
              Trigger HTTP Requests
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => sendRequest("static")}
                className="py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-xs text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                <Server className="w-4 h-4" />
                Get /static/logo.png
              </button>
              <button
                type="button"
                onClick={() => sendRequest("api")}
                className="py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-600 font-semibold text-xs text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                POST /api/v1/payments
              </button>
            </div>
          </div>

          <div className="h-px sm:h-12 w-full sm:w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-start gap-2">
            <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block">
              Simulation Speed
            </span>
            <div className="flex items-center gap-1.5">
              {[0.008, 0.015, 0.03].map((val, idx) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setSimulationSpeed(val)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border cursor-pointer ${
                    simulationSpeed === val
                      ? "bg-zinc-950 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 border-zinc-955 dark:border-zinc-100 font-bold"
                      : "bg-white dark:bg-zinc-955 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-202 dark:border-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-250"
                  }`}
                >
                  {idx === 0 ? "0.5x" : idx === 1 ? "1.0x" : "2.0x"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Infrastructure Inspector */}
        <div className="w-full flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <span className="text-[11px] font-bold tracking-wider text-purple-650 dark:text-purple-400 uppercase flex items-center gap-1">
              Infrastructure Inspector
            </span>
          </div>

          {/* Tab Selector inside Inspector */}
          <div className="flex bg-zinc-100 dark:bg-zinc-955 dark:bg-zinc-950/60 p-1 rounded-lg dark:border-zinc-850">
            {(["walkthrough", "dsr", "console"] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-white dark:bg-zinc-100 text-zinc-955 dark:text-zinc-950  dark:border-zinc-100 font-bold shadow-sm"
                    : "bg-transparent text-zinc-550 dark:text-zinc-400 border-transparent hover:text-zinc-800"
                }`}
              >
                {tab === "walkthrough"
                  ? "Walkthrough"
                  : tab === "dsr"
                    ? "DSR Stats"
                    : "Live Logs"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-[160px] max-h-[300px] pr-1">
            {activeTab === "walkthrough" && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-950/40 p-3 rounded-lg">
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mb-1 flex items-center justify-between">
                    <span>{selectedTier.name}</span>
                    <span className="text-[9px] text-purple-650 dark:text-purple-400 uppercase tracking-widest">
                      Active
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-400 leading-relaxed">
                    {selectedTier.role}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider">
                    Core Concepts
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTier.concepts.map((concept) => (
                      <li
                        key={concept}
                        className="text-[10px] text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-purple-500 font-bold shrink-0">
                          •
                        </span>
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider">
                    Real-World Implementation
                  </h4>
                  <p className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                    {selectedTier.realWorld}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedTier.examples.map((ex) => (
                      <span
                        key={ex}
                        className="text-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dsr" && (
              <div className="space-y-4 text-xs">
                <div className="bg-white dark:bg-zinc-950/40 p-3 rounded-lg border  dark:border-zinc-850">
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mb-1">
                    Understanding DSR (Direct Server Return)
                  </h4>
                  <p className="text-[10.5px] text-zinc-650 dark:text-zinc-400 leading-relaxed">
                    In standard load balancing, the response packets go back
                    through the L4/L7 load balancers, causing outbound egress
                    network interface saturation.
                    <br />
                    <strong>DSR solves this:</strong> servers bypass the load
                    balancer and send responses directly back to the client.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider">
                    Network Latency Benchmark (DSR vs. Normal)
                  </h4>
                  <div className="space-y-3 bg-white dark:bg-zinc-950/60 p-3 rounded-lg border dark:border-zinc-850">
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Standard Egress path latency:</span>
                        <span className="font-bold font-mono text-red-500 dark:text-red-400">
                          ~125ms (Egress Saturated)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full w-[90%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>DSR Egress path latency:</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ~18ms (Direct Gateway)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[15%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "console" && (
              <div className="space-y-2 font-mono text-[9px] select-text">
                {logs.length === 0 ? (
                  <div className="text-zinc-400 dark:text-zinc-650 text-center pt-8">
                    No logs recorded. Trigger packets to populate.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="flex gap-2 text-zinc-700 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-900 pb-1.5"
                    >
                      <span className="text-zinc-400 dark:text-zinc-600">
                        {log.timestamp}
                      </span>
                      <span
                        className={`font-bold shrink-0 ${
                          log.tier === "Client"
                            ? "text-blue-550 dark:text-blue-400"
                            : log.tier === "DNS"
                              ? "text-emerald-555 dark:text-emerald-400"
                              : log.tier === "L4"
                                ? "text-amber-550 dark:text-amber-500"
                                : log.tier === "L7"
                                  ? "text-purple-650 dark:text-purple-400"
                                  : "text-red-500"
                        }`}
                      >
                        [{log.tier}]
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
