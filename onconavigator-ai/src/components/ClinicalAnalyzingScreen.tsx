import React, { useEffect, useState } from "react";
import { Dna, ShieldCheck, Activity } from "lucide-react";
import { getTranslation, Language } from "../utils/translations";

interface ClinicalAnalyzingScreenProps {
  lang: Language;
}

export function ClinicalAnalyzingScreen({ lang }: ClinicalAnalyzingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  const statusUpdates = [
    "Analyzing uploaded reports...",
    "Checking clinical & medical inputs...",
    "Generating recommended screenings pathways...",
    "Preparing guidelines and risk analysis..."
  ];

  useEffect(() => {
    // Elegant incremental multiplier for smooth loading feel
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressTimer);
          return 98;
        }
        return prev + 1;
      });
    }, 55);

    // Swap status string elements matching the loading status indices
    const statusTimer = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % statusUpdates.length);
    }, 1400);

    return () => {
      clearInterval(progressTimer);
      clearInterval(statusTimer);
    };
  }, []);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 max-w-xl mx-auto shadow-3xs space-y-8 text-center py-16">
      
      {/* Soothing breathing pulse medical loader icon */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        {/* Soft, calming background breath rings */}
        <div className="absolute inset-0 rounded-full bg-blue-50 border border-blue-100 animate-ping opacity-35" style={{ animationDuration: "2.5s" }} />
        <div className="absolute inset-2 rounded-full bg-slate-50 border border-slate-100 animate-pulse" />
        
        {/* Dual spinning DNA elements */}
        <div className="relative z-10 text-blue-600 animate-[spin_8s_linear_infinite]">
          <Dna className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl md:text-2xl font-serif text-slate-900 font-semibold tracking-tight leading-snug">
          {getTranslation("step5Title", lang)}
        </h3>
        <p className="text-sm font-medium text-slate-500 font-sans animate-pulse">
          {statusUpdates[statusIdx]}
        </p>
      </div>

      {/* Percentage Gauge */}
      <div className="max-w-xs mx-auto space-y-2">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[1px]">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 font-bold">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
            STAGING SECURE COMPILATION
          </span>
          <span className="text-slate-800 text-xs font-semibold">{progress}%</span>
        </div>
      </div>

      <div className="border-t border-slate-50 pt-5 text-left flex items-start gap-3.5 max-w-sm mx-auto bg-slate-50/50 p-4 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          OncoNavigator compiles criteria in client sandbox environments using local state hashes. Disclaimers: Non-diagnostic education reference only.
        </p>
      </div>

    </div>
  );
}
