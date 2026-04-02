"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { AlertCircle, Activity, MapPin } from "lucide-react"; // Added MapPin
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PatientProps {
  id: string;
  name?: string; // 🔹 Added name
  ward?: string; // 🔹 Added ward
  status: "Critical" | "Stable" | "Warning";
  heartRate: number;
  heartRateHistory?: number[];
  index?: number;
}

export default function PatientStatusCard({ 
  id, 
  name, // 🔹 Accept name
  ward, // 🔹 Accept ward
  status, 
  heartRate, 
  heartRateHistory = [70, 72, 75, 73, heartRate], 
  index = 0 
}: PatientProps) {
  const badgeVariant = status === "Critical" ? "destructive" : status === "Warning" ? "outline" : "default";
  const alertVariant = status === "Critical" ? "destructive" : "default";
  const healthPercentage = (heartRate / 150) * 100;
  const alertMessage = status === "Critical" ? "Immediate attention required!" : status === "Warning" ? "Monitor patient closely." : "Patient stable.";
  const chartColor = status === "Critical" ? "#ef4444" : status === "Warning" ? "#f59e0b" : "#10b981";

  const chartData = {
    labels: ["T-4", "T-3", "T-2", "T-1", "Now"],
    datasets: [{
      label: "BPM",
      data: heartRateHistory,
      borderColor: chartColor,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: chartColor,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        display: true,
        grid: { display: true, color: "rgba(200, 200, 200, 0.1)" },
        ticks: { padding: 5, color: "#94a3b8", font: { size: 9, weight: "bold" as const } }
      },
      y: {
        display: true,
        min: 60, max: 160,
        grid: { display: true, color: "rgba(200, 200, 200, 0.1)" },
        ticks: {
          padding: 10,
          stepSize: 20,
          color: "#94a3b8",
          font: { size: 9, weight: "bold" as const }
        }
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="h-full w-full">
      <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent data-[status=Critical]:border-l-destructive data-[status=Warning]:border-l-orange-500 data-[status=Stable]:border-l-teal-500 bg-card" data-status={status}>
        <CardHeader className="flex flex-col gap-2 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                {/* 🔹 CHANGED: Shows Name if it exists, otherwise fallback to ID */}
                <CardTitle className="text-sm font-black text-foreground uppercase tracking-tight">
                  {name || `Patient ${id}`}
                </CardTitle>
              </div>
              
              {/* 🔹 NEW: Secondary line for ID and Ward */}
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>#{id}</span>
                {ward && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-0.5 text-primary">
                      <MapPin className="h-2.5 w-2.5" /> {ward}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={badgeVariant} className="font-bold uppercase tracking-wider text-[9px]">{status}</Badge>
          </div>
          <div className="min-h-[36px]">
            <Alert variant={alertVariant} className="py-1.5 px-3 border-none bg-opacity-10">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-[9px] font-extrabold uppercase">
                {alertMessage}
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col justify-end pt-0">
          <div className="flex justify-between items-baseline mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tighter leading-none">{heartRate}</span>
              <span className="text-[10px] text-slate-400 uppercase font-black">bpm</span>
            </div>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: chartColor }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: chartColor }}></span>
            </div>
          </div>
          <Progress value={healthPercentage} className="h-1.5" />
          <div className="h-[140px] w-full mt-2 p-2 bg-slate-50/30 dark:bg-slate-900/10 rounded-lg border border-border/5">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
