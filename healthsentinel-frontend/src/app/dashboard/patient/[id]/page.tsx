"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, History, Pill, MapPin, ShieldCheck, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, ChartOptions
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const getAIReason = (bpm: number) => {
    if (bpm > 115) return "CRITICAL TACHYCARDIA: Immediate bedside assessment required. Risk of hemodynamic collapse.";
    if (bpm < 55) return "CRITICAL BRADYCARDIAL EVENT: Sinus Node Dysfunction suspected. Review medication induced depression.";
    return "HEMODYNAMIC STABILITY: Patient baseline sinus rhythm maintained. Continue standard monitoring.";
};

const getProtocols = () => [
    "Ensure continuous pulse oximetry monitoring.",
    "Evaluate for potential AV-block medications.",
    "Review latest Potassium (K+) and Magnesium (Mg++) levels.",
    "Update primary physician on current telemetry trends."
];

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>(new Array(60).fill(70));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/patients");
        const data = await response.json();
        const found = data.find((p: any) => String(p.id) === String(params.id));
        setPatient(found);
        setLoading(false);
      } catch (err) { console.error(err); }
    };
    fetchData();

    const socket = new WebSocket("ws://localhost:8000/ws/patients");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const found = data.find((p: any) => String(p.id) === String(params.id));
      if (found) {
        setHeartRateHistory(prev => [...prev.slice(1), found.heartRate]);
        setPatient((prev: any) => ({
          ...found,
          displayRate: found.heartRate, // Using raw for EKG feel
          status: found.heartRate > 105 ? "Critical" : found.heartRate > 90 ? "Warning" : "Stable"
        }));
      }
    };
    return () => socket.close();
  }, [params.id]);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-primary">INITIALIZING NEURAL SYNC...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-12 max-w-7xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-xl border-white/10 bg-white/5" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet
        </Button>
        <Badge className={`px-6 py-2 uppercase font-black ${patient.status === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-teal-500'}`}>
          {patient.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 bg-slate-950 border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-10 pb-0 flex flex-row justify-between items-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              {patient.name} <span className="text-teal-500">#{patient.id}</span>
            </h2>
            <div className="text-right">
              <span className="text-6xl font-black text-teal-400 tabular-nums">{patient.displayRate || patient.heartRate}</span>
              <span className="ml-2 text-xs font-bold text-slate-500">BPM</span>
            </div>
          </CardHeader>
          <CardContent className="h-80 p-8">
            <Line 
              data={{
                labels: heartRateHistory.map((_, i) => i),
                datasets: [{ data: heartRateHistory, borderColor: "#2dd4bf", tension: 0.4, pointRadius: 0, fill: false }]
              }} 
              options={{ responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { display: false }, y: { display: false, min: 40, max: 160 } }, plugins: { legend: { display: false } } }} 
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-none rounded-3xl p-2">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical History</CardTitle></CardHeader>
            <CardContent className="text-xs font-bold uppercase space-y-4">
              <div className="flex justify-between border-b pb-2"><span>Admission:</span><span className="text-slate-500">2026-04-01</span></div>
              <div className="flex justify-between"><span>Risk Factor:</span><span className="text-teal-600">Low</span></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-none rounded-3xl p-2">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescriptions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-teal-500/10 rounded-xl text-[10px] font-black text-teal-700">Amiodarone - 150mg IV</div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400">Heparin - 5000 units</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-12 bg-slate-950 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-500">AI Diagnostic Summary</h4>
          <p className="text-xl font-medium italic text-slate-200 leading-relaxed bg-white/5 p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
            "{getAIReason(patient.heartRate)}"
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Protocol Intervention</h4>
          {getProtocols().map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 text-[12px] text-slate-300">
              <ShieldCheck className="h-5 w-5 text-teal-500" /> {p}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-center">
        <Button className="px-20 py-8 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl transition-all hover:scale-105" onClick={() => router.push('/dashboard')}>
          Acknowledge & Save Report
        </Button>
      </div>
    </motion.div>
  );
}
