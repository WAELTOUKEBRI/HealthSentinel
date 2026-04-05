"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  Database, 
  Play, 
  Layers, 
  BarChart3, 
  Zap, 
  CheckCircle2 
} from "lucide-react";

export default function TrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isTraining && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 100));
      }, 100);
    } else if (progress >= 100) {
      setIsTraining(false);
    }
    return () => clearInterval(interval);
  }, [isTraining, progress]);

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <BrainCircuit className="text-primary h-8 w-8" /> 
            Neural <span className="text-primary">Workbench</span>
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">
            Model: Sentinel-V4-Pro | Framework: PyTorch | Device: CUDA (RTX 4090)
          </p>
        </div>

        <button 
          onClick={() => { setIsTraining(true); setProgress(0); }}
          disabled={isTraining}
          className={`flex items-center gap-2 px-8 py-3 font-black uppercase text-xs tracking-widest rounded-xl transition-all ${
            isTraining 
            ? 'bg-white/5 text-muted-foreground cursor-not-allowed' 
            : 'bg-primary text-black hover:scale-105 active:scale-95 shadow-lg shadow-primary/20'
          }`}
        >
          {isTraining ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
          {isTraining ? `Training... ${progress.toFixed(1)}%` : "Initiate Training"}
        </button>
      </header>

      {/* --- MODEL TOPOLOGY & STATS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: NETWORK ARCHITECTURE */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Model Architecture
              </h3>
              <div className="flex gap-4 text-[10px] font-mono font-bold text-muted-foreground uppercase">
                <span>Layers: 24</span>
                <span>Params: 12.4M</span>
              </div>
            </div>

            {/* Neural Net Visualizer - Fixed visibility */}
            <div className="h-64 w-full flex items-center justify-around bg-black/60 rounded-3xl border border-white/10 relative">
               {[1, 2, 3, 4].map((layer) => (
                 <div key={layer} className="flex flex-col gap-4 z-10">
                    {Array.from({ length: layer === 1 || layer === 4 ? 3 : 5 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={isTraining ? { 
                          scale: [1, 1.4, 1],
                          backgroundColor: ["#ffffff30", "#00ffcc", "#ffffff30"],
                          boxShadow: ["0 0 0px #00ffcc00", "0 0 15px #00ffcc", "0 0 0px #00ffcc00"]
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="h-3 w-3 rounded-full bg-white/20 border border-white/40" 
                      />
                    ))}
                 </div>
               ))}
               {/* Center Icon - Increased opacity so it's not just a grey box */}
               <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                 <Zap className="h-48 w-48 text-primary" />
               </div>
            </div>
          </div>

          {/* DATASET HEALTH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card/20 border border-white/5 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-widest">Training Dataset</h4>
              </div>
              <p className="text-4xl font-black tracking-tighter">842,000 <span className="text-xs text-muted-foreground uppercase">Records</span></p>
              <div className="mt-4 flex gap-2">
                 <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-bold">Validated</span>
                 <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded font-bold">Augmented</span>
              </div>
            </div>

            <div className="bg-card/20 border border-white/5 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-widest">Validation Accuracy</h4>
              </div>
              <p className="text-4xl font-black tracking-tighter">99.2 <span className="text-xs text-muted-foreground uppercase">%</span></p>
              <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full w-[99%]" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TRAINING CONSOLE */}
        <div className="lg:col-span-4 bg-[#020817] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Live Loss Curve
          </h3>
          
          <div className="flex-1 min-h-[300px] border-l border-b border-white/10 relative flex items-end p-4">
            <svg className="w-full h-full overflow-visible">
              <path 
                d="M 0 20 Q 50 150 100 180 T 300 220" 
                fill="none" 
                stroke="currentColor" 
                className={`text-primary stroke-2 transition-opacity ${isTraining ? "animate-pulse opacity-100" : "opacity-50"}`}
              />
            </svg>
            <div className="absolute top-0 right-0 text-[10px] font-mono text-muted-foreground">Loss: 0.0024</div>
          </div>

          <div className="mt-10 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Training Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span>Epoch 42/50</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-primary shadow-[0_0_10px_#00ffcc]" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
               <div>
                 <p className="text-[9px] text-muted-foreground uppercase font-black">Batch Size</p>
                 <p className="text-sm font-bold">128</p>
               </div>
               <div>
                 <p className="text-[9px] text-muted-foreground uppercase font-black">Learn Rate</p>
                 <p className="text-sm font-bold">1e-4</p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  );
}
