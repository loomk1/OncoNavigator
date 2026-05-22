import { PresetClinicalScenario, MedicalInputType } from "../types";

export const CLINICAL_PRESETS: PresetClinicalScenario[] = [
  {
    id: "preset-lung",
    title: "Scenario A: Persistent Cough & Chest CT Scan",
    description: "An educational evaluation for a 52-year-old former smoker presenting with a persistent chest cough.",
    symptoms: "Mild progressive shortness of breath (dyspnea) and a dry, hacking cough for 12 weeks. History of smoking (15 pack-years, quit 5 years ago). No chest pain or hemoptysis.",
    files: [
      {
        id: "file-lung-ct",
        name: "Chest_CT_Scan_Report.jpg",
        type: MedicalInputType.CT_SCAN,
        mimeType: "image/jpeg",
        // A minimal, clean 1x1 pixel grey image block for standard base64 structure
        dataUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
      }
    ]
  },
  {
    id: "preset-skin",
    title: "Scenario B: Atypical Skin Lesion Inspection",
    description: "An educational check for an irregular asymmetrical mole on the right upper back.",
    symptoms: "Asymmetrical brown-black skin patch on the right shoulder. Has slightly changed in color and borders over the last 6 months. Mildly itchy but has never bled.",
    files: [
      {
        id: "file-skin-mole",
        name: "Lesion_Back_Shoulder.jpg",
        type: MedicalInputType.SKIN_IMAGE,
        mimeType: "image/jpeg",
        dataUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
      }
    ]
  },
  {
    id: "preset-blood",
    title: "Scenario C: Persistent Fatigue & CBC Panel",
    description: "An educational review of unexplained lethargy and a blood lab sheet with borderline markers.",
    symptoms: "Unexplained exhaustion, occasional night sweats, and minor pain-free swelling around neck lymph nodes for 4 weeks. No recent bacterial infections.",
    files: [
      {
        id: "file-blood-report",
        name: "Complete_Blood_Count_CBC.txt",
        type: MedicalInputType.BLOOD_REPORT,
        mimeType: "text/plain",
        dataUrl: "",
        textContent: `COMPLETE BLOOD COUNT (CBC) WITH DIFFERENTIAL
Patient: Educational Simulation
Marker                 Value       Ref Interval  Units
------------------------------------------------------
White Blood Cells (WBC)  14.2  [H]   (4.5-11.0)    x10^3/uL
Red Blood Cells (RBC)    3.90  [L]   (4.20-5.40)   x10^6/uL
Hemoglobin               11.5  [L]   (12.0-15.5)   g/dL
Platelets               145         (150-450)     x10^3/uL
Lymphocytes %            52.0  [H]   (20.0-44.0)   %
Monocytes %              9.0         (2.0-10.0)    %
Segmented Neutrophils    38.0  [L]   (40.0-70.0)   %
------------------------------------------------------
Remarks: Borderline lymphocytosis and mild anemia detected. Recommend clinic review.`
      }
    ]
  },
  {
    id: "preset-brain",
    title: "Scenario D: Morning Headaches & Cerebral MRI",
    description: "An educational routing for progressive sensory changes and a mock cranial MRI report.",
    symptoms: "Recurrent, progressive dull afternoon headaches for 2 months, often worst in the early morning. Sporadic nausea and occasional visual blurs.",
    files: [
      {
        id: "file-brain-mri",
        name: "Cerebral_MRI_T2_Contrast.jpg",
        type: MedicalInputType.MRI_SCAN,
        mimeType: "image/jpeg",
        dataUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
      }
    ]
  }
];
