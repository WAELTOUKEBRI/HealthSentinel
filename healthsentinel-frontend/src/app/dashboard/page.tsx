"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Activity, ShieldCheck, History, Pill, ArrowLeft, ClipboardList, Wind, Droplets, Thermometer, Zap } from "lucide-react";
import { useSentinelStore } from "@/store/useSentinelStore";
import PatientStatusCard from "@/components/PatientStatusCard";
import { Input } from "@/components/ui/input";
import SystemMetrics from "@/components/SystemMetrics";
import HeartRateChart from "@/components/HeartRateChart";

const SkeletonCard = () => (
  <div className="h-64 w-full bg-card/20 animate-pulse rounded-2xl border border-white/5" />
);

// Updated for NEWS2 Awareness
const getStatusFromVitals = (p: any): "Critical" | "Warning" | "Stable" => {
  if (p.heartRate > 120 || p.heartRate < 50 || p.oxygenSaturation < 92) return "Critical";
  if (p.heartRate > 100 || p.heartRate < 60 || p.oxygenSaturation < 95) return "Warning";
  return "Stable";
};

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { patients, setPatients } = useSentinelStore();
  const notifiedPatients = useRef<Set<string>>(new Set());

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const getAIReason = (p: any) => {
    if (p.heartRate > 120) return "ACUTE TACHYCARDIA: Possible SVT. Check electrolyte panel and 12-lead ECG.";
    if (p.oxygenSaturation < 94) return "HYPOXEMIA DETECTED: Low oxygen saturation. Verify O2 delivery and lung auscultation.";
    if (p.heartRate < 60) return "BRADYCARDIAL EVENT: Sinus Node Dysfunction suspected. Review drug-induced depression.";
    return "HEMODYNAMIC STABILITY: Patient baseline sinus rhythm maintained.";
  };

  const getProtocols = (p: any) => {
    const protocols = ["Ensure continuous pulse oximetry monitoring.", "Update primary physician on telemetry trends."];
    if (p.status === "Critical") protocols.push("Initiate Emergency Protocol 402.", "Prepare arterial blood gas (ABG) kit.");
    return protocols;
  };

  // 1. WebSocket Engine with NEWS2 Data Mapping
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://healthsentinel-alb-prod-480870509.eu-west-3.elb.amazonaws.com/ws/patients";
    const ws = new WebSocket(backendUrl);

    ws.onmessage = (event) => {
      try {
        const incomingData = JSON.parse(event.data);
        if (isLoading) setIsLoading(false);
        const currentPatients = useSentinelStore.getState().patients;

        const updatedList = incomingData.map((updated: any) => {
          const prev = currentPatients.find((p: any) => p.id === updated.id);
          const history = prev?.history || new Array(12).fill(updated.heartRate);
          const newHistory = [...history.slice(1), updated.heartRate];

          // Map simulation or real DB fields
          const pData = {
            ...updated,
            history: newHistory,
            // Fallbacks for demo simulation stability
            oxygenSaturation: updated.oxygenSaturation || 98,
            respirationRate: updated.respirationRate || 16,
            temperature: updated.temperature || 36.8,
            systolicBP: updated.systolicBP || 122,
          };

          return { ...pData, status: getStatusFromVitals(pData) };
        });

        setPatients(updatedList);
      } catch (err) {
        console.error("Data Parse Error:", err);
      }
    };

    return () => ws.close();
  }, [setPatients, isLoading]);

  useEffect(() => {
    const syncMute = () => setIsMuted(localStorage.getItem("sonar-muted") === "true");
    const unlock = () => { setAudioEnabled(true); window.removeEventListener("click", unlock); };
    syncMute();
    window.addEventListener("storage", syncMute);
    window.addEventListener("click", unlock);
    const interval = setInterval(syncMute, 1000);
    return () => {
      window.removeEventListener("storage", syncMute);
      window.removeEventListener("click", unlock);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!(window as any).__sentinelAudio) {
        (window as any).__sentinelAudio = new Audio("/sounds/emergency-alarm.mp3");
        (window as any).__sentinelAudio.loop = true;
      }
      const audio = (window as any).__sentinelAudio;
      const hasCritical = patients.some(p => p.status === "Critical");
      if (hasCritical && !isMuted && audioEnabled) {
        if (audio.paused) audio.play().catch(() => {});
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [patients, isMuted, audioEnabled]);

  useEffect(() => {
    patients.forEach((p) => {
      if (p.status === "Critical" && !notifiedPatients.current.has(p.id)) {
        toast.error(`VITAL SIGN ALERT: ${p.name || p.id}`, {
          className: "bg-slate-950 border-red-500/50 text-white",
          description: <p className="text-[11px] font-bold italic text-red-400">"{getAIReason(p)}"</p>,
          duration: 10000,
        });
        notifiedPatients.current.add(p.id);
      } else if (p.status !== "Critical") {
        notifiedPatients.current.delete(p.id);
      }
    });
  }, [patients]);

  const filteredPatients = patients.filter((p) =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePatient = selectedPatient ? patients.find(p => p.id === selectedPatient.id) || selectedPatient : null;

  return (
    <main className="space-y-8 p-6 bg-background min-h-screen relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              Health<span className="text-primary">Sentinel</span> <span className="text-[10px] text-muted-foreground ml-2 opacity-50">V1.2.0</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase bg-white/5 px-3 py-1 rounded-full w-fit border border-white/5">
            <span className="text-primary animate-pulse">{'>_'}</span>
            <span>NODE: EU-WEST-3 (RDS-CONNECTED)</span>
          </div>
        </div>

        {!activePatient && (
          <Input
            id="icu-search"
            name="icu-search"
            placeholder="Search ICU Nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-card/30 border-white/5 rounded-xl h-10"
          />
        )}
      </header>

      <AnimatePresence mode="wait">
        {activePatient ? (
          <motion.div key="focus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12 max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
              <div className="space-y-4">
                <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to Grid
                </button>
                <h2 className="text-5xl font-black uppercase tracking-tighter flex items-center gap-3">
                  {activePatient.name} <span className="text-primary">#{activePatient.id}</span>
                </h2>
              </div>
              <div className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-lg ${
                activePatient.status === 'Critical' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-red-500/20' : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
              }`}>
                {activePatient.status}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-[#020817] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                 <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                     <Activity className="h-4 w-4 animate-pulse" /> LIVE TELEMETRY
                   </div>
                   <p className="text-6xl font-black text-primary tabular-nums tracking-tighter">
                     {activePatient.heartRate} <span className="text-xs uppercase font-bold text-muted-foreground ml-2">BPM</span>
                   </p>
                 </div>
                 <div className="h-[350px]"><HeartRateChart /></div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                {/* Expanded Vitals Panel */}
                <div className="bg-card/40 border border-white/10 rounded-[2rem] p-8 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-muted-foreground uppercase text-[10px] font-black tracking-[0.2em]"><Zap className="h-4 w-4" /> NEWS2 PARAMETERS</div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[9px] text-muted-foreground block uppercase font-black">SpO2</span>
                        <span className="text-xl font-black text-blue-400">{activePatient.oxygenSaturation}%</span>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[9px] text-muted-foreground block uppercase font-black">Resp</span>
                        <span className="text-xl font-black text-sky-400">{activePatient.respirationRate}</span>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[9px] text-muted-foreground block uppercase font-black">Temp</span>
                        <span className="text-xl font-black text-orange-400">{activePatient.temperature}°C</span>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[9px] text-muted-foreground block uppercase font-black">BP</span>
                        <span className="text-xl font-black text-emerald-400">{activePatient.systolicBP}</span>
                     </div>
                  </div>
                </div>

                <div className="bg-card/40 border border-white/10 rounded-[2rem] p-8 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-muted-foreground uppercase text-[10px] font-black tracking-[0.2em]"><Pill className="h-4 w-4" /> ACTIVE MEDICATIONS</div>
                  <div className="space-y-3">
                    {["Amiodarone - 150mg IV", "Heparin - 5000 units SC"].map((med, i) => (
                      <div key={i} className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-[11px] font-bold text-primary">{med}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-[#020817] rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><ClipboardList className="h-32 w-32" /></div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6">AI DIAGNOSTIC SUMMARY</h4>
                    <p className="text-xl font-medium italic text-foreground/90 leading-relaxed bg-white/5 p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                      "{getAIReason(activePatient)}"
                    </p>
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-6">RECOMMENDED PROTOCOL</h4>
                    <div className="space-y-4">
                        {getProtocols(activePatient).map((rec, i) => (
                            <div key={i} className="flex items-start gap-4 text-[13px] text-foreground/80 bg-white/5 p-4 rounded-2xl border border-white/5">
                              <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
                              <span className="font-medium">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="grid" className="space-y-10">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1"><SystemMetrics /></div>
              <div className="lg:col-span-2 bg-card/20 p-6 rounded-2xl border border-white/5 shadow-2xl"><HeartRateChart /></div>
            </div>
            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground mb-8 px-2">Live Patient Telemetry Grid</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                  <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                ) : (
                  filteredPatients.map((p, idx) => (
                    <div key={p.id} onClick={() => setSelectedPatient(p)} className={cn("cursor-pointer transition-transform hover:scale-[1.02]", p.status === 'Critical' && 'animate-critical')}>
                      <PatientStatusCard
                        {...p}
                        heartRateHistory={p.history || [p.heartRate]}
                        index={idx}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

