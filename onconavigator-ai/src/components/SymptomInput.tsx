import React from "react";
import { Plus } from "lucide-react";

interface SymptomInputProps {
  symptoms: string;
  onChangeSymptoms: (text: string) => void;
}

export function SymptomInput({ symptoms, onChangeSymptoms }: SymptomInputProps) {
  const QUICK_SYMPTOMS = [
    { text: "12-week persistent cough", category: "Lung" },
    { text: "Shortness of breath on mild exertion", category: "Lung" },
    { text: "Asymmetrical spot changing color", category: "Skin" },
    { text: "Intermittent morning headaches & nausea", category: "Brain" },
    { text: "Low-grade night sweats & weight loss", category: "Blood" },
    { text: "Swollen neck lymph node (painless)", category: "Blood" }
  ];

  const insertSymptom = (text: string) => {
    if (symptoms.trim() === "") {
      onChangeSymptoms(text);
    } else {
      onChangeSymptoms(symptoms.trim() + ", " + text);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto text-slate-800 font-sans transition-colors duration-200">
      
      <div className="space-y-1 text-center">
        <label className="block text-xs font-semibold text-slate-455 uppercase tracking-widest">
          Tell us what you are experiencing
        </label>
        <p className="text-[11px] text-slate-400">
          Briefly describe physical changes, cough durations, pain indexes or weight drops below
        </p>
      </div>

      <div className="relative">
        <textarea
          rows={3}
          value={symptoms}
          onChange={(e) => onChangeSymptoms(e.target.value)}
          placeholder="e.g. Dry dry cough since February, mild tiredness in mornings..."
          className="w-full text-xs p-4 bg-white border border-slate-202 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-800 placeholder-slate-450 leading-relaxed shadow-2xs transition"
        />
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-slate-400">
          {symptoms.length} characters
        </div>
      </div>

      {/* Suggested clinical scenarios */}
      <div className="space-y-1.5 pt-1">
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">
          Or tap a sample symptom to load
        </span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {QUICK_SYMPTOMS.map((item, idx) => (
            <button
               key={idx}
               type="button"
               onClick={() => insertSymptom(item.text)}
               className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-[11px] text-slate-600 transition cursor-pointer"
            >
              <Plus className="h-2.5 w-2.5 text-slate-400" />
              <span>{item.text}</span>
              <span className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-100 ml-1">
                {item.category}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
