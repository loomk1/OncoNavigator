// Educational clinical translation utility (English Only)

export type Language = "en";

export const translations = {
  appName: {
    en: "OncoNavigator"
  },
  appSubtitle: {
    en: "Educational Clinical Guidelines & Screening Companion"
  },
  disclaimerText: {
    en: "Notice: This assistant is an informational simulator. Screenings represent general oncology clinical reference standards and not diagnostic determinations. Always seek a doctor's advice."
  },
  // Tabs
  tabHome: {
    en: "Home Wizard"
  },
  tabUpload: {
    en: "Secure Upload"
  },
  tabChat: {
    en: "AI Q&A Assistant"
  },
  tabResults: {
    en: "Screening Results"
  },
  tabVault: {
    en: "Health Vault"
  },
  tabProfile: {
    en: "User Profile"
  },
  // Wizard Steps
  stepHeader: {
    en: "Step {step} of 6"
  },
  progressStep1: {
    en: "Upload Files"
  },
  progressStep2: {
    en: "Enter Symptoms"
  },
  progressStep3: {
    en: "Screenings Detected"
  },
  progressStep4: {
    en: "AI Follow-Up"
  },
  progressStep5: {
    en: "AI Analysis"
  },
  progressStep6: {
    en: "Results Summary"
  },
  // Step 1 UI
  step1Title: {
    en: "Secure Medical Document Upload"
  },
  step1Desc: {
    en: "Provide scans, lab reports, or CBC sheets. Files stay isolated in local browser parameters."
  },
  presetTitle: {
    en: "Or Try Pre-Loaded Case Studies"
  },
  buttonContinue: {
    en: "Continue to Symptoms"
  },
  // Step 2 UI
  step2Title: {
    en: "Describe Symptoms & Observations"
  },
  step2Placeholder: {
    en: "Write physical symptoms (e.g. skin mole texture, unexplained weight loss, persistent cough)..."
  },
  buttonContinueToScreen: {
    en: "Detect Available Screenings"
  },
  buttonBack: {
    en: "Back"
  },
  // Step 3 UI
  step3Title: {
    en: "AI-Detected Screening Pathways"
  },
  step3Desc: {
    en: "Based on your inputs, our clinical guidelines engine has matched the following screening paths. Select one to proceed:"
  },
  lungModel: {
    en: "Lung Cancer screening model"
  },
  lungDesc: {
    en: "USPSTF low-dose CT nodule evaluation criteria"
  },
  skinModel: {
    en: "Skin Cancer screening model"
  },
  skinDesc: {
    en: "Dermoscopy ABCDE mole index guidelines"
  },
  brainModel: {
    en: "Brain Tumor screening model"
  },
  brainDesc: {
    en: "Contrast cranial MRI voxels anomaly checks"
  },
  bloodModel: {
    en: "Blood Cancer screening model"
  },
  bloodDesc: {
    en: "Complete blood count & lymphocytic strain checks"
  },
  generalModel: {
    en: "General Health Well-being Triage"
  },
  generalDesc: {
    en: "Constitutional flags check and referral rules"
  },
  // Step 4 UI
  step4Title: {
    en: "AI Clarifying Medical Follow-Up"
  },
  step4Subtitle: {
    en: "Improving screening accuracy with quiet conversational checks."
  },
  placeholderFollowUp: {
    en: "Type your clinical response here..."
  },
  buttonNextQuestion: {
    en: "Next Diagnostic Question"
  },
  buttonSkipQuestions: {
    en: "Skip & Run Analysis Now"
  },
  // Step 5 UI
  step5Title: {
    en: "Analyzing Oncology Screening Indicators..."
  },
  step5Desc: {
    en: "Formulating your non-diagnostic clinical summary. Please allow a brief moment as guidelines are compiled..."
  },
  // Step 6 / Results UI
  resultTitle: {
    en: "Educational Risk Evaluation Result"
  },
  alertTitle: {
    en: "Assessed Risk Category"
  },
  explanationTitle: {
    en: "Clinician Guidance Reference"
  },
  nextStepTitle: {
    en: "Immediate Consult Recommendation"
  },
  buttonDetailedAnalysis: {
    en: "View Comprehensive Visualizer"
  },
  buttonStartAnother: {
    en: "Start New Assessment"
  },
  // Health Vault Tab
  vaultTitle: {
    en: "Personal Health Vault"
  },
  vaultSubtitle: {
    en: "Chronological, secure clinical reports store. All records remain localized on your sandboxed browser."
  },
  vaultPlaceholder: {
    en: "Search previously saved screenings (e.g. Skin, Lung, Medium)..."
  },
  vaultEmpty: {
    en: "No saved clinical reports found in this profile yet. Begin an instructional screen to track milestones."
  },
  riskHigh: {
    en: "High Risk Status"
  },
  riskMedium: {
    en: "Medium Risk Status"
  },
  riskLow: {
    en: "Low Risk Status"
  },
  buttonExportPDF: {
    en: "Export PDF"
  },
  buttonExportCSV: {
    en: "Export CSV"
  },
  headingMap: {
    en: "Anatomical Target Reference Viewport"
  },
  headingNextTitle: {
    en: "Suggested Follow-Up Diagnostics"
  },
  headingSelfQuery: {
    en: "AI Proactive Safety Check"
  },
  shareToast: {
    en: "Educational report reference link copied to clipboard successfully!"
  }
};

export function getTranslation(key: keyof typeof translations, _lang?: Language): string {
  return translations[key]?.["en"] || "";
}

export function translateReport(analysisText: string, _lang?: Language): string {
  return analysisText;
}
