"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSentinelStore } from "@/store/useSentinelStore";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, GraduationCap, Shield, Activity, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  
  // 🔹 STATE SYNC: In a real app, this would come from a Global Context or Zustand.
  // For now, we'll simulate the count or listen to the same logic as your dashboard.
  const { criticalCount } = useSentinelStore();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, alertCount: criticalCount },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Training", href: "/training", icon: GraduationCap },
    { name: "Admin", href: "/admin", icon: Shield },
  ];

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-5 flex flex-col justify-between transition-colors duration-300">
      <div className="space-y-10">

        {/* 🏥 Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Activity className="text-primary h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-sidebar-foreground tracking-tighter">
            Health<span className="text-primary">Sentinel</span>
          </h2>
        </div>

        {/* 🏥 Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const hasAlerts = item.alertCount && item.alertCount > 0;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-border/5"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={18}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-primary"
                    )}
                  />
                  {item.name}
                </div>

                {/* 🚨 THE ALERT BADGE */}
                <AnimatePresence>
                  {hasAlerts && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ 
                        scale: [1, 1.2, 1], // Pulse effect
                        opacity: 1 
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut" 
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground shadow-lg shadow-destructive/40"
                    >
                      {item.alertCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 🏥 Professional Footer */}
      <div className="p-4 bg-sidebar-accent/30 rounded-2xl border border-sidebar-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20">
            WT
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-sidebar-foreground truncate">Wael Toukebri</p>
            <p className="text-[10px] text-primary font-extrabold uppercase tracking-widest opacity-80">
                Cloud/DevOps   Engineer
            </p>
          </div>
        </div>

        {/* Infrastructure Status Indicator */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-background/50 border border-border/5">
          <Circle className="h-2 w-2 fill-teal-500 text-teal-500 animate-pulse" />
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-tighter">
            System: Active
          </span>
        </div>
      </div>
    </aside>
  );
}
