"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Database,
  Play,
  Layers,
  BarChart3,
  Zap,
  CheckCircle2,
  RefreshCw,
  Stethoscope,
  ShieldCheck,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isTraining && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.8, 100));
      }, 100);
    } else if (progress >= 100) {
      setIsTraining(false);
    }
    return () => clearInterval(interval);
  }, [isTraining, progress]);

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen pb-32">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <BrainCircuit className="text-primary h-8 w-8" />
            Neural <span className="text-primary">Workbench</span>
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">
            Platform: AWS SageMaker | Engine: Sentinel-V4-Pro | State: {isTraining ? 'Training' : 'Idle'}
          </p>
        </div>

        <button
          onClick={() => { setIsTraining(true); setProgress(0); }}
          disabled={isTraining}
          className={cn(
            "flex items-center gap-2 px-8 py-3 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg",
            isTraining 
              ? "bg-white/5 text-muted-foreground cursor-wait" 
              : "bg-primary text-black hover:scale-105 shadow-primary/20"
          )}
        >
          {isTraining ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
          {isTraining ? `Syncing Weights... ${progress.toFixed(0)}%` : "Initiate Model Retrain"}
        </button>
      </header>

      {/* --- TOP SECTION: MODEL ARCHITECTURE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-card/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Inference Architecture
            </h3>
            <div className="flex gap-4 text-[10px] font-mono font-bold text-muted-foreground uppercase">
              <span>Hyperparams: Optimized</span>
              <span>Backend: FastAPI / S3</span>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-around bg-black/40 rounded-3xl border border-white/5 relative">
              {[1, 2, 3, 4].map((layer) => (
                <div key={layer} className="flex flex-col gap-4 z-10">
                   {Array.from({ length: layer === 1 || layer === 4 ? 3 : 5 }).map((_, i) => (
                     <motion.div
                       key={i}
                       animate={isTraining ? {
                         scale: [1, 1.4, 1],
                         backgroundColor: ["#ffffff10", "#2dd4bf", "#ffffff10"],
                         boxShadow: ["0 0 0px #2dd4bf00", "0 0 10px #2dd4bf", "0 0 0px #2dd4bf00"]
                       } : {}}
                       transition={{ duration: 1, repeat: Infinity, delay: (layer + i) * 0.1 }}
                       className="h-3 w-3 rounded-full bg-white/10 border border-white/20"
                     />
                   ))}
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <Zap className="h-48 w-48 text-primary" />
              </div>
          </div>
        </div>

        {/* LIVE TRAINING LOGS */}
        <div className="lg:col-span-4 bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between">
           <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Live Loss Curve
            </h3>
            <div className="h-40 w-full border-l border-b border-white/10 relative flex items-end p-2 overflow-hidden">
                <svg className="w-full h-full">
                    <motion.path
                        d="M 0 100 Q 20 80 40 90 T 80 40 T 120 60 T 160 20 T 200 30"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </svg>
            </div>
           </div>
           
           <div className="space-y-4 mt-6">
              <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                <span>Validation Accuracy</span>
                <span className="text-primary">99.2%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[99.2%] shadow-[0_0_15px_#2dd4bf]" />
              </div>
           </div>
        </div>
      </div>

      {/* --- NEW BOTTOM SECTION: STAFF COMPLIANCE & TRAINING --- */}
      <div className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> Clinical Compliance Modules
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "NEWS2 Emergency Protocol", status: "88% Certified", icon: ShieldCheck, color: "text-teal-500" },
            { name: "Sepsis Early Detection", status: "94% Certified", icon: Zap, color: "text-amber-500" },
            { name: "Sentinel-V4 Interface", status: "62% Certified", icon: BrainCircuit, color: "text-blue-500" },
          ].map((mod, i) => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={i} 
              className="bg-card/30 border border-white/5 p-6 rounded-[2rem] flex items-center gap-6"
            >
              <div className={cn("p-4 rounded-2xl bg-white/5", mod.color)}>
                <mod.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">{mod.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Award className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{mod.status}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
