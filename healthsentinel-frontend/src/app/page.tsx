"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-teal-600 p-4 rounded-3xl text-white shadow-2xl shadow-teal-500/20"
      >
        <Activity size={48} />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
          Health<span className="text-teal-600">Sentinel</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-[400px] mx-auto text-lg">
          Advanced real-time patient telemetry and risk management platform.
        </p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link href="/dashboard">
          <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 rounded-2xl text-lg font-bold group">
            Launch Dashboard
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </motion.div>

      <div className="pt-12 grid grid-cols-3 gap-8 opacity-50 grayscale">
         <div className="text-[10px] font-bold uppercase tracking-widest">Next.js 16</div>
         <div className="text-[10px] font-bold uppercase tracking-widest">FastAPI</div>
         <div className="text-[10px] font-bold uppercase tracking-widest">AWS Cloud</div>
      </div>
    </div>
  );
}

