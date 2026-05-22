import React from "react";
import { MedicalFile, MedicalInputType } from "../types";
import { 
  Dna, 
  HelpCircle, 
  CheckCircle, 
  ChevronRight, 
  Activity, 
  FolderHeart, 
  AlertCircle 
} from "lucide-react";

interface ScreeningRoutingPanelProps {
  uploadedFiles: MedicalFile[];
  symptoms: string;
  selectedCancerType: string;
  onSelectCancerType: (cancerType: string) => void;
  onSubmitAnalysis: () => void;
  isLoading: boolean;
}

export function ScreeningRoutingPanel({
  uploadedFiles,
  symptoms,
  selectedCancerType,
  onSelectCancerType,
  onSubmitAnalysis,
  isLoading
}: ScreeningRoutingPanelProps) {

  // --- STEP 1: INPUT DETECTION ---
  const hasSymptoms = symptoms.trim().length > 0;
  const hasCT = uploadedFiles.some((f) => f.type === MedicalInputType.CT_SCAN);
  const hasMRI = uploadedFiles.some((f) => f.type === MedicalInputType.MRI_SCAN);
  const hasXray = uploadedFiles.some((f) => f.type === MedicalInputType.X_RAY);
  const hasSkin = uploadedFiles.some((f) => f.type === MedicalInputType.SKIN_IMAGE);
  const hasBlood = uploadedFiles.some((f) => f.type === MedicalInputType.BLOOD_REPORT);

  const detectedInputsList: string[] = [];
  if (hasSymptoms) detectedInputsList.push("Symptom input detected");
  if (hasCT) detectedInputsList.push("Radiology input detected (Chest CT Scan)");
  if (hasMRI) detectedInputsList.push("Radiology input detected (Cranial MRI Scan)");
  if (hasXray) detectedInputsList.push("Radiology input detected (Chest X-Ray)");
  if (hasSkin) detectedInputsList.push("Dermatological Skin Image detected");
  if (hasBlood) detectedInputsList.push("Lab CBC report detected");

  // --- STEP 2: SCREENING ROUTING ---
  const possibleScreenings: { label: string; reason: string; active: boolean }[] = [];

  if (hasCT || hasXray) {
    possibleScreenings.push({
      label: "Lung Cancer Screening (LDCT-compatible)",
      reason: "Radiology scans (CT/X-ray) suggest chest low-dose imaging programs.",
      active: true
    });
  }
  if (hasSkin) {
    possibleScreenings.push({
      label: "Skin Cancer (Melanoma) Screening",
      reason: "Loaded dermatological skin photo supports atypical border/asymmetry dermoscopic review.",
      active: true
    });
  }
  if (hasMRI) {
    possibleScreenings.push({
      label: "Brain Tumor (Cranial Neurology) Screening",
      reason: "Cerebral MRI is the standard imaging routing to inspect potential intracranial changes.",
      active: true
    });
  }
  if (hasBlood) {
    possibleScreenings.push({
      label: "Blood Cancer Risk Screening (Leukemia / Lymphoma)",
      reason: "Complex CBC lab parameters (WBC, platelets, lymphs) provide foundational markers.",
      active: true
    });
  }

  // Fallback screening routing if no specific scans loaded but symptom outlined
  if (possibleScreenings.length === 0 && hasSymptoms) {
    possibleScreenings.push({
      label: "General Oncology Screening Routing",
      reason: "No active clinical imagings detected. Suggesting wellness assessments based on described symptoms.",
      active: true
    });
  }

  // Support checking screen routing inputs missing
  const missingInputs: string[] = [];
  if (!hasCT && !hasXray) missingInputs.push("Chest LDCT / X-ray Scan (for lung check)");
  if (!hasSkin) missingInputs.push("Active Dermatological Skin Photo (for melanoma check)");
  if (!hasMRI) missingInputs.push("Cerebral Contrast MRI Scan (for intracranial check)");
  if (!hasBlood) missingInputs.push("Complete CBC Blood Lab PDF/Txt metrics (for lymphatic check)");

  // --- STEP 3: USER CHOICE OPTIONS ---
  const CANCER_OPTIONS = [
    { id: "Lung Cancer", label: "Lung Cancer", icon: "🫁", desc: "For chronic cough, dyspnea, and LDCT chest reviews." },
    { id: "Skin Cancer", label: "Skin Cancer (Melanoma)", icon: "☀️", desc: "For atypical moles, shape changes, or border irregularities." },
    { id: "Brain Tumor", label: "Brain Tumor", icon: "🧠", desc: "For progressive early headaches, nausea, or cranial MRI." },
    { id: "Blood Cancer", label: "Blood Cancer (Leukemia)", icon: "🩸", desc: "For fatiguing night sweats, node swellings, or CBC charts." },
    { id: "General Assessment", label: "General Oncology Risk", icon: "🔬", desc: "For Constitutional/Multiple symptom profiles combined." }
  ];

  return (
    <div className="bg-[#11141A] border border-slate-800 rounded-xl p-5 shadow-xs font-sans space-y-5">
      {/* Dynamic Input Detection Header */}
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-white mb-2 flex items-center gap-2 font-serif italic">
          <Activity className="h-4 w-4 text-teal-400 animate-pulse" />
          Live Clinical Input Detection
        </h3>
        
        {detectedInputsList.length === 0 ? (
          <div className="text-xs text-slate-500 bg-slate-900/60 border border-slate-850 rounded-lg p-3 text-center">
            No diagnostic metrics inputted yet. Select an Interactive Clinical Preset above to test!
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 animate-fade-in">
            {detectedInputsList.map((input, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-teal-300 border border-teal-500/30 bg-teal-500/5 rounded-full font-medium"
              >
                <CheckCircle className="h-3 w-3 text-teal-400" />
                {input}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Screening Routes */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Suggested Actionable Screening Pathways:
        </h4>
        {possibleScreenings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Provide symptoms or upload dummy scanning files to configure actionable routes.
          </p>
        ) : (
          <div className="space-y-2">
            {possibleScreenings.map((path, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg text-xs animate-fade-in"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping shrink-0" />
                  <span className="font-bold text-slate-100 font-serif italic">{path.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-3">
                  {path.reason}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Informative advice on what additional information can be provided */}
        {detectedInputsList.length > 0 && missingInputs.length > 0 && (
          <div className="mt-3 bg-slate-900/30 border border-slate-850/75 rounded-lg p-2.5 text-[11px] text-slate-400">
            <div className="flex gap-1.5 items-start">
              <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Missing complimentary details: </span>
                To unlock deeper diagnostic routing, you may want to support this case with: {missingInputs.slice(0, 2).join(" or ")}.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- STEP 3: USER CHOICE SYSTEM --- */}
      <div className="border-t border-slate-800 pt-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Which cancer type would you like to check?
        </label>
        
        <div className="space-y-2">
          {CANCER_OPTIONS.map((opt) => {
            const isSelected = selectedCancerType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectCancerType(opt.id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition duration-200 cursor-pointer ${
                  isSelected
                    ? "border-teal-500 bg-teal-500/10 shadow-xs ring-1 ring-teal-500/30 text-white"
                    : "border-slate-850 bg-slate-900/20 hover:bg-slate-905 hover:border-slate-700 text-slate-300"
                }`}
                id={`screening-opt-btn-${opt.id}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 select-none mt-0.5">{opt.icon}</span>
                  <div>
                    <span className={`font-semibold tracking-wide ${isSelected ? "text-teal-300 font-serif italic" : "text-slate-200"}`}>
                      {opt.label}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analysis action button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmitAnalysis}
          disabled={isLoading || (uploadedFiles.length === 0 && !hasSymptoms)}
          className={`w-full py-3 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
            (uploadedFiles.length === 0 && !hasSymptoms)
              ? "bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed"
              : "bg-teal-500 text-slate-950 hover:bg-teal-400"
          }`}
          id="analyze-run-button"
        >
          {isLoading ? (
            <>
              <div className="animate-spin border-2 border-slate-950/20 border-t-slate-950 h-4.5 w-4.5 rounded-full shrink-0" />
              <span>Simulating Multimodal Intelligence Analysis...</span>
            </>
          ) : (
            <>
              <Dna className="h-4.5 w-4.5 shrink-0" />
              <span>Initiate Educational Analysis Routing & Check</span>
            </>
          )}
        </button>
        {(uploadedFiles.length === 0 && !hasSymptoms) && (
          <p className="text-[10px] text-slate-500 text-center mt-1.5">
            * Please enter custom symptoms or choose a Clinical Preset first to initiate.
          </p>
        )}
      </div>
    </div>
  );
}
