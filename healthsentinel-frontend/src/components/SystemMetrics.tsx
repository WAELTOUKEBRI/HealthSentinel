"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, ShieldAlert, Cpu } from "lucide-react";

export default function SystemMetrics() {
  // 🔹 Using the array mapping from the suggestion for cleaner code
  const metrics = [
    { 
      label: "Total Patients", 
      value: "128", 
      icon: Users, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50" 
    },
    { 
      label: "Critical Alerts", 
      value: "7", 
      icon: ShieldAlert, 
      color: "text-red-600", 
      bgColor: "bg-red-50" 
    },
    { 
      label: "System Load", 
      value: "63%", 
      icon: Cpu, 
      color: "text-teal-600", 
      bgColor: "bg-teal-50" 
    },
  ];

  return (
    // 🔹 Kept your original grid layout (3 columns on desktop)
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {metrics.map((m) => (
        <Card key={m.label} className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            
            {/* 🔹 Added the styled icon container from the suggestion */}
            <div className={`p-3 rounded-xl ${m.bgColor} ${m.color}`}>
              <m.icon className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {m.label}
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                {m.value}
              </h2>
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
}
