"use client";

import {
  Activity,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type SslStrategy = "termination" | "passthrough" | "re_encryption";

interface LogEntry {
  timestamp: string;
  type: "client" | "lb" | "server" | "network";
  message: string;
}

const STRATEGY_INFO = {
  termination: {
    title: "SSL Termination",
    desc: "The Load Balancer terminates the external HTTPS connection, decrypts the request, and forwards it to the App Server as plain unencrypted HTTP.",
    pros: "Offloads heavy decryption math from App Servers, allows L7 cookie/path routing, and centralizes certificate updates.",
    cons: "Internal network traffic is plaintext, which requires highly secure VPC firewalls and security groups to prevent eavesdropping.",
    lbCpu: "Medium-High (Performs TLS handshake & decryption)",
    serverCpu: "Very Low (Receives plaintext HTTP)",
    security: "Partially Encrypted (Plaintext Internally)",
  },
  passthrough: {
    title: "SSL Passthrough",
    desc: "The Load Balancer does not decrypt incoming traffic. It acts as an L4 router, passing raw encrypted TCP packets straight to the App Server.",
    pros: "Maximum security with end-to-end encryption. The Load Balancer never sees the request content, preventing internal data leaks.",
    cons: "No L7 smart routing possible (cannot inspect paths, headers, or cookies), and App Servers consume high CPU processing TLS.",
    lbCpu: "Very Low (Pure packet forwarding)",
    serverCpu: "Medium-High (Performs TLS handshake & decryption)",
    security: "Fully Encrypted (End-to-End)",
  },
  re_encryption: {
    title: "TLS Re-encryption",
    desc: "The Load Balancer decrypts the client's HTTPS request to inspect/route it, then re-encrypts the request into a new HTTPS tunnel to the App Server.",
    pros: "Combines L7 content-aware routing with secure, encrypted internal network traffic.",
    cons: "Highest overall CPU usage because TLS encryption/decryption is performed twice (once at the LB, once at the App Server).",
    lbCpu: "High (Decrypts client TLS, encrypts server TLS)",
    serverCpu: "Medium-High (Decrypts incoming server TLS)",
    security: "Fully Encrypted (Dual Session)",
  },
};

const CONFIG_SNIPPETS = {
  termination: `# NGINX SSL Termination Config
server {
    listen 443 ssl;
    server_name api.explainbytes.tech;

    ssl_certificate     /etc/ssl/certs/lb.crt;
    ssl_certificate_key /etc/ssl/private/lb.key;

    location / {
        # Forward to app pool as plain HTTP
        proxy_pass http://backend_app_servers;
        
        # Inject forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}`,
  passthrough: `# NGINX SSL Passthrough Config (Layer 4)
stream {
    upstream backend_app_servers {
        server app_server_1:443;
        server app_server_2:443;
    }

    server {
        listen 443;
        # Forward raw TCP streams without decrypting
        proxy_pass backend_app_servers;
    }
}`,
  re_encryption: `# NGINX TLS Re-encryption Config
server {
    listen 443 ssl;
    server_name api.explainbytes.tech;

    ssl_certificate     /etc/ssl/certs/lb.crt;
    ssl_certificate_key /etc/ssl/private/lb.key;

    location / {
        # Decrypt, inspect headers, and re-encrypt
        proxy_pass https://secure_app_servers;
        
        # Upstream TLS certificates
        proxy_ssl_trusted_certificate /etc/ssl/certs/ca.crt;
        proxy_ssl_verify on;
    }
}`,
};

export default function SslSimulation() {
  const [strategy, setStrategy] = useState<SslStrategy>("termination");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activePacket, setActivePacket] = useState<{
    phase:
      | "client-lb"
      | "processing-lb"
      | "lb-server"
      | "processing-server"
      | "server-client";
    progress: number; // 0 to 100
    isEncrypted: boolean;
  } | null>(null);

  // CPU utilization metrics
  const [lbCpu, setLbCpu] = useState(2);
  const [serverCpu, setServerCpu] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Utility to append logs
  const addLog = useCallback(
    (message: string, type: "client" | "lb" | "server" | "network") => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      setLogs((prev) => [{ timestamp: timeStr, type, message }, ...prev]);
    },
    [],
  );

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Keep CPU metrics baseline close to idle
  useEffect(() => {
    if (isProcessing) return;
    const interval = setInterval(() => {
      setLbCpu((prev) =>
        Math.max(1, Math.min(6, prev + (Math.random() - 0.5) * 2)),
      );
      setServerCpu((prev) =>
        Math.max(1, Math.min(6, prev + (Math.random() - 0.5) * 2)),
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Reset the sandbox state
  const resetSandbox = () => {
    setActivePacket(null);
    setIsProcessing(false);
    setIsPaused(false);
    setLbCpu(2);
    setServerCpu(2);
    setLogs([]);
    addLog("Sandbox reset. Ready for encrypted payload simulation.", "network");
  };

  // Trigger HTTPS request
  const sendRequest = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsPaused(false);
    setLogs([]);

    addLog("Client initiates HTTPS GET request payload.", "client");
    addLog(
      "TCP connection established. Performing TLS Client Hello...",
      "client",
    );

    // Phase 1: Client -> Load Balancer (Encrypted Packet)
    setActivePacket({
      phase: "client-lb",
      progress: 0,
      isEncrypted: true,
    });
  };

  // Animation ticks
  useEffect(() => {
    if (!activePacket || isPaused) return;

    const timer = setTimeout(() => {
      const { phase, progress, isEncrypted } = activePacket;

      if (phase === "client-lb") {
        if (progress < 100) {
          setActivePacket({ phase, progress: progress + 5, isEncrypted });
        } else {
          // Packet arrived at LB
          setActivePacket({ phase: "processing-lb", progress: 0, isEncrypted });
          addLog("Packet received by Load Balancer on port 443.", "lb");

          if (strategy === "termination" || strategy === "re_encryption") {
            addLog(
              "Decrypting SSL/TLS packet... verifying certificate store.",
              "lb",
            );
            setLbCpu(78);
          } else {
            addLog(
              "SSL Passthrough: Forwarding raw encrypted TCP streams without inspection.",
              "lb",
            );
            setLbCpu(8);
          }
        }
      } else if (phase === "processing-lb") {
        if (progress < 100) {
          setActivePacket({ phase, progress: progress + 10, isEncrypted });
        } else {
          // Finished processing at LB
          const nextEncrypted =
            strategy === "passthrough" || strategy === "re_encryption";
          if (strategy === "termination") {
            addLog(
              "Request decrypted to plaintext HTTP. Routing payload downstream.",
              "lb",
            );
          } else if (strategy === "re_encryption") {
            addLog(
              "Request inspected. Initiating secondary TLS session to backend...",
              "lb",
            );
            setLbCpu(88);
          }
          setActivePacket({
            phase: "lb-server",
            progress: 0,
            isEncrypted: nextEncrypted,
          });
        }
      } else if (phase === "lb-server") {
        if (progress < 100) {
          setActivePacket({ phase, progress: progress + 5, isEncrypted });
        } else {
          // Arrived at App Server
          setActivePacket({
            phase: "processing-server",
            progress: 0,
            isEncrypted,
          });
          addLog("Packet received by App Server.", "server");

          if (strategy === "passthrough" || strategy === "re_encryption") {
            addLog(
              "Decrypting TLS package using server certificate...",
              "server",
            );
            setServerCpu(82);
          } else {
            addLog(
              "Processing plaintext HTTP request payload instantly.",
              "server",
            );
            setServerCpu(12);
          }
        }
      } else if (phase === "processing-server") {
        if (progress < 100) {
          setActivePacket({ phase, progress: progress + 10, isEncrypted });
        } else {
          // Finished server processing
          addLog("App Server complete. Packaging response message.", "server");
          setActivePacket({
            phase: "server-client",
            progress: 0,
            isEncrypted: strategy !== "termination",
          });
          setServerCpu(strategy !== "termination" ? 35 : 5);
          setLbCpu(strategy === "re_encryption" ? 40 : 2);
        }
      } else if (phase === "server-client") {
        if (progress < 100) {
          setActivePacket({ phase, progress: progress + 6, isEncrypted });
        } else {
          // Arrived back at client
          addLog(
            "Client received decrypted HTTP response (200 OK). Connection closed.",
            "client",
          );
          setActivePacket(null);
          setIsProcessing(false);
          setIsPaused(false);
          setLbCpu(2);
          setServerCpu(2);
        }
      }
    }, 45);

    return () => clearTimeout(timer);
  }, [activePacket, strategy, addLog, isPaused]);

  const activeStrategyInfo = STRATEGY_INFO[strategy];

  return (
    <div className="w-full my-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/85 backdrop-blur-md shadow-2xl flex flex-col gap-6 select-none text-zinc-900 dark:text-zinc-100">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-4 gap-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            SSL/TLS Management Simulator
          </h3>
          <p className="text-xs text-zinc-650 dark:text-zinc-400">
            Compare TLS Termination, Passthrough, and Re-encryption flow
            patterns, decryption locations, and CPU loads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className={`py-2.5 px-4 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                isPaused
                  ? "bg-green-650 text-white shadow-lg shadow-green-900/15"
                  : "bg-white border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
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
          )}
          <button
            type="button"
            onClick={resetSandbox}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* SSL Strategy Selectors */}
      <div className="flex bg-zinc-105 bg-zinc-100 dark:bg-zinc-950/60 p-1.5 rounded-xl border dark:border-zinc-850 self-start">
        {(["termination", "passthrough", "re_encryption"] as SslStrategy[]).map(
          (mode) => (
            <button
              key={mode}
              type="button"
              disabled={isProcessing}
              onClick={() => setStrategy(mode)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                strategy === mode
                  ? "bg-white dark:bg-zinc-100 text-zinc-950 shadow-sm b dark:border-zinc-100"
                  : "bg-transparent text-zinc-550 border-transparent hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {mode === "termination"
                ? "SSL Termination"
                : mode === "passthrough"
                  ? "SSL Passthrough"
                  : "TLS Re-encryption"}
            </button>
          ),
        )}
      </div>

      {/* Grid Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Visual Canvas & Logs */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Canvas Box */}
          <div className="relative h-[500px] w-full rounded-xl border border-zinc-205 dark:border-zinc-800 bg-zinc-50/20 dark:bg-black/60 overflow-hidden flex items-center justify-around px-8">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Left Node: Client */}
            <div className="flex flex-col items-center gap-3 z-10">
              <div className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border-2 border-blue-500/80 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <User className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-400 tracking-wider block uppercase">
                  Client
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  IP: 198.51.100.12
                </span>
              </div>
            </div>

            {/* Link wire 1 (Client to LB) */}
            <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-800 relative mx-4">
              {activePacket &&
                (activePacket.phase === "client-lb" ||
                  activePacket.phase === "server-client") && (
                  <div
                    className={`absolute w-3.5 h-3.5 rounded-full -top-1.5 -translate-x-1/2 flex items-center justify-center shadow-md ${
                      activePacket.isEncrypted
                        ? "bg-purple-500 shadow-purple-500/30"
                        : "bg-emerald-500 shadow-emerald-500/30"
                    }`}
                    style={{
                      left: `${activePacket.phase === "client-lb" ? activePacket.progress : 100 - activePacket.progress}%`,
                      transition: "left 50ms linear",
                    }}
                  >
                    {activePacket.isEncrypted ? (
                      <Lock className="w-2 h-2 text-white" />
                    ) : (
                      <Unlock className="w-2 h-2 text-white" />
                    )}
                  </div>
                )}
            </div>

            {/* Middle Node: Load Balancer */}
            <div className="flex flex-col items-center gap-3 z-10 w-[140px]">
              <div
                className={`w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border-2 flex flex-col items-center justify-center shadow-lg transition-all ${
                  activePacket?.phase === "processing-lb"
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-950/10 shadow-purple-500/10 scale-105"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <Activity
                  className={`w-6 h-6 ${activePacket?.phase === "processing-lb" ? "text-purple-500 dark:text-purple-400 animate-pulse" : "text-zinc-500 dark:text-zinc-400"}`}
                />
                {activePacket?.phase === "processing-lb" && (
                  <span className="text-[7.5px] font-extrabold uppercase text-purple-650 dark:text-purple-400 px-1 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/30 rounded mt-0.5 animate-pulse">
                    Decrypting
                  </span>
                )}
              </div>
              <div className="text-center w-full">
                <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-400 tracking-wider block uppercase">
                  Load Balancer
                </span>

                {/* LB CPU Gauge */}
                <div className="mt-1.5 px-3">
                  <div className="flex justify-between text-[8px] text-zinc-550 dark:text-zinc-500 font-mono mb-0.5">
                    <span>CPU:</span>
                    <span
                      className={
                        lbCpu > 40
                          ? "text-red-500 font-bold"
                          : "text-zinc-700 dark:text-zinc-400"
                      }
                    >
                      {Math.round(lbCpu)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-900">
                    <div
                      className={`h-full transition-all duration-300 ${
                        lbCpu > 60
                          ? "bg-red-500"
                          : lbCpu > 30
                            ? "bg-purple-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                      style={{ width: `${lbCpu}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Link wire 2 (LB to Server) */}
            <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-800 relative mx-4">
              {activePacket &&
                (activePacket.phase === "lb-server" ||
                  activePacket.phase === "server-client") && (
                  <div
                    className={`absolute w-3.5 h-3.5 rounded-full -top-1.5 -translate-x-1/2 flex items-center justify-center shadow-md ${
                      activePacket.isEncrypted
                        ? "bg-purple-500 shadow-purple-500/30"
                        : "bg-emerald-500 shadow-emerald-500/30"
                    }`}
                    style={{
                      left: `${activePacket.phase === "lb-server" ? activePacket.progress : 0}%`,
                      display:
                        activePacket.phase === "server-client" &&
                        activePacket.progress < 50
                          ? "none"
                          : "flex",
                      transition: "left 50ms linear",
                    }}
                  >
                    {activePacket.isEncrypted ? (
                      <Lock className="w-2 h-2 text-white" />
                    ) : (
                      <Unlock className="w-2 h-2 text-white" />
                    )}
                  </div>
                )}
            </div>

            {/* Right Node: App Server */}
            <div className="flex flex-col items-center gap-3 z-10 w-[140px]">
              <div
                className={`w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border-2 flex items-center justify-center shadow-lg transition-all ${
                  activePacket?.phase === "processing-server"
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 shadow-emerald-500/10 scale-105"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Server
                  className={`w-5 h-5 ${activePacket?.phase === "processing-server" ? "text-emerald-500 dark:text-emerald-400 animate-pulse" : "text-zinc-500 dark:text-zinc-500"}`}
                />
              </div>
              <div className="text-center w-full">
                <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-400 tracking-wider block uppercase">
                  App Server
                </span>

                {/* App Server CPU Gauge */}
                <div className="mt-1.5 px-3">
                  <div className="flex justify-between text-[8px] text-zinc-550 dark:text-zinc-500 font-mono mb-0.5">
                    <span>CPU:</span>
                    <span
                      className={
                        serverCpu > 40
                          ? "text-red-500 font-bold"
                          : "text-zinc-700 dark:text-zinc-400"
                      }
                    >
                      {Math.round(serverCpu)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-900">
                    <div
                      className={`h-full transition-all duration-300 ${
                        serverCpu > 60
                          ? "bg-red-500"
                          : serverCpu > 30
                            ? "bg-emerald-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                      style={{ width: `${serverCpu}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Panel */}
          <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block">
                HTTPS Payload Triggers
              </span>
              <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400">
                Send an encrypted request payload to observe the decryption
                lifecycle.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={sendRequest}
                disabled={isProcessing}
                className="py-2.5 px-5 rounded-xl bg-purple-655  hover:bg-purple-600 disabled:bg-zinc-850 disabled:text-zinc-600 font-semibold text-xs text-black hover:text-white dark:text-white transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20 cursor-pointer disabled:cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                {isProcessing ? "Processing TLS..." : "Send HTTPS Request"}
              </button>
            </div>
          </div>

          {/* Decisions & Logs Console */}
          <div className="h-[150px] bg-zinc-50 dark:bg-zinc-950 rounded-xl border dark:border-zinc-850 flex flex-col overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b dark:border-zinc-850">
              <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
                Cryptographic Handshake & Decryption Logs
              </span>
            </div>
            <div className="p-2.5 flex-1 overflow-y-auto space-y-1 font-mono text-[9.5px] select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-400 dark:text-zinc-650 text-center pt-10">
                  No logs recorded. Trigger an HTTPS request to start.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex gap-1.5 text-zinc-705 dark:text-zinc-400"
                  >
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {log.timestamp}
                    </span>
                    <span
                      className={`font-bold shrink-0 ${
                        log.type === "client"
                          ? "text-blue-550 dark:text-blue-400"
                          : log.type === "lb"
                            ? "text-purple-655 dark:text-purple-400"
                            : log.type === "server"
                              ? "text-emerald-550 dark:text-emerald-400"
                              : "text-zinc-500"
                      }`}
                    >
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="truncate">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Explanations & Configuration */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl">
          {/* Strategy Details */}
          <div className="space-y-2.5 pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-purple-655 dark:text-purple-400">
              {activeStrategyInfo.title} Overview
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {activeStrategyInfo.desc}
            </p>
            <div className="grid grid-cols-1 gap-1 text-[10px] pt-1">
              <div>
                <span className="font-bold text-green-600 dark:text-green-400 block uppercase tracking-wider text-[8px] mb-0.5">
                  Pros
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {activeStrategyInfo.pros}
                </span>
              </div>
              <div className="mt-1">
                <span className="font-bold text-red-650 dark:text-red-400 block uppercase tracking-wider text-[8px] mb-0.5">
                  Cons
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {activeStrategyInfo.cons}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Resource Stats */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border  dark:border-zinc-855 dark:border-zinc-850 space-y-2">
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-zinc-600 dark:text-zinc-400">
                Internal Link Security:
              </span>
              {strategy === "termination" ? (
                <span className="text-red-650 dark:text-red-400 font-bold flex items-center gap-1 text-[9px] bg-red-500/10 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/30">
                  <ShieldAlert className="w-3 h-3" /> Plaintext HTTP
                </span>
              ) : (
                <span className="text-emerald-650 dark:text-emerald-400 font-bold flex items-center gap-1 text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/30">
                  <ShieldCheck className="w-3 h-3" /> Fully Encrypted
                </span>
              )}
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">
                LB Overhead:
              </span>
              <span className="font-mono text-zinc-800 dark:text-zinc-300">
                {activeStrategyInfo.lbCpu}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">
                Server Overhead:
              </span>
              <span className="font-mono text-zinc-800 dark:text-zinc-300">
                {activeStrategyInfo.serverCpu}
              </span>
            </div>
          </div>

          {/* Code Snippet Window */}
          <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 rounded-xl border dark:border-zinc-850 overflow-hidden min-h-[220px]">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border-b  dark:border-zinc-850 flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
                NGINX Config
              </span>
              <span className="text-[8px] bg-purple-500/25 text-purple-650 dark:text-purple-300 px-1 rounded font-mono font-bold">
                conf
              </span>
            </div>
            <div className="p-3 font-mono text-[9px] text-zinc-700 dark:text-zinc-400 overflow-x-auto whitespace-pre leading-relaxed select-text">
              {CONFIG_SNIPPETS[strategy]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
