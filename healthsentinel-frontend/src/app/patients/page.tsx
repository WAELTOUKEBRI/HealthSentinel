"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  MapPin, 
  Heart, 
  Clock 
} from "lucide-react";
import { useSentinelStore } from "@/store/useSentinelStore";
import { Input } from "@/components/ui/input";

export default function PatientsPage() {
  const { patients } = useSentinelStore();
  const [search, setSearch] = useState("");

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen">
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Users className="text-primary h-8 w-8" /> 
            Patient <span className="text-primary">Directory</span>
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">
            Global ICU Registry | Active Nodes: {new Set(patients.map(p => p.ward)).size}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID or Name..." 
              className="pl-10 w-64 bg-card/30 border-white/5 rounded-xl focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="bg-primary text-black p-3 rounded-xl hover:scale-105 transition-transform">
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* --- QUICK STATS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Admissions", value: patients.length, color: "text-blue-500" },
          { label: "High Risk", value: patients.filter(p => p.status === 'Critical').length, color: "text-red-500" },
          { label: "Recent Transfers", value: "12", color: "text-emerald-500" },
          { label: "Ward Capacity", value: "88%", color: "text-amber-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-card/20 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PATIENT LIST TABLE */}
        <div className="lg:col-span-8 bg-card/20 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest">Active Records</h3>
            <Filter className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                  <th className="p-6">Patient</th>
                  <th className="p-6">Location</th>
                  <th className="p-6">Vitals</th>
                  <th className="p-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredPatients.map((p, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full animate-pulse ${p.status === 'Critical' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="font-bold text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs uppercase font-bold tracking-tight">{p.ward}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Heart className={`h-3 w-3 ${p.status === 'Critical' ? 'text-red-500' : 'text-primary'}`} />
                          <span className="font-mono font-bold tabular-nums">{p.heartRate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ml-auto">
                        Details <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADMISSION FEED SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#020817] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Clock className="h-20 w-20" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              Live Admission Feed
            </h3>
            <div className="space-y-6">
              {[
                { time: "2m ago", event: "Emergency Admission", node: "ICU-01", patient: "John Doe" },
                { time: "15m ago", event: "Ward Transfer", node: "GEN-04", patient: "Sarah Miller" },
                { time: "45m ago", event: "Protocol Update", node: "ICU-03", patient: "Robert Brown" },
                { time: "1h ago", event: "Discharge Pending", node: "GEN-02", patient: "Alice Wilson" },
              ].map((event, i) => (
                <div key={i} className="relative pl-6 border-l border-white/10">
                  <div className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-white/20" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{event.time}</p>
                  <p className="text-xs font-bold text-foreground mt-1">{event.event}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 text-primary">
                      {event.node}
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">— {event.patient}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-colors">
              View Audit Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
