"use client";



import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { Progress } from "@/components/ui/progress";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { Line } from "react-chartjs-2";

import { motion } from "framer-motion";

import { AlertCircle, Activity, MapPin } from "lucide-react";

import {

  Chart as ChartJS,

  CategoryScale,

  LinearScale,

  PointElement,

  LineElement,

  Title,

  Tooltip,

  Legend,

  Filler

} from "chart.js";



ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);



interface PatientProps {

  id: string;

  name?: string;

  ward?: string;

  status: "Critical" | "Stable" | "Warning";

  heartRate: number;

  heartRateHistory?: number[];

  index?: number;

}



export default function PatientStatusCard({

  id,

  name,

  ward,

  status,

  heartRate,

  heartRateHistory = [70, 72, 75, 73, heartRate],

  index = 0

}: PatientProps) {

  console.log(`Rendering Card for: ${name}, ID is: ${id}`);

  const badgeVariant = status === "Critical" ? "destructive" : status === "Warning" ? "outline" : "default";

  const alertVariant = status === "Critical" ? "destructive" : "default";

  const healthPercentage = (heartRate / 150) * 100;

  const alertMessage = status === "Critical" ? "Immediate attention required!" : status === "Warning" ? "Monitor patient closely." : "Patient stable.";

  const chartColor = status === "Critical" ? "#ef4444" : status === "Warning" ? "#f59e0b" : "#10b981";



  const chartData = {

    labels: heartRateHistory.map((_, i) => i.toString()),

    datasets: [{

      label: "BPM",

      data: heartRateHistory,

      borderColor: chartColor,

      borderWidth: 2.5,

      tension: 0.4,

      pointRadius: 0,

      fill: true,

      backgroundColor: (context: any) => {

        const ctx = context.chart.ctx;

        const gradient = ctx.createLinearGradient(0, 0, 0, 100);

        gradient.addColorStop(0, `${chartColor}33`);

        gradient.addColorStop(1, 'transparent');

        return gradient;

      },

    }],

  };



  const chartOptions = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: { legend: { display: false }, tooltip: { enabled: false } },

    scales: {

      x: { display: false },

      y: { display: false, min: 40, max: 180 }

    }

  };



  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.5, delay: index * 0.1 }}

      className="h-full w-full"

    >

      <Link href={`/dashboard/patient/${id}`} className="block h-full group">

        <Card

          className={cn(

            "h-full flex flex-col transition-all duration-500 bg-card/80 backdrop-blur-md overflow-hidden",

            "border-t-4 border-t-transparent",

            "hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] cursor-pointer",

            "data-[status=Critical]:border-t-destructive data-[status=Warning]:border-t-orange-500 data-[status=Stable]:border-t-teal-500"

          )}

          data-status={status}

        >

          <CardHeader className="pb-2 space-y-4">

            <div className="flex justify-between items-start">

              <div className="space-y-1">

                <div className="flex items-center gap-2">

                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />

                  <CardTitle className="text-xs font-black uppercase tracking-tight">

                    {name || `Patient ${id}`}

                  </CardTitle>

                </div>



                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">

                  <span className="text-[7px] font-black text-teal-600 uppercase tracking-tighter">

                    View Full History →

                  </span>

                </div>



                <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">

                  <span>#{id}</span>

                  {ward && <span className="flex items-center gap-0.5 text-primary/70"><MapPin className="h-2 w-2" /> {ward}</span>}

                </div>

              </div>

              <Badge variant={badgeVariant} className="text-[8px] px-1.5 py-0 font-black">{status}</Badge>

            </div>



            <Alert

              variant={alertVariant}

              className={cn("py-1.5 px-2 border-none transition-colors",

                status === "Critical" ? "bg-destructive/10" : "bg-muted/50"

              )}

            >

              <div className="flex flex-col gap-0.5">

                <AlertDescription className="text-[8px] font-black uppercase flex items-center gap-1.5 leading-none">

                  <AlertCircle className="h-2.5 w-2.5" />

                  {alertMessage}

                </AlertDescription>



                {status === "Critical" && (

                  <span className="text-[7px] font-bold text-destructive/80 pl-4 italic animate-pulse">

                    Insight: Tachycardia + Sustained 3hr Upward Trend

                  </span>

                )}

              </div>

            </Alert>

          </CardHeader>



          <CardContent className="flex-1 flex flex-col justify-between pt-2">

            <div className="flex justify-between items-end mb-2">

              <div className="flex items-baseline gap-1">

                <span className="text-5xl font-black tracking-tighter tabular-nums leading-none">{heartRate}</span>

                <span className="text-[10px] text-muted-foreground uppercase font-black">bpm</span>

              </div>

              <div className="flex items-center gap-2 mb-1">

                <span className="text-[8px] font-bold text-muted-foreground uppercase">Live</span>

                <div className="relative flex h-2 w-2">

                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: chartColor }}></span>

                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: chartColor }}></span>

                </div>

              </div>

            </div>



            <div className="h-16 w-full -mx-1">

              <Line data={chartData} options={chartOptions} />

            </div>



            <div className="mt-4 space-y-1">

              <div className="flex justify-between text-[8px] font-bold uppercase text-muted-foreground">

                <span>Threshold</span>

                <span>{Math.round(healthPercentage)}%</span>

              </div>

              <Progress value={healthPercentage} className="h-1" />

            </div>

          </CardContent>

        </Card>

      </Link>

    </motion.div>

  );

}

