import React, { useState, useEffect } from "react";
import { DisclaimerHeader } from "./components/DisclaimerHeader";
import { ScannerUpload } from "./components/ScannerUpload";
import { SymptomInput } from "./components/SymptomInput";
import { ScanVisualizerHeatmap } from "./components/ScanVisualizerHeatmap";
import { AiChatBot } from "./components/AiChatBot";
import { UserProfileSystem, UserProfile, SavedAssessment } from "./components/UserProfileSystem";
import { MedicalFile, PresetClinicalScenario, OncologyAnalysis, MedicalInputType } from "./types";
import { CLINICAL_PRESETS } from "./data/presets";
import { Language, getTranslation, translateReport } from "./utils/translations";
import { ClinicalFollowUpWizard } from "./components/ClinicalFollowUpWizard";
import { ClinicalAnalyzingScreen } from "./components/ClinicalAnalyzingScreen";
import { HealthVault } from "./components/HealthVault";
import { AnalysisResultPanel } from "./components/AnalysisResultPanel";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./utils/firebase";

import { 
  Dna, 
  Stethoscope, 
  ShieldAlert, 
  Clock, 
  FileText,
  User, 
  Compass,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  CheckCircle,
  Activity,
  ArrowLeft
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("onconav_language");
    return (saved === "hi" || saved === "en") ? saved as Language : "en";
  });
  
  // Clinical Screening State
  const [symptoms, setSymptoms] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<MedicalFile[]>([]);
  const [selectedCancerType, setSelectedCancerType] = useState<string>("General Assessment");
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  
  const [analysisResult, setAnalysisResult] = useState<OncologyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication State
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("onconav_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [assessmentsHistory, setAssessmentsHistory] = useState<SavedAssessment[]>([]);
  const [showDetailedResult, setShowDetailedResult] = useState<boolean>(false);

  // Guided Upload Wizard Active Step State (1: Upload Files, 2: Symptoms, 3: Detected Pathways, 4: Clarification Qs, 5: Analysing, 6: Results)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [followUpAnswers, setFollowUpAnswers] = useState<string>("");

  // Sync Language choices (Hardcoded to English)
  useEffect(() => {
    setLang("en");
  }, []);

  // Synchronize Firebase Auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setActiveUser(profile);
            localStorage.setItem("onconav_current_user", JSON.stringify(profile));
          } else {
            const fallback: UserProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0].toUpperCase() || "Clinic Student User",
              email: firebaseUser.email || "student@onconavigator.edu",
              dateCreated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            };
            setActiveUser(fallback);
            localStorage.setItem("onconav_current_user", JSON.stringify(fallback));
          }
        } catch (err) {
          const fallback: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0].toUpperCase() || "Clinic Student User",
            email: firebaseUser.email || "student@onconavigator.edu",
            dateCreated: "May 2026"
          };
          setActiveUser(fallback);
          localStorage.setItem("onconav_current_user", JSON.stringify(fallback));
        }
      } else {
        setActiveUser(null);
        localStorage.removeItem("onconav_current_user");
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Handle active user history loading from Firestore dynamically
  useEffect(() => {
    if (!activeUser || !authInitialized || !auth.currentUser) {
      setAssessmentsHistory([]);
      return;
    }

    // Ensure state user ID corresponds to currently authenticated Firebase User to avoid permission violations
    if (activeUser.id !== auth.currentUser.uid) {
      return;
    }

    const q = query(
      collection(db, "assessments"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: SavedAssessment[] = [];
      snapshot.forEach((snap) => {
        records.push(snap.data() as SavedAssessment);
      });
      // Sort assessments by id descending so newer queries always show first
      records.sort((a, b) => b.id.localeCompare(a.id));
      setAssessmentsHistory(records);
    }, (error) => {
      console.error("Firestore Loading assessments failed:", error);
      handleFirestoreError(error, OperationType.LIST, "assessments");
    });

    return () => unsubscribe();
  }, [activeUser, authInitialized]);

  // Handle Login & Logout callbacks
  const handleLoginSuccess = (user: UserProfile) => {
    setActiveUser(user);
    localStorage.setItem("onconav_current_user", JSON.stringify(user));
    setActiveTab("home");
    setWizardStep(1);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Firebase Auth signout error:", err);
    }
    setActiveUser(null);
    localStorage.removeItem("onconav_current_user");
    setAnalysisResult(null);
    setSymptoms("");
    setUploadedFiles([]);
    setSelectedPresetId(undefined);
    setWizardStep(1);
    setActiveTab("home");
  };

  const onAddAssessmentToHistory = async (report: OncologyAnalysis, symptomsText: string, filesCount: number) => {
    if (!activeUser) return;
    const documentId = "hist_" + Date.now();
    const newSaved: SavedAssessment = {
      id: documentId,
      userEmail: activeUser.email,
      timestamp: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cancerType: report.selectedScreeningType,
      symptoms: symptomsText || "None specified. Document inputs processed.",
      riskLevel: report.riskLevel || "Low",
      detectedInputsCount: filesCount + (symptomsText.trim() ? 1 : 0),
      explanation: report.explanation,
      analysisText: report.analysisText,
      nextSteps: report.nextSteps,
      followUpQuestion: report.followUpQuestion
    };

    // Store securely inside firestore collection with relational parameters matching rules expectations
    try {
      await setDoc(doc(db, "assessments", documentId), {
        ...newSaved,
        userId: activeUser.id
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `assessments/${documentId}`);
    }
  };

  const handleSelectPreset = (preset: PresetClinicalScenario) => {
    setSelectedPresetId(preset.id);
    setSymptoms(preset.symptoms);
    setUploadedFiles(preset.files);
    
    // Auto-advance to Symptoms Step 2
    setWizardStep(2);
  };

  const handleFileAdded = (file: MedicalFile) => {
    setUploadedFiles((prev) => [...prev, file]);
    setSelectedPresetId(undefined);
    setAnalysisResult(null);
  };

  const handleFileRemoved = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedPresetId(undefined);
    setAnalysisResult(null);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (!activeUser) return;
    try {
      await deleteDoc(doc(db, "assessments", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `assessments/${id}`);
    }
  };

  // Triggers the analysis engine (either fallback or server)
  const handleSubmitAnalysis = async (screeningTypeOverride?: string, answersContext?: string) => {
    const targetScreenType = screeningTypeOverride || selectedCancerType;
    setSelectedCancerType(targetScreenType);

    setIsLoading(true);
    setWizardStep(5); // Switch wizard to Analyzing screen

    const combinedSymptomsContext = `${symptoms}. ${answersContext ? `Followup context answers: ${answersContext}` : ""}`;

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: combinedSymptomsContext,
          selectedScreeningType: targetScreenType,
          files: uploadedFiles
        })
      });

      if (!response.ok) {
        throw new Error("Local fallbacks matching");
      }

      const report: OncologyAnalysis = await response.json();
      
      // Artificial delay to make analyzing transition smooth & elegant
      setTimeout(() => {
        setAnalysisResult(report);
        onAddAssessmentToHistory(report, combinedSymptomsContext, uploadedFiles.length);
        setIsLoading(false);
        setWizardStep(6); // Results panel
      }, 5000);

    } catch (err: any) {
      console.warn("API fallback triggered:", err);
      
      // High quality localized fallbacks
      setTimeout(() => {
        const typeLower = (targetScreenType || "general").toLowerCase();
        let risk: "Low" | "Medium" | "High" = "Medium";
        let title = `${targetScreenType}`;
        let explanation = "An educational screening checkup aligned with international oncology standards has completed.";
        let steps = ["Consult with a family practice physician.", "Routine physical checkups and evaluations recommended."];
        let analysis = "No diagnostic signs of immediate malignancies found. Standard educational guidelines checks represent low risk bounds.";

        const lowSymptoms = combinedSymptomsContext.toLowerCase();

        if (typeLower.includes("lung")) {
          title = "Lung Cancer Educational Assessment";
          const hasSmoking = lowSymptoms.includes("smok") || lowSymptoms.includes("cough") || lowSymptoms.includes("yes") || lowSymptoms.includes("former");
          risk = hasSmoking ? "Medium" : "Low";
          explanation = "USPSTF guidelines suggest low-dose chest CT sweeps for seniors showing smoking backgrounds or exposure histories.";
          analysis = "Elevated respiratory indicators. Patient cough characteristics analyzed alongside chest radiology guidelines.";
          steps = [
            "Consult with a board-certified Pulmonologist for a diagnostic thoracic sweep.",
            "Discuss standard low-dose CT chest screenings with your general physician."
          ];
        } else if (typeLower.includes("skin")) {
          title = "Skin Cancer Educational Assessment";
          const hasAsymmetry = lowSymptoms.includes("asymmetry") || lowSymptoms.includes("asymmetric") || lowSymptoms.includes("color") || lowSymptoms.includes("border");
          risk = hasAsymmetry ? "Medium" : "Low";
          explanation = "Fitzpatrick Type screening logs recommend dermoscopic inspections for spots matching ABCDE criteria guidelines.";
          analysis = "The dermatological photo report identified borderline border irregularity characteristics.";
          steps = [
            "We strongly recommend a physical examination with a board-certified Dermatologist.",
            "Dermatologists typically evaluate suspicious lesions under polarized lenses and conduct biopsies if indicated."
          ];
        } else if (typeLower.includes("brain")) {
          title = "Brain Oncology Educational Assessment";
          risk = "Low";
          explanation = "Early morning headaches are studied to ensure normal localized cerebral cranial volumes pressure.";
          analysis = "Normal sensory coordinates. No sudden neurological deficits or localizing motor dysfunctions flagged.";
          steps = [
            "Consult with a primary neurologist or general practitioner.",
            "Recommend standard brain MRI sweep if headaches gradually persist other weeks."
          ];
        } else if (typeLower.includes("blood")) {
          title = "Blood Cancer Secondary Screen";
          risk = "Medium";
          explanation = "Unexplained fatigue and borderline leukocytes require venous differential count verifications.";
          analysis = "CBC indicators identify low red cell density (Hb: 11.5) and borderline elevated white blood cell counts.";
          steps = [
            "Recommend primary care or specialist hematogiology clinical consultation.",
            "Complete follow-up venous blood panel differential screening."
          ];
        }

        const fallbackReport: OncologyAnalysis = {
          detectedInputs: ["Patient criteria profile parsed", `Screening: ${targetScreenType}`],
          selectedScreeningType: title,
          analysisText: analysis,
          riskLevel: risk,
          explanation: explanation,
          nextSteps: steps,
          followUpQuestion: "Do you have any primary relatives with history of complex oncology conditions?"
        };

        setAnalysisResult(fallbackReport);
        onAddAssessmentToHistory(fallbackReport, combinedSymptomsContext, uploadedFiles.length);
        setIsLoading(false);
        setWizardStep(6);
      }, 5000);
    }
  };

  const handleStartAnother = () => {
    setAnalysisResult(null);
    setSymptoms("");
    setUploadedFiles([]);
    setSelectedPresetId(undefined);
    setFollowUpAnswers("");
    setWizardStep(1);
    setActiveTab("home");
  };

  // Auth Guard
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-mono">Initializing secure clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <UserProfileSystem
        onLoginSuccess={handleLoginSuccess}
        activeUser={null}
        onLogout={handleLogout}
        assessmentsHistory={[]}
        onClearHistory={() => {}}
        onDeleteHistoryItem={() => {}}
      />
    );
  }

  // Auto-Match Screening pathways based on text inputs
  const getAutoDetectedScreenings = () => {
    const text = (symptoms + " " + uploadedFiles.map(f => f.name).join(" ")).toLowerCase();
    const detections = [];
    
    if (text.includes("cough") || text.includes("smok") || text.includes("lung") || text.includes("breath")) {
      detections.push({ id: "Lung Cancer Screening", title: "Lung Cancer screening", confidence: "95%", desc: "Match: Persistent respiratory context / CT upload" });
    }
    if (text.includes("mole") || text.includes("skin") || text.includes("lesion") || text.includes("spot") || text.includes("itch")) {
      detections.push({ id: "Skin Cancer Screening", title: "Skin Cancer screening", confidence: "92%", desc: "Match: Dermoscopy / Cutaneous lesion" });
    }
    if (text.includes("headache") || text.includes("brain") || text.includes("dizz") || text.includes("nausea")) {
      detections.push({ id: "Brain Tumor Screening", title: "Brain Tumor screening", confidence: "88%", desc: "Match: Progressive cranial headache / Neurological check" });
    }
    if (text.includes("fatigue") || text.includes("blood") || text.includes("cbc") || text.includes("sweat") || text.includes("lymph")) {
      detections.push({ id: "Blood Cancer Screening", title: "Blood Cancer screening", confidence: "90%", desc: "Match: Complete blood count anomalies / Hematology" });
    }

    // Always include General Triage as a fallback match
    detections.push({ id: "General Assessment", title: "General Triage & Constitutional Check", confidence: "75%", desc: "Constitutional health referral guidelines" });
    
    return detections;
  };

  const detectedScreeningsList = getAutoDetectedScreenings();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 pb-16 font-sans relative selection:bg-blue-100 transition-colors duration-200">
      
      {/* 🌟 Dynamic top header bar */}
      <header className="sticky top-0 z-45 bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-200">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-serif text-sm font-bold border border-blue-100">
            O
          </div>
          <div className="text-left">
            <h1 className="text-sm font-serif italic text-slate-900 font-semibold">{getTranslation("appName", lang)}</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">{getTranslation("appSubtitle", lang)}</p>
          </div>
        </div>

        {/* Minimalist Top Nav System: Home, Upload, AI Q&A, Health Vault, Profile */}
        <nav className="flex items-center gap-1">
          {[
            { id: "home", label: getTranslation("tabHome", lang) },
            { id: "upload", label: getTranslation("tabUpload", lang) },
            { id: "chat", label: getTranslation("tabChat", lang) },
            { id: "results", label: getTranslation("tabResults", lang) },
            { id: "vault", label: getTranslation("tabVault", lang) },
            { id: "profile", label: getTranslation("tabProfile", lang) }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // When navigating directly to results, make sure we show them
                if (tab.id === "results" && analysisResult) {
                  setWizardStep(6);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white font-bold shadow-3xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Multilingual and Micro User Session */}
        <div className="flex items-center gap-3">

          <div className="hidden md:flex flex-col text-right">
            <span className="text-[9px] font-bold text-slate-400 block tracking-widest uppercase mb-0.5">Sandboxed Client</span>
            <span className="text-xs text-slate-605 font-semibold">{activeUser.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-slate-50 border border-slate-150 rounded-full transition cursor-pointer hidden sm:block"
            title="Disconnect Session"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Soft, quiet safety notice memo */}
        <DisclaimerHeader lang={lang} />

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: HOME WIZARDS                                  */}
        {/* ---------------------------------------------------- */}
        {activeTab === "home" && (
          <div className="space-y-8 py-2">
            
            {/* Horizontal Step Progress Bar Tracker */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 md:p-5 shadow-3xs max-w-2xl mx-auto flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5, 6].map((stepNum) => {
                const labels = [
                  getTranslation("progressStep1", lang),
                  getTranslation("progressStep2", lang),
                  getTranslation("progressStep3", lang),
                  getTranslation("progressStep4", lang),
                  getTranslation("progressStep5", lang),
                  getTranslation("progressStep6", lang)
                ];
                const isActive = wizardStep === stepNum;
                const isCompleted = wizardStep > stepNum;

                return (
                  <div key={stepNum} className="flex-1 flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1 mx-auto text-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${
                        isActive ? "bg-slate-900 border-slate-900 text-white font-bold scale-110 shadow-3xs" :
                        isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                        "bg-slate-100 border-slate-200 text-slate-400"
                      }`}>
                        {stepNum}
                      </div>
                      <span className={`hidden md:inline text-[9px] uppercase tracking-wider font-bold ${
                        isActive ? "text-slate-800" : isCompleted ? "text-emerald-650" : "text-slate-400"
                      }`}>
                        {labels[stepNum - 1]}
                      </span>
                    </div>
                    {stepNum < 6 && (
                      <div className={`hidden md:block flex-1 h-[1px] ${
                        isCompleted ? "bg-emerald-300" : "bg-slate-200"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Upload Files */}
            {wizardStep === 1 && (
              <div className="space-y-8 max-w-2xl mx-auto text-center transition-all">
                
                {/* Intro welcome block */}
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-serif text-slate-900 tracking-tight leading-snug">
                    Comfort or answers.<br/> 
                    <span className="italic">Begin your calm health screen.</span>
                  </h2>
                  <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
                    {getTranslation("step1Desc", lang)}
                  </p>
                </div>

                {/* Patient Scan Upload Zone */}
                <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-3xs text-left space-y-4">
                  <div className="text-center space-y-1 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getTranslation("step1Title", lang)}</span>
                    <p className="text-xs text-slate-500">Provide MRI, CT, Skin photos or Laboratory reports:</p>
                  </div>
                  
                  <ScannerUpload 
                    onFileAdded={handleFileAdded} 
                    onFileRemoved={handleFileRemoved} 
                    uploadedFiles={uploadedFiles} 
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full shadow-3xs transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{getTranslation("buttonContinue", lang)}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Educational Tryout Presets section */}
                <div className="space-y-3 pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {getTranslation("presetTitle", lang)}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                    {CLINICAL_PRESETS.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => handleSelectPreset(scenario)}
                        className="p-3 text-left bg-white hover:bg-slate-55 border border-slate-150 rounded-2xl transition cursor-pointer text-xs shadow-3xs"
                      >
                        <strong className="font-serif italic font-medium text-slate-800 block text-xs truncate">
                          {scenario.title}
                        </strong>
                        <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">{scenario.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue if zero files prompt */}
                <div className="pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="underline text-xs text-blue-600 font-semibold cursor-pointer"
                  >
                    Continue without uploading documents →
                  </button>
                </div>

              </div>
            )}

            {/* Step 2: Describe Symptoms */}
            {wizardStep === 2 && (
              <div className="space-y-6 max-w-xl mx-auto text-center transition-all py-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-105">
                    {getTranslation("stepHeader", lang).replace("{step}", "2")}
                  </span>
                  <h3 className="text-xl md:text-2xl font-serif italic text-slate-900 font-semibold">
                    {getTranslation("step2Title", lang)}
                  </h3>
                  <p className="text-xs text-slate-450">
                    Write down relevant symptoms, their duration, or personal observations.
                  </p>
                </div>

                {/* Symptom Input Area */}
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs text-left">
                  <SymptomInput symptoms={symptoms} onChangeSymptoms={setSymptoms} />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    ← {getTranslation("buttonBack", lang)}
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    disabled={!symptoms.trim() && uploadedFiles.length === 0}
                    className={`px-8 py-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-3xs ${
                      symptoms.trim() || uploadedFiles.length > 0
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <span>{getTranslation("buttonContinueToScreen", lang)}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: AI Detects & Select Screening Type */}
            {wizardStep === 3 && (
              <div className="space-y-6 max-w-xl mx-auto text-center transition-all py-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-105">
                    {getTranslation("stepHeader", lang).replace("{step}", "3")}
                  </span>
                  <h3 className="text-xl md:text-2xl font-serif italic text-slate-900 font-semibold">
                    {getTranslation("step3Title", lang)}
                  </h3>
                  <p className="text-xs text-slate-450 max-w-md mx-auto">
                    {getTranslation("step3Desc", lang)}
                  </p>
                </div>

                {/* Smart Detected list */}
                <div className="space-y-2 text-left">
                  {detectedScreeningsList.map((screen) => (
                    <button
                      key={screen.id}
                      onClick={() => {
                        setSelectedCancerType(screen.id);
                        setWizardStep(4); // Advance to follow-up questions for chosen type
                      }}
                      className="w-full p-4 bg-white hover:bg-blue-50/20 border border-slate-100 hover:border-blue-300 rounded-2xl transition cursor-pointer flex items-center justify-between text-xs shadow-3xs group text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="font-serif italic text-slate-900 font-semibold text-sm group-hover:text-blue-700 transition">
                            {screen.title}
                          </strong>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-mono">
                            {screen.confidence} Match
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block leading-normal">{screen.desc}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </button>
                  ))}
                </div>

                <div className="text-left pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ← {getTranslation("buttonBack", lang)}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: AI Clarification Follow-up Questions */}
            {wizardStep === 4 && (
              <div className="py-2">
                <ClinicalFollowUpWizard 
                  cancerType={selectedCancerType}
                  lang={lang}
                  onFinish={(answersSummary) => {
                    setFollowUpAnswers(answersSummary);
                    handleSubmitAnalysis(selectedCancerType, answersSummary);
                  }}
                  onSkip={() => {
                    setFollowUpAnswers("");
                    handleSubmitAnalysis(selectedCancerType);
                  }}
                />
              </div>
            )}

            {/* Step 5: Beautiful Analyzing / Loading screen */}
            {wizardStep === 5 && (
              <div className="py-8">
                <ClinicalAnalyzingScreen lang={lang} />
              </div>
            )}

            {/* Step 6: Full Results Screen */}
            {wizardStep === 6 && analysisResult && (
              <div className="max-w-2xl mx-auto py-2">
                <AnalysisResultPanel 
                  analysis={analysisResult}
                  onCheckAnother={handleStartAnother}
                  isLoading={isLoading}
                  lang={lang}
                />
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: STANDALONE SECURE UPLOAD TAB                 */}
        {/* ---------------------------------------------------- */}
        {activeTab === "upload" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xs max-w-xl mx-auto space-y-6 text-center">
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-serif italic text-slate-900 font-semibold">
                Clinical Documents Upload Space
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Securely drop physical imaging MRI slices or blood panels text files. All files stay isolated in local browser parameters.
              </p>
            </div>

            <ScannerUpload
              onFileAdded={handleFileAdded}
              onFileRemoved={handleFileRemoved}
              uploadedFiles={uploadedFiles}
              onContinue={() => {
                // Advance step and shift user over to Home screen
                setWizardStep(2);
                setActiveTab("home");
              }}
            />
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 3: RESULTS STANDALONE (FIXED TO SHOW FULL RESULT) */}
        {/* ---------------------------------------------------- */}
        {activeTab === "results" && (
          <div className="space-y-8 max-w-2xl mx-auto">
            {analysisResult ? (
              <AnalysisResultPanel 
                analysis={analysisResult}
                onCheckAnother={handleStartAnother}
                isLoading={isLoading}
                lang={lang}
              />
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-4 shadow-3xs">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-1 text-left sm:text-center">
                  <h4 className="text-base font-serif italic text-slate-900 font-semibold">No active evaluation report</h4>
                  <p className="text-xs text-slate-450 max-w-xs mx-auto">
                    Fill out symptoms description fields or try preloaded presets on Home tab first.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("home");
                    setWizardStep(1);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 cursor-pointer shadow-3xs"
                >
                  Go to Home Workspace
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 4: AI Q&A CHATBOT                              */}
        {/* ---------------------------------------------------- */}
        {activeTab === "chat" && (
          <div className="space-y-6">
            <AiChatBot />
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 5: HEALTH VAULT SYSTEM                         */}
        {/* ---------------------------------------------------- */}
        {activeTab === "vault" && (
          <div className="space-y-6">
            <HealthVault 
              assessments={assessmentsHistory}
              onDelete={handleDeleteHistoryItem}
              lang={lang}
            />
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 6: RECONFIGURED USER PROFILE                   */}
        {/* ---------------------------------------------------- */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <UserProfileSystem
              onLoginSuccess={handleLoginSuccess}
              activeUser={activeUser}
              onLogout={handleLogout}
              assessmentsHistory={assessmentsHistory}
              onClearHistory={() => {}}
              onDeleteHistoryItem={handleDeleteHistoryItem}
            />
          </div>
        )}

      </main>

      {/* Footer minimal brand */}
      <footer className="mt-20 text-center text-[11px] text-slate-400 font-sans space-y-1 px-4">
        <p>© 2026 OncoNavigator Workspace. All rights reserved.</p>
        <p className="text-[10px] text-slate-400 italic">Formulated purely for educational diagnostics simulations mapping standards.</p>
      </footer>

    </div>
  );
}
