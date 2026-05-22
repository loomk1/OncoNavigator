export enum MedicalInputType {
  CT_SCAN = "ct",
  MRI_SCAN = "mri",
  X_RAY = "xray",
  SKIN_IMAGE = "skin",
  BLOOD_REPORT = "blood",
  SYMPTOMS = "symptoms"
}

export interface MedicalFile {
  id: string;
  name: string;
  type: MedicalInputType;
  mimeType: string;
  dataUrl: string; // base64 data url
  textContent?: string; // extracted text (e.g., for blood report text)
}

export interface ScreeningRoute {
  cancerType: string;
  isPossible: boolean;
  reason: string;
}

export interface PreDetectedInput {
  name: string;
  type: MedicalInputType;
  status: string;
}

export interface PresetClinicalScenario {
  id: string;
  title: string;
  description: string;
  symptoms: string;
  files: MedicalFile[];
}

export interface OncologyAnalysis {
  detectedInputs: string[];
  selectedScreeningType: string;
  analysisText: string;
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
  nextSteps: string[];
  followUpQuestion: string;
  isCustomResponse?: boolean;
}
