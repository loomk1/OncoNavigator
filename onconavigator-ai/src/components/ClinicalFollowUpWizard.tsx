import React, { useState } from "react";
import { MessageSquare, ArrowRight, ChevronRight } from "lucide-react";
import { getTranslation, Language } from "../utils/translations";

interface Question {
  id: string;
  text: string;
  options: string[];
}

// Interactive tailored follow-up question matrix based on target screening types
const CLINICAL_QUESTIONS: Record<string, Question[]> = {
  "Lung Cancer Screening": [
    {
      id: "lung_duration",
      text: "How long have you had this cough or similar respiratory discomfort?",
      options: ["Less than 2 weeks", "2 to 4 weeks", "More than a month", "Only in mornings"]
    },
    {
      id: "lung_smoking",
      text: "Do you have a personal history of smoking, or do you live/work in smoky atmospheres?",
      options: ["Yes, active smoker", "Former smoker (quit recently)", "Passive exposure only", "No history"]
    },
    {
      id: "lung_weight",
      text: "Have you experienced any sudden, unexplained physical weight loss recently?",
      options: ["Yes, lost over 10 lbs", "Minor change", "No changes at all"]
    },
    {
      id: "lung_family",
      text: "Do you have any family members who have been diagnosed with lung or chest oncology conditions?",
      options: ["Yes, immediate family", "Yes, extended relatives", "No family history", "Unsure / Adopted"]
    }
  ],
  "Skin Cancer Screening": [
    {
      id: "skin_first_notice",
      text: "When did you first notice this particular skin spots or moles changing?",
      options: ["Just within past weeks", "A few months ago", "It has been there for years", "Recently appeared out of nowhere"]
    },
    {
      id: "skin_abcde",
      text: "Does the spot look asymmetrical, have rugged borders, multiple colors, or exceed 6mm size?",
      options: ["Yes, has multiple of these traits", "Slightly irregular", "Looks completely symmetrical and uniform", "Unsure"]
    },
    {
      id: "skin_sunburn",
      text: "Have you ever experienced severe blistering sunburns or worked outdoors extensively without SPF protection?",
      options: ["Yes, multiple times", "Occasional sun exposure", "Never (always use sunscreen)", "Rarely go outdoors"]
    },
    {
      id: "skin_family",
      text: "Is there any history of melanoma skin conditions in your genetic family lines?",
      options: ["Yes, parent or sibling", "Yes, other relatives", "No known history"]
    }
  ],
  "Brain Tumor Screening": [
    {
      id: "brain_duration",
      text: "How long have you felt these specific pressure sensations or headaches?",
      options: ["Less than 2 weeks", "2 to 8 weeks", "Chronically for months", "Recent sudden onset"]
    },
    {
      id: "brain_nausea",
      text: "Do you experience persistent early morning headaches, dizziness, or vomiting feelings?",
      options: ["Yes, frequently in mornings", "Occasionally throughout physical routines", "No, never"]
    },
    {
      id: "brain_neurology",
      text: "Have you noticed localized coordination issues, speech slurs, or arm weakness?",
      options: ["Yes, occasionally noticeable", "Minor tingling only", "No neurologic changes at all"]
    },
    {
      id: "brain_family",
      text: "Do you have any family oncology records relating to nervous system or brain glioblastoma?",
      options: ["Yes", "No family records", "Unsure"]
    }
  ],
  "Blood Cancer Screening": [
    {
      id: "blood_fatigue",
      text: "Do you experience severe fatigue or weakness that doesn't go away after resting?",
      options: ["Yes, deeply exhausting", "Moderate, normal fatigues", "No, feeling fully energetic"]
    },
    {
      id: "blood_bruises",
      text: "Have you noticed any unexplained easy bruising, red skin spots, or gums bleeding?",
      options: ["Yes, bleeding gums or random spots", "Occasional mild bruises", "No, skin and blood clotting is healthy"]
    },
    {
      id: "blood_sweats",
      text: "Do you get regular low-level morning fevers or heavy drenching night sweats?",
      options: ["Yes, soaking night sweats", "Frequent small immune fevers", "No fevers or sweats"]
    },
    {
      id: "blood_lymph",
      text: "Have you noticed painless swollen lymph bumps around neck, armpit or groin?",
      options: ["Yes, noticeable small soft bumps", "None detected", "Unsure how to check"]
    }
  ],
  "General Assessment": [
    {
      id: "gen_weight_loss",
      text: "Have you experienced heavy, unexplained weight loss or severe appetite drops recently?",
      options: ["Yes, quite significant appetite changes", "Slight appetite change", "No changes"]
    },
    {
      id: "gen_fatigue",
      text: "Would you describe your general physical fatigue levels as constant or increasing?",
      options: ["Yes, chronic throughout daily tasks", "Mild, standard fatigue levels", "Healthy and optimal energetic levels"]
    },
    {
      id: "gen_family",
      text: "Do you have any primary relatives with history of complex oncology conditions?",
      options: ["Yes, parents or siblings", "Yes, grandparents/aunts", "No family records"]
    },
    {
      id: "gen_chemical",
      text: "Have you ever been exposed to industrial asbestos, radiation, organic solvents or heavy toxins?",
      options: ["Yes, in workplace environment", "Minimal home hobbies exposure only", "Never exposed to such elements"]
    }
  ]
};

interface ClinicalFollowUpWizardProps {
  cancerType: string;
  lang: Language;
  onFinish: (answersSummary: string) => void;
  onSkip: () => void;
}

export function ClinicalFollowUpWizard({ cancerType, lang, onFinish, onSkip }: ClinicalFollowUpWizardProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState("");

  // Get matching questions or fallback to general assessment
  const normalizedKey = CLINICAL_QUESTIONS[cancerType] ? cancerType : "General Assessment";
  const questionsList = CLINICAL_QUESTIONS[normalizedKey];
  const activeQuestion = questionsList[currentIdx];

  const handleSelectOption = (option: string) => {
    const updatedAnswers = { ...answers, [activeQuestion.id]: option };
    setAnswers(updatedAnswers);
    
    // Advance index or trigger finish
    if (currentIdx + 1 < questionsList.length) {
      setCurrentIdx(currentIdx + 1);
      setCustomInput("");
    } else {
      // Build visual consolidated string
      const answersSummary = Object.entries(updatedAnswers)
        .map(([id, ans]) => {
          const qText = questionsList.find(q => q.id === id)?.text || id;
          return `${qText}: ${ans}`;
        })
        .join("\n");
      onFinish(answersSummary);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleSelectOption(customInput.trim());
  };

  const progressPercent = Math.round(((currentIdx + 1) / questionsList.length) * 100);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-xl mx-auto shadow-3xs space-y-6 text-left">
      
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-105">
            {getTranslation("stepHeader", lang).replace("{step}", "4")}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {currentIdx + 1} / {questionsList.length}
          </span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-serif text-slate-900 leading-snug flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500 shrink-0" />
          <span>{getTranslation("step4Title", lang)}</span>
        </h3>
        <p className="text-xs text-slate-450 leading-relaxed">
          {getTranslation("step4Subtitle", lang)} <strong>({cancerType})</strong>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
          <span>{progressPercent}% Complete</span>
          <span>Guideline Assessment Node</span>
        </div>
      </div>

      {/* Primary Question Card */}
      <div className="bg-slate-50/70 border border-slate-100 p-6 rounded-2xl space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-serif font-bold text-xs shadow-inner shrink-0">
            AI
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Conversational Screening System</span>
            <p className="text-sm md:text-base font-serif text-slate-900 font-medium leading-relaxed">
              {activeQuestion.text}
            </p>
          </div>
        </div>

        {/* Option Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {activeQuestion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelectOption(opt)}
              className="p-3 text-xs text-left bg-white hover:bg-blue-55 border border-slate-150 hover:border-blue-400 rounded-xl font-sans transition cursor-pointer text-slate-700 font-medium hover:text-blue-800 shadow-3xs flex items-center justify-between"
            >
              <span>{opt}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 hover:text-blue-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text Area Input Field */}
      <form onSubmit={handleCustomSubmit} className="space-y-2">
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
          {getTranslation("placeholderFollowUp", lang)}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={getTranslation("placeholderFollowUp", lang)}
            className="flex-1 text-xs px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:border-blue-500 focus:outline-hidden focus:bg-white text-slate-800 transition"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-4 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      {/* Control buttons footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        {currentIdx > 0 ? (
          <button
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="px-4 py-2 text-xs text-slate-500 hover:text-slate-850 font-semibold cursor-pointer"
          >
            ← Previous Question
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onSkip}
          className="px-4 py-1 text-xs text-slate-400 hover:text-rose-600 font-bold cursor-pointer underline transition"
        >
          {getTranslation("buttonSkipQuestions", lang)}
        </button>
      </div>

    </div>
  );
}
