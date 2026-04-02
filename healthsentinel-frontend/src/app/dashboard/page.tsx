"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Activity, Loader2, Search, Terminal } from "lucide-react";

import PatientStatusCard from "@/components/PatientStatusCard";
import { Input } from "@/components/ui/input";
import SystemMetrics from "@/components/SystemMetrics";
import HeartRateChart from "@/components/HeartRateChart";

interface Patient {
  id: string;
  name: string;
  status: "Critical" | "Warning" | "Stable";
  heartRate: number;
  riskScore: number;
  ward: string;
  history?: number[];
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const notifiedPatients = useRef<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // 1. Initialize state from localStorage
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sonar-muted") === "true";
    }
    return false;
  });

  // 2. Browser "Unlocker": Arm the audio on the first click anywhere
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/emergency-alarm.mp3");
        audioRef.current.loop = true;
      }
      
      audioRef.current.play()
        .then(() => {
          audioRef.current?.pause();
          setAudioEnabled(true);
          console.log("Sonar System: ARMED");
        })
        .catch(() => console.log("Waiting for interaction..."));

      window.removeEventListener("click", unlock);
    };

    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  // 3. Sync Mute State from Navbar
  useEffect(() => {
    const handleStorageChange = () => {
      const muted = localStorage.getItem("sonar-muted") === "true";
      setIsMuted(muted);
    };
    window.addEventListener("storage", handleStorageChange);
    const syncInterval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(syncInterval);
    };
  }, []);

  // 4. Master Audio Controller: Play if Critical, Stop if Clean or Muted
  useEffect(() => {
    const hasCritical = patients.some(p => p.status === "Critical");

    if (hasCritical && !isMuted && audioEnabled) {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [patients, isMuted, audioEnabled]);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/patients");
      if (!response.ok) throw new Error("Backend connection failed");
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("System Sync Error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  // Toast Notifications Only (Audio is handled by the Master Controller above)
  useEffect(() => {
    patients.forEach((p) => {
      if (p.status === "Critical" && !notifiedPatients.current.has(p.id)) {
        toast.error(`CRITICAL ALERT: ${p.name || p.id}`, {
          description: `High Risk Detected in ${p.ward}.`,
          duration: 10000,
        });
        notifiedPatients.current.add(p.id);
      } else if (p.status !== "Critical") {
        notifiedPatients.current.delete(p.id);
      }
    });
  }, [patients]);

  const filteredPatients = patients.filter((p) =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="space-y-8 animate-in fade-in duration-700 p-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
              Health<span className="text-primary">Sentinel</span>
              <span className="ml-2 text-muted-foreground font-mono text-xs opacity-50">v1.0.4</span>
            </h1>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-pulse" />
            Node: eu-west-3 (Paris)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Patient Database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border/10 focus-visible:ring-primary/20 text-foreground rounded-xl"
            />
          </div>
        </div>
      </header>

      {/* Metrics Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1"><SystemMetrics /></div>
        <div className="lg:col-span-2 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/10">
          <HeartRateChart />
        </div>
      </div>

      {/* Patients Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-2">
            Active Biometric Monitors
          </h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredPatients.map((p, idx) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <PatientStatusCard
                  id={p.id}
                  name={p.name}
                  ward={p.ward}
                  status={p.status}
                  heartRate={p.heartRate}
                  heartRateHistory={p.history || [p.heartRate]}
                  index={idx}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
