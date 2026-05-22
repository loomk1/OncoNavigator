import React from "react";
import { CLINICAL_PRESETS } from "../data/presets";
import { PresetClinicalScenario, MedicalInputType } from "../types";
import { FileText, Image as ImageIcon, Sparkles, Activity } from "lucide-react";

interface PresetScenariosProps {
  onSelectScenario: (scenario: PresetClinicalScenario) => void;
  selectedId?: string;
}

export function PresetScenarios({ onSelectScenario, selectedId }: PresetScenariosProps) {
  const getInputIcon = (type: MedicalInputType) => {
    switch (type) {
      case MedicalInputType.BLOOD_REPORT:
        return <FileText className="h-3.5 w-3.5 text-rose-450" />;
      case MedicalInputType.CT_SCAN:
      case MedicalInputType.MRI_SCAN:
      case MedicalInputType.X_RAY:
        return <Activity className="h-3.5 w-3.5 text-teal-450" />;
      case MedicalInputType.SKIN_IMAGE:
        return <ImageIcon className="h-3.5 w-3.5 text-emerald-450" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getBadgeLabel = (type: MedicalInputType) => {
    switch (type) {
      case MedicalInputType.CT_SCAN: return "Chest CT";
      case MedicalInputType.MRI_SCAN: return "Cranial MRI";
      case MedicalInputType.SKIN_IMAGE: return "Derm Photo";
      case MedicalInputType.BLOOD_REPORT: return "CBC Lab Sheet";
      default: return "Report";
    }
  };

  return (
    <div className="bg-[#11141A] border border-slate-800 rounded-xl p-5 shadow-xs font-sans">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2 font-serif italic">
          <Sparkles className="h-4 w-4 text-teal-400" />
          Interactive Clinical Presets (Quick Simulator)
        </h3>
        <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-teal-500/20">
          Select to Preload
        </span>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
        If you do not have actual clinical reports or scans, click any preset case study to simulate how the multivariable analysis and screening routing system combinedly evaluates symptoms with specialized scan imagery.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CLINICAL_PRESETS.map((scenario) => {
          const isSelected = selectedId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`text-left p-3.5 rounded-xl border text-xs transition duration-200 cursor-pointer ${
                isSelected
                  ? "border-teal-500 bg-teal-500/10 shadow-xs ring-1 ring-teal-500/30 text-white"
                  : "border-slate-850 bg-slate-900/40 text-slate-300 hover:bg-slate-900/60 hover:border-slate-700 hover:shadow-xs"
              }`}
              id={`preset-btn-${scenario.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`font-semibold tracking-wide ${isSelected ? "text-teal-300 font-serif italic" : "text-slate-200"}`}>
                  {scenario.title}
                </span>
                <div className="flex gap-1 shrink-0">
                  {scenario.files.map((file) => (
                    <span
                      key={file.id}
                      className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] font-medium text-slate-300"
                    >
                      {getInputIcon(file.type)}
                      {getBadgeLabel(file.type)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
