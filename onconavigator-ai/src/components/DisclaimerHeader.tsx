import React from "react";
import { ShieldAlert } from "lucide-react";
import { Language, getTranslation } from "../utils/translations";

interface DisclaimerHeaderProps {
  lang: Language;
}

export function DisclaimerHeader({ lang }: DisclaimerHeaderProps) {
  return (
    <div className="bg-slate-55 border border-slate-100 rounded-2xl p-4 text-slate-600 max-w-4xl mx-auto mb-6 shadow-3xs transition-colors duration-200 text-left">
      <div className="flex items-start gap-3">
        <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0 mt-0.5 border border-blue-100">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-slate-800 uppercase font-sans">
            Educational Guidelines Simulation Protocol
          </h3>
          <p className="text-xs mt-1 text-slate-500 leading-relaxed">
            {getTranslation("disclaimerText", lang)}
          </p>
        </div>
      </div>
    </div>
  );
}
