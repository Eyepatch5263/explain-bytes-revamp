"use client";

import {
  Activity,
  Compass,
  Database,
  Globe,
  HelpCircle,
  RotateCcw,
  Server,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type DnsDomain = "api.example.com" | "blog.example.com" | "mail.example.com";

interface LogEntry {
  timestamp: string;
  source: string;
  target: string;
  message: string;
}

const ZONE_FILES: Record<DnsDomain, string> = {
  "api.example.com": `; --- zone file for example.com ---
$TTL 3600
@      IN  SOA  ns1.example.com. admin.example.com. (
                2026062301 ; Serial
                7200       ; Refresh
                3600       ; Retry
                1209600    ; Expire
                3600 )     ; Negative Cache TTL

@      IN  NS   ns1.example.com.
@      IN  NS   ns2.example.com.

ns1    IN  A    162.254.206.1
ns2    IN  A    162.254.206.2

# Target A Record:
api    IN  A    93.184.216.34`,
  "blog.example.com": `; --- zone file for example.com ---
$TTL 3600
@      IN  SOA  ns1.example.com. admin.example.com. (
                2026062301 ; Serial
                7200       ; Refresh
                3600 )     ; TTL

@      IN  NS   ns1.example.com.

# Target Canonical Name (CNAME):
blog   IN  CNAME cdn.cloudflare.net.
cdn    IN  A     104.16.243.5`,
  "mail.example.com": `; --- zone file for example.com ---
$TTL 3600
@      IN  SOA  ns1.example.com. admin.example.com. (
                2026062301 ; Serial
                3600 )     ; TTL

@      IN  NS   ns1.example.com.

# Target Mail Exchange (MX) Record:
mail   IN  MX   10 mail.protonmail.ch.
mail   IN  A    185.70.42.12`,
};

const DNS_ACTOR_INFO = {
  client: {
    title: "User Browser",
    desc: "Starts the cycle. Checks its local browser DNS cache first. If not found, it queries the operating system resolver, which in turn queries the configured Recursive DNS Resolver.",
  },
  resolver: {
    title: "Recursive Resolver",
    desc: "The client's helper (e.g. 1.1.1.1 or 8.8.8.8). It does the legwork of querying the root, TLD, and authoritative name servers iteratively on behalf of the client, caching answers to speed up future lookups.",
  },
  root: {
    title: "Root Name Server (.)",
    desc: "The absolute base of the DNS hierarchy. It doesn't know the domain's IP, but it reads the domain suffix (.com) and directs the resolver to the appropriate Top-Level Domain (TLD) server.",
  },
  tld: {
    title: "TLD Server (.com)",
    desc: "Manages domain extensions (e.g., .com, .org, .net). It references the registry databases to point the resolver to the domain's specific Authoritative Name Server.",
  },
  authoritative: {
    title: "Authoritative Name Server",
    desc: "The ultimate source of truth. Hosted by domain registrars or DNS providers (like Cloudflare or Route 53). It holds the zone file containing the actual resource records (A, CNAME, MX, TXT) and returns the final answers.",
  },
};

export default function DnsSimulation() {
  const [domain, setDomain] = useState<DnsDomain>("api.example.com");
  const [useCache, setUseCache] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activePacket, setActivePacket] = useState<{
    source: "client" | "resolver" | "root" | "tld" | "auth" | "web";
    target: "client" | "resolver" | "root" | "tld" | "auth" | "web";
    progress: number;
    color: string;
  } | null>(null);

  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [isPaused, setIsPaused] = useState(false);

  // Cache stores
  const [resolverCache, setResolverCache] = useState<Record<string, string>>(
    {},
  );

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Add event log helper
  const addLog = useCallback(
    (source: string, target: string, message: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      setLogs((prev) => [
        { timestamp: timeStr, source, target, message },
        ...prev,
      ]);
    },
    [],
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Full Cold Cache Resolution Steps:
  const getColdSteps = useCallback(
    () => [
      {
        source: "client" as const,
        target: "resolver" as const,
        color: "#3b82f6", // Blue
        message: `Browser sends query: "Resolve ${domain}" to Recursive Resolver.`,
      },
      {
        source: "resolver" as const,
        target: "root" as const,
        color: "#a855f7", // Purple
        message: `Resolver queries Root Server: "Where is ${domain}?"`,
      },
      {
        source: "root" as const,
        target: "resolver" as const,
        color: "#eab308", // Yellow
        message:
          'Root Server replies: "I do not know, but here is the IP for the .com TLD Server."',
      },
      {
        source: "resolver" as const,
        target: "tld" as const,
        color: "#a855f7", // Purple
        message: `Resolver queries .com TLD Server: "Where is ${domain}?"`,
      },
      {
        source: "tld" as const,
        target: "resolver" as const,
        color: "#eab308", // Yellow
        message: `TLD Server replies: "Refer to Authoritative Name Server for example.com."`,
      },
      {
        source: "resolver" as const,
        target: "auth" as const,
        color: "#a855f7", // Purple
        message: `Resolver queries Authoritative Name Server: "What is the record for ${domain}?"`,
      },
      {
        source: "auth" as const,
        target: "resolver" as const,
        color: "#eab308", // Yellow
        message: `Authoritative Server answers with record: ${
          domain === "api.example.com"
            ? "A 93.184.216.34"
            : domain === "blog.example.com"
              ? "CNAME cdn.cloudflare.net"
              : "MX 10 mail.protonmail.ch"
        }.`,
      },
      {
        source: "resolver" as const,
        target: "client" as const,
        color: "#10b981", // Emerald
        message: `Resolver returns the IP / Record back to the Browser, caching the result.`,
      },
      {
        source: "client" as const,
        target: "web" as const,
        color: "#ec4899", // Pink
        message: `Browser establishes TCP connection to Web Server at 93.184.216.34 and requests page.`,
      },
    ],
    [domain],
  );

  // Warm Cache (Hit) Resolution Steps:
  const getWarmSteps = useCallback(
    () => [
      {
        source: "client" as const,
        target: "resolver" as const,
        color: "#3b82f6",
        message: `Browser queries: "Resolve ${domain}" to Recursive Resolver.`,
      },
      {
        source: "resolver" as const,
        target: "client" as const,
        color: "#10b981",
        message: `Resolver CACHE HIT! Instantly returns cached record: ${
          domain === "api.example.com"
            ? "A 93.184.216.34"
            : domain === "blog.example.com"
              ? "CNAME cdn.cloudflare.net"
              : "MX 10 mail.protonmail.ch"
        } (TTL Remaining: 2985s).`,
      },
      {
        source: "client" as const,
        target: "web" as const,
        color: "#ec4899",
        message: `Browser establishes connection to Web Server using cached address.`,
      },
    ],
    [domain],
  );

  const steps = useCache ? getWarmSteps() : getColdSteps();

  const resetSimulation = () => {
    setActivePacket(null);
    setIsProcessing(false);
    setIsPaused(false);
    setStepIndex(-1);
    setLogs([]);
    addLog(
      "system",
      "system",
      "Simulation sandbox reset. Ready for domain queries.",
    );
  };

  const startSimulation = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsPaused(false);
    setLogs([]);
    setStepIndex(0);

    const firstStep = steps[0];
    setActivePacket({
      source: firstStep.source,
      target: firstStep.target,
      progress: 0,
      color: firstStep.color,
    });
    addLog(firstStep.source, firstStep.target, firstStep.message);
  };

  // Packet animation loop
  useEffect(() => {
    if (!activePacket || stepIndex === -1 || isPaused) return;

    const timer = setTimeout(() => {
      if (activePacket.progress < 100) {
        // Increment progress along the wire based on chosen speed
        setActivePacket((prev) =>
          prev ? { ...prev, progress: prev.progress + 6 * speed } : null,
        );
      } else {
        // Move to the next step
        const nextIdx = stepIndex + 1;
        if (nextIdx < steps.length) {
          setStepIndex(nextIdx);
          const nextStep = steps[nextIdx];
          setActivePacket({
            source: nextStep.source,
            target: nextStep.target,
            progress: 0,
            color: nextStep.color,
          });
          addLog(nextStep.source, nextStep.target, nextStep.message);

          // Caching side-effect
          if (!useCache && nextIdx === 7) {
            setResolverCache((prev) => ({
              ...prev,
              [domain]:
                domain === "api.example.com" ? "93.184.216.34" : "CNAME / MX",
            }));
          }
        } else {
          // Simulation complete
          setActivePacket(null);
          setIsProcessing(false);
          setIsPaused(false);
          addLog("client", "web", "DNS resolution flow complete.");
        }
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [
    activePacket,
    stepIndex,
    steps,
    addLog,
    useCache,
    domain,
    speed,
    isPaused,
  ]);

  // Coordinate mapping for nodes (scaled relative to container size)
  const NODE_COORDINATES = {
    client: { left: "15%", top: "18%" },
    resolver: { left: "15%", top: "68%" },
    root: { left: "80%", top: "18%" },
    tld: { left: "80%", top: "50%" },
    auth: { left: "80%", top: "82%" },
    web: { left: "45%", top: "68%" },
  };

  return (
    <div className="w-full my-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/85 backdrop-blur-md shadow-2xl flex flex-col gap-6 select-none text-zinc-900 dark:text-zinc-100">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-4 gap-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Recursive vs. Iterative DNS Simulation
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Visualize the full path of recursive lookups traversing the DNS
            Root, TLD, and Authoritative servers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetSimulation}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Controller Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-50 dark:bg-zinc-900/30 dark:border-zinc-800/80 p-4 rounded-xl">
        {/* Domain Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider">
            Query Domain
          </span>
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-900">
            {(
              [
                "api.example.com",
                "blog.example.com",
                "mail.example.com",
              ] as DnsDomain[]
            ).map((d) => (
              <button
                key={d}
                type="button"
                disabled={isProcessing}
                onClick={() => setDomain(d)}
                className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  domain === d
                    ? "bg-white dark:bg-zinc-100 text-zinc-950 shadow-sm"
                    : "bg-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Cache Mode Toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider">
            Resolver Cache Tactic
          </span>
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg  dark:border-zinc-850">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setUseCache(false)}
              className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                !useCache
                  ? "bg-red-500/15 text-red-650 dark:text-red-400 border border-red-500/20"
                  : "bg-transparent text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Cold Cache (Query All)
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setUseCache(true)}
              className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                useCache
                  ? "bg-emerald-500/15 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-transparent text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Warm Cache (Hit)
            </button>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider">
            Simulation Speed
          </span>
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg  dark:border-zinc-850">
            {([0.5, 1, 2] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  speed === s
                    ? "bg-white dark:bg-zinc-100 text-zinc-950 shadow-sm"
                    : "bg-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Pause / Resume Control */}
        {isProcessing && (
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`py-2.5 px-4 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              isPaused
                ? "bg-amber-650 hover:bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-900/15"
                : "bg-white border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}

        {/* Resolve Trigger */}
        <button
          type="button"
          onClick={startSimulation}
          disabled={isProcessing}
          className="py-2.5 px-5 rounded-xl bg-zinc-950 dark:bg-white hover:bg-zinc-850 dark:hover:bg-zinc-100 disabled:bg-zinc-100 dark:disabled:bg-zinc-850 disabled:text-zinc-400 dark:disabled:text-zinc-650 font-semibold text-xs text-zinc-50 dark:text-zinc-950 transition-all flex items-center gap-2 shadow-lg shadow-purple-900/15 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? "Resolving DNS..." : "Trigger Query"}
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Visual Canvas & Logs */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Canvas */}
          <div className="relative h-[600px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-black/60 overflow-hidden">
            {/* Grid Mask */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

            {/* Static Connections (Wires) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <title>DNS Wire Connections</title>
              {/* Client - Resolver */}
              <line
                x1="15%"
                y1="18%"
                x2="15%"
                y2="68%"
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={2}
              />
              {/* Resolver - Root */}
              <line
                x1="15%"
                y1="68%"
                x2="80%"
                y2="18%"
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={2}
              />
              {/* Resolver - TLD */}
              <line
                x1="15%"
                y1="68%"
                x2="80%"
                y2="50%"
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={2}
              />
              {/* Resolver - Auth */}
              <line
                x1="15%"
                y1="68%"
                x2="80%"
                y2="82%"
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={2}
              />
              {/* Client - Web */}
              <line
                x1="15%"
                y1="18%"
                x2="45%"
                y2="68%"
                className="stroke-zinc-300 dark:stroke-zinc-800"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            </svg>

            {/* Active Packet Animation */}
            {activePacket && (
              <div
                className="absolute w-3.5 h-3.5 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-lg shadow-purple-500/10"
                style={{
                  left: `calc(${NODE_COORDINATES[activePacket.source].left} + (${NODE_COORDINATES[activePacket.target].left} - ${NODE_COORDINATES[activePacket.source].left}) * ${activePacket.progress} / 100)`,
                  top: `calc(${NODE_COORDINATES[activePacket.source].top} + (${NODE_COORDINATES[activePacket.target].top} - ${NODE_COORDINATES[activePacket.source].top}) * ${activePacket.progress} / 100)`,
                  backgroundColor: activePacket.color,
                  boxShadow: `0 0 12px ${activePacket.color}`,
                  transition: "left 40ms linear, top 40ms linear",
                }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
            )}

            {/* Render Actors */}
            {Object.entries(NODE_COORDINATES).map(([id, coord]) => {
              const info = DNS_ACTOR_INFO[
                id as keyof typeof DNS_ACTOR_INFO
              ] || { title: "Web Server", desc: "" };
              const isActive =
                activePacket?.source === id || activePacket?.target === id;

              return (
                <div
                  key={id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 transition-all z-10"
                  style={{ left: coord.left, top: coord.top }}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-zinc-950 border-2 transition-all shadow-md ${
                      isActive
                        ? "border-purple-400 shadow-purple-500/20 scale-105"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {id === "client" ? (
                      <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    ) : id === "resolver" ? (
                      <Activity className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    ) : id === "root" ? (
                      <Globe className="w-5 h-5 text-amber-500" />
                    ) : id === "tld" ? (
                      <Compass className="w-5 h-5 text-yellow-500" />
                    ) : id === "auth" ? (
                      <Database className="w-5 h-5 text-emerald-550 dark:text-emerald-400" />
                    ) : (
                      <Server className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                    )}
                  </div>
                  <div className="text-center bg-white/80 dark:bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-250 dark:border-zinc-900 shadow-sm">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                      {info.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decisions & Logs Console */}
          <div className="h-[140px] bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-300 dark:border-zinc-900 flex flex-col overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b border-zinc-300 dark:border-zinc-900">
              <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
                Resolution Events Logs
              </span>
            </div>
            <div className="p-2.5 flex-1 overflow-y-auto space-y-1 font-mono text-[9px] select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-400 dark:text-zinc-650 text-center pt-8">
                  No logs recorded. Trigger a query to watch resolution steps.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex gap-2 text-zinc-700 dark:text-zinc-400"
                  >
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {log.timestamp}
                    </span>
                    <span className="text-purple-650 dark:text-purple-400 font-extrabold uppercase tracking-wide text-[8px] border border-purple-200 dark:border-purple-900/30 px-1 rounded bg-purple-50 dark:bg-purple-950/15">
                      {log.source.toUpperCase()} ➔ {log.target.toUpperCase()}
                    </span>
                    <span className="truncate">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Zone File & Concept Details */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-900 dark:border-zinc-800/80 p-5 rounded-xl">
          {/* Zone File Preview */}
          <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-900 overflow-hidden min-h-[220px]">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
                Active Zone File (BIND)
              </span>
              <span className="text-[8px] bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                truth
              </span>
            </div>
            <div className="p-3 font-mono text-[9px] text-zinc-700 dark:text-zinc-400 overflow-x-auto whitespace-pre leading-relaxed select-text flex-1">
              {ZONE_FILES[domain]}
            </div>
          </div>

          {/* Actor Info Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                DNS Resolution Rules
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Standard resolutions perform **Iterative Queries** (Resolver asks
              servers, gets a referral, queries the next server). The link from
              Client to Resolver is a **Recursive Query** (client asks once,
              waits for the final answer).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
