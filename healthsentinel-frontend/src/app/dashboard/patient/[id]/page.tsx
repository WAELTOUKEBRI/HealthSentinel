"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Activity, History, Pill, MapPin, 
  ShieldCheck, ClipboardList, Wind, Droplets, 
  Thermometer, Zap 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

// Unified Clinical Logic (Matches Dashboard)
const getStatusFromVitals = (p: any): "Critical" | "Warning" | "Stable" => {
  if (!p) return "Stable";
  if (p.heartRate > 120 || p.heartRate < 50 || (p.oxygenSaturation && p.oxygenSaturation < 92)) return "Critical";
  if (p.heartRate > 100 || p.heartRate < 60 || (p.oxygenSaturation && p.oxygenSaturation < 95)) return "Warning";
  return "Stable";
};

const getAIReason = (p: any) => {
    if (!p) return "";
    if (p.heartRate > 115) return "CRITICAL TACHYCARDIA: Immediate bedside assessment required. Risk of hemodynamic collapse.";
    if (p.oxygenSaturation && p.oxygenSaturation < 94) return "HYPOXEMIA ALERT: Oxygen saturation below clinical baseline. Assess respiratory effort.";
    if (p.heartRate < 55) return "CRITICAL BRADYCARDIAL EVENT: Sinus Node Dysfunction suspected. Review medication induced depression.";
    return "HEMODYNAMIC STABILITY: Patient baseline sinus rhythm maintained. Continue standard monitoring.";
};

const getProtocols = (p: any) => {
    const protocols = [
        "Ensure continuous pulse oximetry monitoring.",
        "Evaluate for potential AV-block medications.",
        "Review latest Potassium (K+) and Magnesium (Mg++) levels.",
        "Update primary physician on current telemetry trends."
    ];
    if (p?.status === "Critical") {
        protocols.unshift("Bedside review by Rapid Response Team (RRT) requested.");
    }
    return protocols;
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>(new Array(60).fill(70));

  useEffect(() => {
    // These relative paths tell the browser to use the Nginx proxy
    const apiPath = process.env.NEXT_PUBLIC_API_URL || "/api";
    const wsPath = process.env.NEXT_PUBLIC_WS_URL || "/ws/patients";

    // Build the full WebSocket URL based on the current browser location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const finalWsUrl = `${protocol}//${host}${wsPath}`;

    const fetchData = async () => {
      try {
        // This will fetch from http://localhost/api/patients
        const response = await fetch(`${apiPath}/patients`);
        const data = await response.json();
        const found = data.find((p: any) => String(p.id) === String(params.id));

        if (found) {
          const enrichedPatient = {
            ...found,
            oxygenSaturation: found.oxygenSaturation || 98,
            respirationRate: found.respirationRate || 16,
            temperature: found.temperature || 36.8,
            systolicBP: found.systolicBP || 122,
          };
          setPatient({ ...enrichedPatient, status: getStatusFromVitals(enrichedPatient) });
        }
        setLoading(false);
      } catch (err) { 
        console.error("Fetch error:", err); 
        setLoading(false);
      }
    };

    fetchData();

    // Connect to WebSocket via Nginx
    const socket = new WebSocket(finalWsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const found = data.find((p: any) => String(p.id) === String(params.id));

      if (found) {
        setHeartRateHistory(prev => [...prev.slice(1), found.heartRate]);
        setPatient((prev: any) => {
          if (!prev) return found;
          const updated = {
            ...prev,
            ...found,
            displayRate: found.heartRate,
          };
          return { ...updated, status: getStatusFromVitals(updated) };
        });
      }
    };

    return () => socket.close();
  }, [params.id]);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-primary">INITIALIZING NEURAL SYNC...</div>;
  if (!patient) return <div className="p-20 text-center font-black text-destructive">PATIENT NODE NOT FOUND</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-12 max-w-7xl mx-auto pb-32">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet
        </Button>
        <Badge className={cn(
            "px-8 py-2 uppercase font-black tracking-widest text-[10px]",
            patient.status === 'Critical' ? 'bg-red-500 animate-pulse' : 
            patient.status === 'Warning' ? 'bg-orange-500' : 'bg-teal-500'
        )}>
          {patient.status}
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-950 border-white/10 border rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="h-32 w-32 text-teal-500" /></div>
          <CardHeader className="p-10 pb-0 flex flex-row justify-between items-center relative z-10">
            <div className="space-y-1">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                {patient.name} <span className="text-teal-500">#{patient.id}</span>
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <MapPin className="h-3 w-3" /> {patient.ward || "ICU-UNIT-01"}
                </div>
            </div>
            <div className="text-right">
              <span className="text-7xl font-black text-teal-400 tabular-nums leading-none">{patient.displayRate || patient.heartRate}</span>
              <span className="block text-[10px] font-black text-slate-500 uppercase mt-1">Beats Per Minute</span>
            </div>
          </CardHeader>
          <CardContent className="h-80 p-8 relative z-10">
            <Line
              data={{
                labels: heartRateHistory.map((_, i) => i),
                datasets: [{ 
                    data: heartRateHistory, 
                    borderColor: "#2dd4bf", 
                    borderWidth: 3,
                    tension: 0.4, 
                    pointRadius: 0, 
                    fill: true,
                    backgroundColor: (context: any) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, '#2dd4bf22');
                        gradient.addColorStop(1, 'transparent');
                        return gradient;
                    },
                }]
              }}
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                animation: false, 
                scales: { 
                    x: { display: false }, 
                    y: { display: true, min: 40, max: 180, grid: { color: '#ffffff05' }, ticks: { color: '#475569', font: { weight: 'bold', size: 10 } } } 
                }, 
                plugins: { legend: { display: false } } 
              }}
            />
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-slate-50 border-none rounded-[2rem] p-4 shadow-xl">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><History className="h-3 w-3"/> Clinical Context</CardTitle></CardHeader>
            <CardContent className="text-[11px] font-black uppercase space-y-4">
              <div className="flex justify-between border-b border-slate-200 pb-3"><span>Admission:</span><span className="text-slate-500">2026-04-01</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-3"><span>Severity Index:</span><span className={patient.status === 'Critical' ? 'text-red-500' : 'text-teal-600'}>{patient.status === 'Critical' ? 'High Risk' : 'Standard'}</span></div>
              <div className="flex justify-between"><span>Last Assessment:</span><span className="text-slate-500">JUST NOW</span></div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-50 border-none rounded-[2rem] p-4 shadow-xl">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Pill className="h-3 w-3" /> Active Protocol</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-teal-500/10 rounded-2xl text-[10px] font-black text-teal-700 border border-teal-500/20">Amiodarone - 150mg IV</div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-400">Heparin - 5000 units SC</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NEW: NEWS2 Vital Signs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "SpO2", value: `${patient.oxygenSaturation}%`, icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/5" },
            { label: "Resp Rate", value: patient.respirationRate, icon: Wind, color: "text-sky-400", bg: "bg-sky-400/5" },
            { label: "Temp", value: `${patient.temperature}°C`, icon: Thermometer, color: "text-orange-400", bg: "bg-orange-400/5" },
            { label: "Systolic BP", value: patient.systolicBP, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/5" },
          ].map((stat, i) => (
            <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
                className={cn("p-8 rounded-[2.5rem] border border-slate-100 shadow-sm", stat.bg)}
            >
                <div className="flex items-center gap-3 mb-4">
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                </div>
                <div className="text-4xl font-black tabular-nums tracking-tighter">{stat.value}</div>
            </motion.div>
          ))}
      </div>

      {/* AI Diagnostic & Intervention Section */}
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-12 bg-slate-950 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ClipboardList className="h-40 w-40 text-white" /></div>
        <div className="relative z-10 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-500">AI Diagnostic Summary</h4>
          <p className="text-xl font-medium italic text-slate-200 leading-relaxed bg-white/5 p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
            "{getAIReason(patient)}"
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Protocol Intervention</h4>
          <div className="space-y-3">
              {getProtocols(patient).map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-teal-500/5 border border-teal-500/10 text-[12px] text-slate-300 font-medium">
                  <ShieldCheck className="h-5 w-5 text-teal-500 flex-shrink-0" /> {p}
                </div>
              ))}
          </div>
        </div>
      </motion.div>

      {/* Action Footer */}
      <div className="flex justify-center pb-20">
        <Button className="px-20 py-8 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95" onClick={() => router.push('/dashboard')}>
          Acknowledge & Sync Report
        </Button>
      </div>
    </motion.div>
  );
}
