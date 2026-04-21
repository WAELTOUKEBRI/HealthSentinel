"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowUpRight,
  MapPin,
  Heart,
  Clock,
  Activity,
  ShieldAlert
} from "lucide-react";
import { useSentinelStore } from "@/store/useSentinelStore";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PatientsPage() {
  const { patients } = useSentinelStore();
  const [search, setSearch] = useState("");

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 min-h-screen relative overflow-hidden transition-colors duration-300 bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-200">
      
      {/* --- ADAPTIVE BACKGROUND DECORATION --- */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Users className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Registry <span className="text-primary not-italic">Matrix</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono font-bold tracking-[0.4em] text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
            <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
            Active Nodes: {new Set(patients.map(p => p.ward)).size} | Secure Uplink Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search DNA-ID or Name..."
              className="pl-12 w-72 h-12 rounded-2xl border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 backdrop-blur-md focus:border-primary/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white dark:text-black h-12 w-12 flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <UserPlus className="h-5 w-5 stroke-[3px]" />
          </button>
        </div>
      </header>

      {/* --- QUICK STATS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
        {[
          { label: "Total Admissions", value: patients.length, color: "bg-blue-500/10 border-blue-500/20", icon: Users, textColor: "text-blue-500" },
          { label: "High Risk", value: patients.filter(p => p.status === 'Critical').length, color: "bg-red-500/10 border-red-500/20", icon: ShieldAlert, textColor: "text-red-500" },
          { label: "Recent Transfers", value: "12", color: "bg-emerald-500/10 border-emerald-500/20", icon: Activity, textColor: "text-emerald-500" },
          { label: "Ward Capacity", value: "88%", color: "bg-amber-500/10 border-amber-500/20", icon: Clock, textColor: "text-amber-500" },
        ].map((stat, i) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={i}
            className={cn(
              "relative overflow-hidden border p-6 rounded-[2rem] backdrop-blur-xl shadow-sm dark:shadow-2xl transition-all",
              stat.color
            )}
          >
            <stat.icon className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10", stat.textColor)} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
            <p className={cn("text-4xl font-black tracking-tighter", stat.textColor)}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* PATIENT LIST TABLE */}
        <div className="lg:col-span-8 border rounded-[2.5rem] overflow-hidden backdrop-blur-2xl transition-all border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 shadow-xl dark:shadow-2xl">
          <div className="p-7 border-b flex justify-between items-center border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full shadow-[0_0_10px_#ccf381]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Tactical Patient Overview</h3>
            </div>
            <Filter className="h-4 w-4 text-slate-500 cursor-pointer hover:text-primary transition-colors" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
                  <th className="p-7">Entity</th>
                  <th className="p-7">Location / Node</th>
                  <th className="p-7">Vital Status</th>
                  <th className="p-7 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                <AnimatePresence>
                  {filteredPatients.map((p, i) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                      key={p.id}
                      className="border-b transition-all group cursor-pointer border-slate-50 dark:border-white/[0.03] hover:bg-primary/[0.04] dark:hover:bg-primary/[0.02]"
                    >
                      <td className="p-7">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center border font-black text-xs transition-colors",
                            p.status === 'Critical' 
                              ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500'
                          )}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold group-hover:text-primary transition-colors leading-none mb-1 text-slate-900 dark:text-slate-100">{p.name}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-tighter">SIG-ID: {p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-7">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border w-fit bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-300">{p.ward}</span>
                        </div>
                      </td>
                      <td className="p-7">
                        <div className="flex items-center gap-2">
                          <Heart className={cn("h-4 w-4 transition-colors", p.status === 'Critical' ? 'text-red-500 animate-bounce' : 'text-primary')} />
                          <span className="font-mono font-black text-lg tabular-nums tracking-tighter text-slate-900 dark:text-slate-100">{p.heartRate}</span>
                          <span className="text-[8px] text-slate-500 font-black uppercase">bpm</span>
                        </div>
                      </td>
                      <td className="p-7 text-right">
                        <button className="ml-auto flex items-center gap-2 p-2 px-4 rounded-xl transition-all border text-[9px] font-black uppercase tracking-[0.2em] bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-primary hover:text-white dark:hover:text-black hover:border-primary">
                          Analysis <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* --- ADMISSION FEED SIDEBAR --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border p-8 rounded-[3rem] relative overflow-hidden backdrop-blur-3xl shadow-xl transition-all border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/60 shadow-slate-200/50 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] rotate-12">
              <Activity className="h-40 w-40 text-primary" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live Telemetry
              </h3>
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">REALTIME_V2</span>
            </div>

            <div className="space-y-8 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-primary/50 via-slate-200 dark:via-white/5 to-transparent" />

              {[
                { time: "2m ago", event: "Emergency Admission", node: "ICU-01", patient: "John Doe", type: "urgent" },
                { time: "15m ago", event: "Ward Transfer", node: "GEN-04", patient: "Sarah Miller", type: "normal" },
                { time: "1h ago", event: "Discharge Pending", node: "GEN-02", patient: "Alice Wilson", type: "normal" },
              ].map((event, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="relative pl-8 group"
                >
                  <div className={cn(
                    "absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 transition-all group-hover:scale-125 border-white dark:border-[#020617]",
                    event.type === 'urgent' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-300 dark:bg-slate-700'
                  )} />
                  <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">{event.time}</p>
                  <p className="text-sm font-bold transition-colors text-slate-800 dark:text-slate-100 group-hover:text-primary">{event.event}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border font-bold bg-slate-50 dark:bg-primary/10 border-slate-200 dark:border-primary/20 text-slate-600 dark:text-primary">
                      {event.node}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">— {event.patient}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-10 py-4 border rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all bg-slate-50 dark:bg-primary/5 border-slate-100 dark:border-primary/20 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white dark:hover:text-black">
              System Audit Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
