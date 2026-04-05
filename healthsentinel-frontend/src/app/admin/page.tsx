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
  RefreshCw
} from "lucide-react";

export default function AdminPage() {
  const [isSystemActive, setIsSystemActive] = useState(true);

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Settings className="text-primary h-8 w-8 animate-[spin_4s_linear_infinite]" /> 
            System <span className="text-primary">Control</span>
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">
            Root Access | Kernel: 5.15.0-generic | Env: Production
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">API: Healthy</span>
          </div>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 transition-all">
            <RefreshCw className="h-4 w-4" /> Deploy Update
          </button>
        </div>
      </header>

      {/* --- INFRASTRUCTURE METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "CPU Load", value: "24%", icon: Cpu, color: "text-primary" },
          { label: "Memory Usage", value: "1.2GB / 4GB", icon: Database, color: "text-blue-500" },
          { label: "Active WebSockets", value: "142", icon: Zap, color: "text-amber-500" },
        ].map((item, i) => (
          <div key={i} className="bg-card/20 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-2xl font-black tracking-tighter ${item.color}`}>{item.value}</p>
            </div>
            <item.icon className={`h-8 w-8 ${item.color} opacity-20`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* HARDWARE & NODE CONFIGURATION */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Active Clusters
            </h3>
            
            <div className="space-y-4">
              {['Primary-Cluster-01', 'Backup-Node-FRA', 'Analytics-Worker-01'].map((node, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Terminal className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{node}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">Uptime: 14d 02h 11m</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRITICAL SYSTEM OVERRIDE */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Danger Zone
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-foreground">Global Alarm Override</p>
                <p className="text-xs text-muted-foreground mt-1">Disabling this will silence all emergency audio globally across all terminals.</p>
              </div>
              <button 
                onClick={() => setIsSystemActive(!isSystemActive)}
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                  isSystemActive 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isSystemActive ? "Kill Master Alarm" : "Restore System"}
              </button>
            </div>
          </div>
        </div>

        {/* RECENT SECURITY LOGS */}
        <div className="lg:col-span-5 bg-[#020817] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="h-24 w-24" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
            System Security Log
          </h3>
          <div className="space-y-6 font-mono text-[10px]">
            {[
              { time: "02:14:55", event: "SSH Login Success", user: "Wael_Admin", ip: "192.168.1.45" },
              { time: "01:44:20", event: "SSL Certificate Renewed", user: "SYSTEM", ip: "Internal" },
              { time: "01:12:09", event: "Failed Auth Attempt", user: "Unknown", ip: "45.12.88.21" },
              { time: "23:55:01", event: "Database Backup Completed", user: "CronJob", ip: "AWS-S3" },
            ].map((log, i) => (
              <div key={i} className="flex gap-4 border-b border-white/5 pb-4 last:border-0">
                <span className="text-primary font-bold">{log.time}</span>
                <div className="space-y-1">
                  <p className="text-foreground font-bold uppercase tracking-tight">{log.event}</p>
                  <p className="text-muted-foreground opacity-60">Source: {log.ip} | User: {log.user}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/20 transition-all">
            Download Audit Trail (CSV)
          </button>
        </div>

      </div>
    </div>
  );
}
