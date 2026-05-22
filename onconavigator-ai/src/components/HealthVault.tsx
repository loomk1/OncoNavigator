import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Eye, 
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Database
} from "lucide-react";
import { SavedAssessment } from "./UserProfileSystem";
import { getTranslation, Language } from "../utils/translations";
import { ScanVisualizerHeatmap } from "./ScanVisualizerHeatmap";
import { exportToPDF, exportToCSV } from "../utils/exportHelpers";
import { auth, getCachedAccessToken, setCachedAccessToken } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { syncAssessmentsToGoogleSheet, getSavedSpreadsheetId, clearSavedSpreadsheetId } from "../utils/sheetsBackup";

interface HealthVaultProps {
  assessments: SavedAssessment[];
  onDelete: (id: string) => void;
  lang: Language;
}

export function HealthVault({ assessments, onDelete, lang }: HealthVaultProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Google Sheets Backup States
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    const savedId = getSavedSpreadsheetId();
    return savedId ? `https://docs.google.com/spreadsheets/d/${savedId}` : null;
  });
  const [hasToken, setHasToken] = useState<boolean>(() => !!getCachedAccessToken());

  const handleConnectGoogle = async () => {
    setBackupLoading(true);
    setBackupError(null);
    setBackupSuccess(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/spreadsheets");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setHasToken(true);
        setBackupSuccess("Google Sheets connected successfully! Press 'Synchronize' to run backup.");
      } else {
        throw new Error("No Google access token was returned from authorization popup.");
      }
    } catch (err: any) {
      console.error("Google Auth error in Vault:", err);
      setBackupError(err.message || "Failed to authenticate with Google Accounts.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleSyncToSheets = async () => {
    const token = getCachedAccessToken();
    if (!token) {
      setHasToken(false);
      setBackupError("Your Google registration token is missing or expired. Please authorize Google Sheets backup below.");
      return;
    }

    setBackupLoading(true);
    setBackupSuccess(null);
    setBackupError(null);

    try {
      const result = await syncAssessmentsToGoogleSheet(token, assessments);
      if (result.success && result.spreadsheetId && result.spreadsheetUrl) {
        setSpreadsheetUrl(result.spreadsheetUrl);
        setBackupSuccess(`Clinical Archive backup complete! Replicated ${assessments.length} assessments to Google Sheet.`);
      } else {
        throw new Error(result.error || "Spreadsheet synchronization failed.");
      }
    } catch (err: any) {
      console.error("Sheets synchronization failure:", err);
      setBackupError(err.message || "Failed to append rows to the Google Sheet.");
    } finally {
      setBackupLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((item) => {
    const matchesSearch = 
      item.cancerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.riskLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.explanation || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = riskFilter === "All" || item.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (risk: "Low" | "Medium" | "High") => {
    switch (risk) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Medium":
        return "bg-amber-50 text-amber-705 border-amber-100";
      default:
        return "bg-blue-50 text-blue-700 border-blue-105";
    }
  };

  const getRiskIndicator = (risk: "Low" | "Medium" | "High") => {
    switch (risk) {
      case "High":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
      case "Medium":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
      default:
        return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-3xs space-y-4">
        {/* Header Intro */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-55 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 leading-snug flex items-center gap-2">
              <ShieldCheck className="h-5.5 w-5.5 text-blue-600 animate-pulse" />
              <span>{getTranslation("vaultTitle", lang)}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-lg">
              {getTranslation("vaultSubtitle", lang)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start bg-slate-50 px-3 py-1.5 rounded-full border border-slate-150 text-[10px] uppercase font-mono text-slate-450 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Encrypted Ram Node</span>
          </div>
        </div>

        {/* Search and Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-7 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslation("vaultPlaceholder", lang)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-2xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 transition"
            />
          </div>
          <div className="sm:col-span-5 flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {(["All", "High", "Medium", "Low"] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition cursor-pointer ${
                    riskFilter === risk
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-150 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {risk === "All" ? "All" : risk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Backup & Cloud Vault Synchronizer Card */}
      <div className="bg-emerald-50/20 border border-emerald-100/80 rounded-3xl p-6 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-150/70 text-emerald-700 border border-emerald-200/55">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="text-left space-y-1">
              <h3 className="text-sm font-serif italic text-slate-900 font-semibold flex items-center gap-2">
                <span>Google Sheets Clinical Backup Portal</span>
                <span className="text-[8px] tracking-wider font-mono font-bold bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE BACKED</span>
              </h3>
              <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                Connect your institutional cloud workspace to replicate medical screens to Google Sheets. Backups support easy review, data sharing, and clinician audits.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap gap-2">
            {!hasToken ? (
              <button
                disabled={backupLoading}
                onClick={handleConnectGoogle}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-3xs hover:shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition"
              >
                {backupLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
                <span>Link Google Sheets</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={backupLoading || assessments.length === 0}
                  onClick={handleSyncToSheets}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-3xs hover:shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition"
                >
                  {backupLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  <span>Backup to Sheets</span>
                </button>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-3xs"
                  >
                    <ExternalLink className="h-3 w-3 text-emerald-600" />
                    <span>Open Backup Sheet</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    setHasToken(false);
                    setBackupSuccess(null);
                    setBackupError(null);
                  }}
                  className="px-2.5 py-2 text-slate-450 hover:text-rose-600 text-[10px] font-bold uppercase hover:bg-rose-50 rounded-lg transition"
                  title="Disconnect account access"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic feedback messages */}
        {(backupSuccess || backupError || backupLoading) && (
          <div className="p-3.5 bg-white border border-slate-100 rounded-2xl text-xs space-y-1.5">
            {backupLoading && (
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                <span className="animate-pulse">Connecting Google Drive, provisioning backing rows...</span>
              </div>
            )}
            
            {backupSuccess && (
              <div className="flex items-start gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold">{backupSuccess}</p>
                  {spreadsheetUrl && (
                    <p className="text-[11px] text-emerald-650 mt-1">
                      A spreadsheet named <strong className="underline">OncoNavigator Clinical Screenings Backup</strong> is active. You can find it in your Google Drive or{" "}
                      <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="underline font-bold inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-800">
                        open it directly here <ExternalLink className="h-2.5 w-2.5 inline" />
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {backupError && (
              <div className="flex items-start gap-2 text-rose-600">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold">Sync Protocol Interrupted</p>
                  <p className="text-[11px] text-rose-500 leading-relaxed">{backupError}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {getTranslation("vaultEmpty", lang)}
          </p>
        </div>
      ) : (
        <div className="relative border-l border-slate-150/60 ml-4 pl-6 md:pl-8 space-y-6">
          {filteredAssessments.map((entry, index) => {
            const isExpanded = expandedId === entry.id;
            const itemColors = getRiskColor(entry.riskLevel as "Low" | "Medium" | "High");
            const inputCount = entry.detectedInputsCount || 1;

            return (
              <div key={entry.id} className="relative group">
                {/* Timeline interactive pulse bead */}
                <div className="absolute -left-[31px] md:-left-[39px] top-6 w-3 h-3 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${getRiskIndicator(entry.riskLevel as "Low" | "Medium" | "High")}`} />
                </div>

                {/* Secure Card Item */}
                <div className="bg-white border border-slate-100 rounded-2xl hover:shadow-2xs transition-all duration-200 overflow-hidden">
                  
                  {/* Collapsed view banner trigger */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/40 select-none"
                  >
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 inline" />
                          {entry.timestamp || `May 21, ${currentYear}`}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${itemColors}`}>
                          {entry.riskLevel}
                        </span>
                      </div>
                      <h4 className="text-sm font-serif italic text-slate-900 font-semibold group-hover:text-blue-700 transition">
                        {entry.cancerType}
                      </h4>
                      <p className="text-xs text-slate-450 line-clamp-1">
                        <span className="font-semibold text-slate-500">Inputs:</span> {entry.symptoms}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-150">
                        {inputCount} {inputCount === 1 ? "input record" : "input records"}
                      </span>
                      <button className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail box */}
                  {isExpanded && (
                    <div className="border-t border-slate-50 bg-[#FCFAF7]/40 p-5 md:p-6 space-y-6 text-left animate-fade-in">
                      
                      {/* PDF CSV Print Controls */}
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-auto">
                          Record Management
                        </span>
                        <button
                          onClick={() => exportToPDF({
                            selectedScreeningType: entry.cancerType,
                            riskLevel: entry.riskLevel,
                            detectedInputs: [entry.symptoms],
                            analysisText: entry.analysisText,
                            explanation: entry.explanation,
                            nextSteps: entry.nextSteps,
                            followUpQuestion: entry.followUpQuestion
                          })}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-650 bg-white hover:bg-rose-50 border border-slate-200 px-3 py-1.5 rounded-lg transition"
                        >
                          <FileText className="h-3 w-3 text-rose-500" />
                          <span>{getTranslation("buttonExportPDF", lang)}</span>
                        </button>
                        <button
                          onClick={() => exportToCSV({
                            selectedScreeningType: entry.cancerType,
                            riskLevel: entry.riskLevel,
                            detectedInputs: [entry.symptoms],
                            analysisText: entry.analysisText,
                            explanation: entry.explanation,
                            nextSteps: entry.nextSteps,
                            followUpQuestion: entry.followUpQuestion
                          })}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-650 bg-white hover:bg-teal-50 border border-slate-200 px-3 py-1.5 rounded-lg transition"
                        >
                          <Trash2 className="h-3 w-3 text-teal-650" />
                          <span>{getTranslation("buttonExportCSV", lang)}</span>
                        </button>
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 bg-white border border-rose-200 px-3 py-1.5 rounded-lg transition"
                          title="Purge record permanently from RAM storage"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete Record</span>
                        </button>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1.5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                          {getTranslation("explanationTitle", lang)}
                        </h5>
                        <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl">
                          {entry.explanation}
                        </p>
                      </div>

                      {/* Detailed Staging Narrative */}
                      <div className="space-y-1.5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                          Analysis Staging Log
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          {entry.analysisText}
                        </p>
                      </div>

                      {/* Interactive Anatomical heatmaps corresponding to selected screening path */}
                      <ScanVisualizerHeatmap 
                        cancerType={entry.cancerType}
                        riskLevel={entry.riskLevel as "Low" | "Medium" | "High"}
                      />

                      {/* Rec Steps */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                          {getTranslation("nextStepTitle", lang)}
                        </h5>
                        <div className="space-y-1.5">
                          {entry.nextSteps.map((step, stepIdx) => (
                            <div key={stepIdx} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-blue-600 font-bold shrink-0">{stepIdx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reflection prompt */}
                      {entry.followUpQuestion && (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono mb-1">
                            {getTranslation("headingSelfQuery", lang)}
                          </h5>
                          <p className="text-xs text-slate-700 italic font-serif">
                            "{entry.followUpQuestion}"
                          </p>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
