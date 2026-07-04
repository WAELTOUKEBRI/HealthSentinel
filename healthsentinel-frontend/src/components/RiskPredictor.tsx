"use client";

import { useState } from "react";
import { fetchClinicalRiskScore, InferenceResponse } from "@/services/inferenceService";
import { CloudCog, Wind, Droplets, Activity, Heart, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RiskPredictor() {
  const [vitals, setVitals] = useState({
    respirationRate: 16,
    oxygenSaturation: 98,
    systolicBP: 120,
    heartRate: 70,
    temperature: 36.8,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InferenceResponse | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVitals({ ...vitals, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const data = await fetchClinicalRiskScore(vitals);
      setResult(data);
    } catch (err: any) {
      console.error("Inference failed:", err);
      // Optional: Add a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/20 p-6 rounded-2xl border border-white/5 shadow-2xl space-y-6">
      <div className="flex items-center gap-2 text-primary uppercase text-[10px] font-black tracking-[0.2em]">
        <CloudCog className="h-4 w-4" /> AI INFERENCE NODE
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... Existing Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Wind className="h-3 w-3" /> Resp (rpm)
            </label>
            <input type="number" name="respirationRate" value={vitals.respirationRate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Droplets className="h-3 w-3" /> SpO2 (%)
            </label>
            <input type="number" name="oxygenSaturation" value={vitals.oxygenSaturation} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Activity className="h-3 w-3" /> Sys BP
            </label>
            <input type="number" name="systolicBP" value={vitals.systolicBP} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Heart className="h-3 w-3" /> HR
            </label>
            <input type="number" name="heartRate" value={vitals.heartRate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Thermometer className="h-3 w-3" /> Temp
            </label>
            <input type="number" name="temperature" value={vitals.temperature} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors rounded-xl py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Processing Model...' : 'Run Manual Inference'}
        </button>
      </form>

      {result && (
        <div className={cn("p-4 rounded-xl border backdrop-blur-sm space-y-2 mt-4", result.severity === 'Critical' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[9px] uppercase font-black tracking-widest">Model Status</span>
            <span className="text-xs font-bold uppercase">{result.severity}</span>
          </div>
          <p className="text-2xl font-black font-mono mt-1">{(result.score * 100).toFixed(1)}% <span className="text-[10px] font-sans text-muted-foreground tracking-widest uppercase">Risk</span></p>
          <p className="text-[10px] opacity-70 leading-relaxed italic">"{result.reasoning}"</p>
        </div>
      )}
    </div>
  );
}
