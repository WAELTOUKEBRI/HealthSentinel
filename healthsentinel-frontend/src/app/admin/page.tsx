"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Server, Terminal, Cpu, Database, Box, BrainCircuit,
  RefreshCw, Check, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Static placeholders to ensure SSR match
const INITIAL_TRENDS = Array.from({ length: 10 }, () => 30);
const INITIAL_METRICS = { cpu: 32.4, latency: 42 };

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [trends, setTrends] = useState({ cpu: INITIAL_TRENDS, memory: INITIAL_TRENDS, latency: INITIAL_TRENDS });
  
  const [logs] = useState([
    { time: "14:02:11", event: "Pod Scaling", desc: "health-sentinel-api +2 replicas", type: "system" },
    { time: "13:44:20", event: "ConfigMap", desc: "env-vars-v2 applied", type: "system" },
    { time: "13:12:09", event: "Auth Warning", desc: "Blocked IP: 45.12.88.21", type: "alert" },
  ]);

  // Handle client-side initialization
  useEffect(() => {
    setIsMounted(true);
    
    // Initialize random trends after mount
    setTrends({
      cpu: Array.from({ length: 10 }, () => Math.floor(Math.random() * 40) + 20),
      memory: Array.from({ length: 10 }, () => Math.floor(Math.random() * 40) + 20),
      latency: Array.from({ length: 10 }, () => Math.floor(Math.random() * 40) + 20),
    });

    // Start live interval
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(Math.max(prev.cpu + (Math.random() - 0.5) * 5, 10), 90),
        latency: Math.min(Math.max(prev.latency + (Math.random() - 0.5) * 10, 20), 120),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null; // Or a skeleton loader

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-[#020617] min-h-screen text-slate-900 dark:text-slate-200">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Operational
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Control Plane</h1>
        </div>
        <button 
          onClick={() => setIsDeploying(!isDeploying)}
          className="bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:opacity-90 transition-all"
        >
          {isDeploying ? <RefreshCw className="animate-spin h-4 w-4" /> : <Settings className="h-4 w-4" />}
          {isDeploying ? "Deployment in Progress" : "Trigger Pipeline"}
        </button>
      </div>

      {/* --- METRICS BENTO GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "CPU Utilization", value: `${metrics.cpu.toFixed(1)}%`, trend: trends.cpu, icon: Cpu },
          { label: "Memory Usage", value: "2.8 / 8GB", trend: trends.memory, icon: Database },
          { label: "Active Pods", value: "12 / 12", trend: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30], icon: Box },
          { label: "P99 Latency", value: `${metrics.latency.toFixed(0)}ms`, trend: trends.latency, icon: BrainCircuit },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <item.icon className="text-primary h-5 w-5" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
            </div>
            <p className="text-2xl font-black mb-4">{item.value}</p>
            <div className="flex items-end gap-0.5 h-8">
              {item.trend.map((h, idx) => (
                <div key={idx} className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-slate-500">Cluster Nodes</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((node) => (
              <div key={node} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono">ip-10-0-{node}-45.ec2.internal</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Region: eu-west-3 | Instance: t3.medium</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Check className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Healthy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">System Terminal</h3>
            <Terminal className="h-4 w-4 text-slate-700" />
          </div>
          <div className="space-y-4 font-mono text-[10px]">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  key={i} className="flex gap-3 border-l border-slate-800 pl-3 py-1"
                >
                  <span className="text-slate-500 shrink-0">{log.time}</span>
                  <div>
                    <p className={cn("font-bold", log.type === 'alert' ? 'text-red-500' : 'text-slate-300')}>{log.event}</p>
                    <p className="text-slate-600">{log.desc}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex items-center gap-2 text-primary animate-pulse">
              <ChevronRight className="h-4 w-4" />
              <span className="h-3 w-1 bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
