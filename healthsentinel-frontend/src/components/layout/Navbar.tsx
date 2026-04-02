"use client";

import { usePathname } from "next/navigation";
import { Bell, Monitor, MoonStar, SunMedium, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 🔊 Initialize state from localStorage so the icon matches the sound state
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sonar-muted") === "true";
    }
    return false;
  });

  // 🔹 Fixed: This function now correctly updates state AND storage
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem("sonar-muted", JSON.stringify(newMuteState));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPage = pathname.split("/").pop() || "Dashboard";

  return (
    <header className="w-full bg-card/80 dark:bg-card/50 backdrop-blur-md border-b border-border/10 px-6 py-3 flex justify-between items-center shadow-sm transition-all duration-300 sticky top-0 z-40">

      {/* 🔹 Left Section */}
      <div className="flex items-center gap-5">
        <h1 className="font-extrabold text-2xl capitalize text-foreground tracking-tight leading-none">
          {currentPage === "dashboard" ? "Overview" : currentPage}
        </h1>

        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-secondary/50 dark:bg-secondary/20 border border-border/5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-500 uppercase tracking-widest">
              Live Feed
            </span>
          </div>
          <div className="h-3 w-px bg-border/20" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Node: eu-west-3
          </span>
        </div>
      </div>

      {/* 🔹 Right Section */}
      <div className="flex items-center gap-4">

        {/* 🔊 SONAR SYSTEM TOGGLE */}
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute} // ✅ FIXED: Now calls the function that updates storage
            className={cn(
              "flex items-center gap-2 px-3 h-10 rounded-xl transition-all duration-200 border border-border/10",
              isMuted
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                : "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 border-teal-500/20"
            )}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="animate-pulse" />}
            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
              Sonar: {isMuted ? "Muted" : "Live"}
            </span>
          </Button>
        )}

        {/* 🔹 Theme Toggle Group */}
        {mounted && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/80 dark:bg-secondary/20 border border-border/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme("light")}
              className={cn(
                "h-8 w-8 px-0 rounded-lg transition-all duration-200",
                theme === "light" ? "bg-white text-teal-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SunMedium className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme("dark")}
              className={cn(
                "h-8 w-8 px-0 rounded-lg transition-all duration-200",
                theme === "dark" ? "bg-card text-teal-500 shadow-md border border-border/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoonStar className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme("system")}
              className={cn(
                "h-8 w-8 px-0 rounded-lg transition-all duration-200",
                theme === "system" ? "bg-white dark:bg-card text-teal-600 dark:text-teal-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 🔔 Notification Hub */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-teal-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-card" />
        </Button>

        {/* 🏥 User Identity Section */}
        <div className="flex items-center gap-3 pl-4 border-l border-border/20">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground leading-tight">Wael</p>
            <p className="text-[10px] text-teal-600 dark:text-teal-500 font-bold uppercase tracking-widest leading-none mt-1">
              ClinOps
            </p>
          </div>
          <div className="h-10 w-10 bg-card border border-border/10 rounded-xl shadow-sm flex items-center justify-center text-xl hover:scale-105 transition-transform cursor-pointer">
            👨‍💻
          </div>
        </div>
      </div>
    </header>
  );
}
