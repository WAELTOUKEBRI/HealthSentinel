"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Server,
  ShieldAlert,
  Activity,
  Database,
  Terminal,
  Cpu,
  Zap,
  RefreshCw,
  Box,
  ShieldCheck,
  BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [isSystemActive, setIsSystemActive] = useState(true);

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen pb-20">
      {/* --- CLUSTER HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Settings className="text-primary h-8 w-8 animate-[spin_4s_linear_infinite]" />
            Control <span className="text-primary">Plane</span>
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">
            EKS-v1.28 | Region: eu-west-3 | Namespace: health-sentinel-prod
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">GitOps: Synced</span>
          </div>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <RefreshCw className="h-4 w-4" /> Trigger Pipeline
          </button>
        </div>
      </header>

      {/* --- LIVE K8S METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Cluster CPU", value: "32.4%", icon: Cpu, color: "text-primary" },
          { label: "Memory Reserved", value: "2.8GB", icon: Database, color: "text-blue-500" },
          { label: "Active Pods", value: "12/12", icon: Box, color: "text-emerald-500" },
          { label: "Inference Latency", value: "42ms", icon: BrainCircuit, color: "text-amber-500" },
        ].map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-card/20 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between backdrop-blur-sm"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-2xl font-black tracking-tighter ${item.color}`}>{item.value}</p>
            </div>
            <item.icon className={`h-8 w-8 ${item.color} opacity-20`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* EKS NODE TOPOLOGY */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> EKS Node Groups (Managed)
            </h3>

            <div className="space-y-4">
              {[
                { name: 'ip-10-0-1-45.eu-west-3.compute', type: 't3.medium', status: 'Healthy' },
                { name: 'ip-10-0-2-88.eu-west-3.compute', type: 't3.medium', status: 'Healthy' },
                { name: 'ip-10-0-1-12.eu-west-3.compute', type: 't3.large', status: 'Healthy' },
              ].map((node, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Terminal className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-bold text-foreground">{node.name}</p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Instance: {node.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{node.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DEVSECOPS PIPELINE STATUS */}
          <div className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> DevSecOps Scanners
            </h3>
            <div className="grid grid-cols-3 gap-4">
               {[
                 { name: "Trivy", status: "Pass", color: "text-emerald-500" },
                 { name: "Gitleaks", status: "Clean", color: "text-emerald-500" },
                 { name: "Bandit", status: "2 Issues", color: "text-amber-500" },
               ].map((scan, i) => (
                 <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">{scan.name}</p>
                    <p className={cn("text-xs font-bold", scan.color)}>{scan.status}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* SECURITY & INFRA LOGS */}
        <div className="lg:col-span-5 bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="h-24 w-24" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
            Infrastructure Events
          </h3>
          <div className="space-y-6 font-mono text-[10px]">
            {[
              { time: "14:02:11", event: "Pod Scaling Event", desc: "health-sentinel-api +2 replicas", type: "system" },
              { time: "13:44:20", event: "ConfigMap Updated", desc: "env-vars-v2 applied", type: "system" },
              { time: "13:12:09", event: "Unauthorized Access", desc: "Blocked IP: 45.12.88.21", type: "alert" },
              { time: "12:55:01", event: "Health Check Pass", desc: "Liveness probe success", type: "system" },
            ].map((log, i) => (
              <div key={i} className="flex gap-4 border-b border-white/5 pb-4 last:border-0">
                <span className={cn("font-bold", log.type === 'alert' ? 'text-red-500' : 'text-primary')}>{log.time}</span>
                <div className="space-y-1">
                  <p className="text-foreground font-bold uppercase tracking-tight">{log.event}</p>
                  <p className="text-muted-foreground opacity-60">{log.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">
            View CloudWatch Logs
          </button>
        </div>

      </div>
    </div>
  );
}
