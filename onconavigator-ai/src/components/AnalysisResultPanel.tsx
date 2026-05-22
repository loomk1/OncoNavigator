import React, { useState } from "react";
import { OncologyAnalysis } from "../types";
import { ScanVisualizerHeatmap } from "./ScanVisualizerHeatmap";
import { exportToPDF, exportToCSV } from "../utils/exportHelpers";
import { getTranslation, Language, translateReport } from "../utils/translations";
import { 
  FileText, 
  HelpCircle, 
  Compass, 
  Layers, 
  Share2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface AnalysisResultPanelProps {
  analysis: OncologyAnalysis;
  onCheckAnother: () => void;
  isLoading: boolean;
  lang: Language;
}

export function AnalysisResultPanel({
  analysis,
  onCheckAnother,
  isLoading,
  lang
}: AnalysisResultPanelProps) {
  const [showToast, setShowToast] = useState(false);

  const getRiskStyles = (risk: "Low" | "Medium" | "High") => {
    switch (risk) {
      case "Low":
        return {
          bg: "bg-blue-50/60 border-blue-105 text-blue-800",
          badge: "bg-blue-100 text-blue-600 border border-blue-200",
          accentColor: "border-blue-500",
          desc: "Low Estimated Priority — Basic indicators match observational benchmarks. Regular primary care visits recommended."
        };
      case "Medium":
        return {
          bg: "bg-amber-50/60 border-amber-100 text-amber-800",
          badge: "bg-amber-100 text-amber-700 border border-amber-200",
          accentColor: "border-amber-500",
          desc: "Medium Estimated Priority — Prominent risk indicators. Booking physical evaluation with your physician is advised."
        };
      case "High":
        return {
          bg: "bg-rose-50/60 border-rose-100 text-rose-800",
          badge: "bg-rose-100 text-rose-600 border border-rose-200",
          accentColor: "border-rose-500",
          desc: "High Estimated Priority — Distinct oncology criteria observed. Immediate specialist oncologist check advised."
        };
    }
  };

  const riskStyles = getRiskStyles((analysis.riskLevel || "Medium") as "Low" | "Medium" | "High");

  // Determine if multiple inputs were analyzed
  const isMultiInput = (analysis.detectedInputs || []).length > 1;

  const handleShareReport = () => {
    // Generate educational mock share URL and copy to clipboard
    const shareUrl = `${window.location.origin}/share/assessment/${Math.floor(Date.now() / 1000)}`;
    navigator.clipboard.writeText(shareUrl);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-3xs space-y-6">
      
      {/* Toast Alert popup for Share */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{getTranslation("shareToast", lang)}</span>
        </div>
      )}

      {/* Title & Type Chosen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-105 px-2.5 py-1 rounded-full">
            {getTranslation("resultTitle", lang)}
          </span>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mt-2 flex items-center gap-1.5 font-serif italic">
            <Compass className="h-4.5 w-4.5 text-blue-500" />
            {analysis.selectedScreeningType}
          </h3>
        </div>
        
        {/* Action Controls Group: Exports + Share */}
        <div className="flex flex-wrap items-center gap-1.5 self-start">
          <button
            onClick={() => exportToPDF({
              selectedScreeningType: analysis.selectedScreeningType,
              riskLevel: analysis.riskLevel || "Medium",
              detectedInputs: analysis.detectedInputs || ["Patient symptoms profile"],
              analysisText: analysis.analysisText,
              explanation: analysis.explanation,
              nextSteps: analysis.nextSteps,
              followUpQuestion: analysis.followUpQuestion
            })}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-650 hover:bg-rose-50 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            id="export-pdf-btn"
          >
            <FileText className="h-3.5 w-3.5 text-rose-500" />
            <span>{getTranslation("buttonExportPDF", lang)}</span>
          </button>

          <button
            onClick={handleShareReport}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-650 hover:bg-blue-50 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            id="share-pdf-btn"
          >
            <Share2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Share Report</span>
          </button>

          <button
            type="button"
            onClick={onCheckAnother}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-3xs hover:shadow-2xs"
            id="check-another-top-btn"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "12s" }} />
            <span>{getTranslation("buttonStartAnother", lang)}</span>
          </button>
        </div>
      </div>

      {/* --- 📊 DETECTED INPUTS --- */}
      <div className="text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-mono">
          <Layers className="h-3.5 w-3.5" />
          <span>📊 Captured Diagnostic Elements</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(analysis.detectedInputs || ["Constitutional Case Profile"]).map((input, idx) => (
            <div
              key={idx}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-650 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span>{input}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Combined Intelligence Callout if Multiple inputs loaded --- */}
      {isMultiInput && (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-xs font-sans text-left">
          <div className="flex items-start gap-2.5">
            <span className="text-base select-none">🧬</span>
            <div>
              <h5 className="font-semibold text-slate-800 font-serif italic">
                Combined Variable Intelligence Signal
              </h5>
              <p className="text-slate-450 mt-1 leading-relaxed">
                Because you provided multiple clinical parameters (like scan imagery, laboratory metrics, and symptoms details), our system correlates these to identify broader trends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- ⚠️ ESTIMATED RISK LEVEL BAR --- */}
      <div className={`p-5 rounded-2xl border ${riskStyles.bg} flex flex-col md:flex-row md:items-center justify-between gap-4 text-left`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${riskStyles.badge}`}>
              {getTranslation("alertTitle", lang)}
            </span>
            <span className="text-[10px] text-slate-450 italic font-medium">Educational Screening Simulation</span>
          </div>
          <p className="text-sm leading-relaxed font-bold text-slate-850 mt-1">
            Assessed Alert Priority:{" "}
            <strong className="text-base font-bold font-serif italic underline">
              {analysis.riskLevel} Risk
            </strong>
          </p>
          <p className="text-xs opacity-95 leading-normal text-slate-650">
            {riskStyles.desc}
          </p>
        </div>

        <div className="flex items-start gap-2 bg-white/60 border border-slate-150 p-3 rounded-xl text-[11px] md:max-w-xs shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-slate-500 font-medium leading-normal">
            <strong>Important Note:</strong> A low risk estimate never guarantees absolute absence of oncology path, and high risk does not prove it. Seek official clinical support.
          </p>
        </div>
      </div>

      {/* --- 🩺 ANATOMICAL RISK HEATMAP RADAR --- */}
      <div className="space-y-1 text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
          {getTranslation("headingMap", lang)}
        </h4>
        <ScanVisualizerHeatmap 
          cancerType={analysis.selectedScreeningType} 
          riskLevel={(analysis.riskLevel || "Medium") as "Low" | "Medium" | "High"} 
        />
      </div>

      {/* --- 🔍 DETAILED CLINICAL ANALYSIS --- */}
      <div className="text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
          {getTranslation("explanationTitle", lang)}
        </h4>
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans space-y-2">
          {analysis.analysisText ? (
            translateReport(analysis.analysisText, lang).split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))
          ) : (
            <p className="italic text-slate-400">Analysis metrics unavailable.</p>
          )}
        </div>
      </div>

      {/* --- 🧠 REASONING & EDUCATION EXPLANATION --- */}
      <div className="text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
          🧠 Screening Pathway Explanation & Logic
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed font-sans p-5 bg-slate-55 border border-slate-100 rounded-2xl">
          {translateReport(analysis.explanation || "", lang) || "Diagnostic logic processed successfully."}
        </p>
      </div>

      {/* --- 📍 MANDATED NEXT STEPS & CLINICAL TESTS --- */}
      <div className="text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-mono">
          {getTranslation("headingNextTitle", lang)}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Immediate Consultation Suggestion:
            </span>
            <ul className="space-y-2">
              {(analysis.nextSteps || []).slice(0, 1).map((step, idx) => (
                <li key={idx} className="text-xs text-slate-705 leading-relaxed flex items-start gap-1.5 group">
                  <span className="text-blue-600 mt-0.5 shrink-0">❖</span>
                  <span className="font-semibold text-slate-800 font-serif italic">{translateReport(step, lang)}</span>
                </li>
              ))}
              <li className="text-xs text-slate-500 leading-relaxed flex items-start gap-1.5 font-sans">
                <span className="text-slate-400 mt-0.5 shrink-0">❖</span>
                <span>Build a written catalog of relevant sensory symptoms duration.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 font-sans">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Primary Diagnostic Procedures Ordered:
            </span>
            <ul className="space-y-2">
              {(analysis.nextSteps || []).slice(1).map((step, idx) => (
                <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 shrink-0">❖</span>
                  <span>{translateReport(step, lang)}</span>
                </li>
              ))}
              {(!analysis.nextSteps || analysis.nextSteps.length <= 1) && (
                <li className="text-[11px] text-slate-400 italic">No specific procedural steps detected.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* --- 💬 STEP 6: DYNAMIC FOLLOW-UP PANEL --- */}
      <div className="border-t border-slate-100 pt-5 text-left">
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 text-xs font-sans">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-widest font-mono">
                {getTranslation("headingSelfQuery", lang)}
              </span>
              <p className="text-slate-800 font-semibold leading-relaxed font-serif italic text-sm">
                “{translateReport(analysis.followUpQuestion || "", lang) || "Are there secondary aspects like smoke exposures or significant sunburn elements?"}”
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onCheckAnother}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  id="followup-yes-btn"
                >
                  {getTranslation("buttonStartAnother", lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational disclaimer banner */}
      <div className="text-[10.5px] text-slate-400 leading-relaxed text-center border-t border-slate-50 pt-4 font-mono">
        {getTranslation("disclaimerText", lang)}
      </div>

    </div>
  );
}
