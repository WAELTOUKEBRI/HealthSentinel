"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, ShieldCheck, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 p-6">
      {/* 1. PULSING LOGO */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [1, 1.1, 1], opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="bg-teal-600 p-5 rounded-[2rem] text-white shadow-2xl shadow-teal-500/30 relative"
      >
        <Activity size={52} />
        <span className="absolute inset-0 rounded-[2rem] border-2 border-teal-500 animate-ping opacity-20" />
      </motion.div>

      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
            Health<span className="text-teal-600">Sentinel</span>
          </h1>

          {/* 🌐 Task 3: Enterprise Trust Layer */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 border border-primary/20 px-3 py-1 rounded-full bg-primary/5 backdrop-blur-sm">
              <ShieldCheck size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                HIPAA Compliant Architecture
              </span>
            </div>
            <div className="flex items-center gap-2 border border-border/40 px-3 py-1 rounded-full bg-background/50">
              <Activity size={14} className="text-teal-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                99.9% Uptime SLA
              </span>
            </div>
            <div className="flex items-center gap-2 border border-border/40 px-3 py-1 rounded-full bg-background/50">
              <Lock size={14} className="text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                AES-256 Encrypted
              </span>
            </div>
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 max-w-[480px] mx-auto text-lg leading-relaxed">
          The next generation of clinical telemetry. Secure, real-time patient monitoring
          engineered for high-acuity environments and mission-critical reliability.
        </p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <Link href="/dashboard">
          <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-7 rounded-2xl text-xl font-bold group shadow-lg shadow-teal-500/20">
            Launch Command Center
            <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
           <Globe size={12} className="text-teal-600 animate-pulse" />
           Node: eu-west-3 (Paris) | Secure WebSocket Session
        </div>
      </motion.div>

      {/* 3. TECH SPEC */}
      <div className="pt-16">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Built with High-Availability Stack</div>
        <div className="flex gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
           <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Next.js 16</span>
             <span className="text-[8px] uppercase font-bold opacity-70">Frontend</span>
           </div>
           <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">FastAPI</span>
             <span className="text-[8px] uppercase font-bold opacity-70">Backend</span>
           </div>
           <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">AWS Cloud</span>
             <span className="text-[8px] uppercase font-bold opacity-70">Infrastructure</span>
           </div>
        </div>
      </div>
    </div>
  );
}
