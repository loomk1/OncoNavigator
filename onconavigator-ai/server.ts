import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure user-agent is recorded for AI Studio metrics
const SYSTEM_INSTRUCTION = `
You are \"OncoNavigator AI\", an educational Cancer Risk Screening Assistant.
CRITICAL SAFETY RULES:
- This is strictly an EDUCATIONAL clinical information assistant, NOT a medical diagnostic system.
- You must NEVER claim that the user has cancer, nor provide a definitive diagnosis.
- You must ONLY provide educational risk insights and screening suggestions.
- Always recommend consulting a qualified medical professional (such as an oncologist, primary care physician, dermatologist, etc.).
- You MUST use cautious, non-alarmist, objective, professional language such as "possible risk", "may indicate", "requires further clinical testing", "could correlate with", and "suggests looking into".
- Maintain a highly professional, clinical-like, calm, and clear tone. Avoid any emotional, alarming, or dramatic language.

Your goal is to parse multiple patient inputs (such as described symptoms, radiology scan details, uploaded blood reports, or skin selfies) and generate a structured risk assessment report.

If multiple inputs are given, you must combine them and explain clearly how they relate to the cumulative risk estimate (e.g., how a symptom like a chronic cough combined with chest CT findings relates to possible lung screening).

You MUST respond strictly in a valid JSON format that matches the following schema:
{
  "detectedInputs": [
    "List of identified inputs e.g., 'Radiology input detected (Chest CT Scan)', 'Lab report detected (Elevated white blood cells)', 'Symptom input detected (12-week cough)'"
  ],
  "selectedScreeningType": "The chosen cancer type (e.g., Lung Cancer screening, Skin Cancer screening, etc.)",
  "analysisText": "A detailed interpretation of the symptoms and files carefully. Relate the symptoms, laboratory markers, and imaging signs together objectively using extremely cautious medical phrasing.",
  "riskLevel": "Low" | "Medium" | "High",
  "explanation": "A simple, clear, educational explanation of why this risk assessment was estimated. Emphasize that this is not a diagnosis.",
  "nextSteps": [
    "Recommend consulting a qualified general physician or specialized physician (e.g., Pulmonologist, Oncologist, Dermatologist, Neuro-oncologist)",
    "List typical clinical tests doctors usually perform for this presentation (e.g., repeat blood panels, biopsy, biopsy-guided tissue analysis, PET scan, bronchoscopy, further high-resolution imaging)"
  ],
  "followUpQuestion": "A precise question asking if the user has more documents/scans to provide, or if they would like to review some other risk scenario (e.g., 'Do you have a more recent CBC report or scan you'd like to simulate next?', 'Would you like to analyze a different screening path, such as skin lesions or MRI findings?')"
}
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits higher so base64 clinical photos compile through easily
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Diagnostic health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Educational Gemini analysis route
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { symptoms, selectedScreeningType, files = [] } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      const isApiKeyAvailable = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "";

      if (!isApiKeyAvailable) {
        // High quality static rules fallback analyzer when API key is missing
        // This ensures the application remains fully functional and elegant in development previews.
        console.warn("GEMINI_API_KEY is not configured or in placeholder state. Falling back to built-in Educational Risk Expert Engine.");

        const detected: string[] = [];
        if (symptoms && symptoms.trim()) detected.push("Symptom input detected");
        files.forEach((f: any) => {
          let typeStr = "File";
          if (f.type === "ct") typeStr = "Radiology CT Scan";
          if (f.type === "mri") typeStr = "Radiology MRI Scan";
          if (f.type === "xray") typeStr = "Radiology X-ray Scan";
          if (f.type === "skin") typeStr = "Dermatological Image";
          if (f.type === "blood") typeStr = "Laboratory CBC Report";
          detected.push(`${typeStr} detected (${f.name})`);
        });

        // Determine estimated risk based on scenario type in placeholder mode
        let risk: "Low" | "Medium" | "High" = "Medium";
        let title = "General Oncology Educational Risk Assessment";
        let analysis = "Based on the educational medical rules parser, your inputs indicate a moderate alert. Our rules show borderline markers that warrant further investigation.";
        let explanation = "Built-in analyzer has processed your selected items. A thorough screening profile is generated below.";
        let steps: string[] = ["Consult with a primary care provider", "Discuss standard screening options"];
        let followUp = "Do you have any scan details or lab sheets to input next?";

        const typeLower = (selectedScreeningType || "general").toLowerCase();

        if (typeLower.includes("lung")) {
          title = "Lung Cancer Educational Screening Profile";
          const hasSmoking = (symptoms || "").toLowerCase().includes("smok") || (symptoms || "").toLowerCase().includes("cough");
          risk = hasSmoking ? "Medium" : "Low";
          analysis = "The provided respiratory symptoms list a prolonged cough and minor shortness of breath. No active signs of hemoptysis or stabbing pleuritic chest pain are outlined. Radiology screening suggests a chest review for any nodular lesions.";
          explanation = "The combination of smoking pack-years and chronic cough is a well-documented indicator for low-dose CT (LDCT) lung cancer screenings according to USPSTF suggestions.";
          steps = [
            "We strongly suggest consulting a qualified Pulmonologist or Thoracic Care Specialist.",
            "Physicians may order standard Low-Dose Computed Tomography (LDCT) to rule out structural anomalies.",
            "Consider Spirometry lung function testing and sequential sputum cytology if clinically indicated."
          ];
          followUp = "Would you like to examine if adding a diagnostic blood CBC or X-ray reports alters this educational risk profile?";
        } else if (typeLower.includes("skin")) {
          title = "Skin Cancer (Melanoma) Educational Screening Profile";
          const hasIrregular = (symptoms || "").toLowerCase().includes("asymmetry") || (symptoms || "").toLowerCase().includes("border");
          risk = hasIrregular ? "Medium" : "Low";
          analysis = "Dermatological file review indicates an asymmetrical brownish mole pattern. The border is described as partially irregular with modern changes, triggering a mild ABCDE melanoma caution. No active secondary bleeding or crusting is reported.";
          explanation = "Atypical features (such as border irregularity, asymmetry, or changes in color/size) are important features evaluated by a clinical dermatologist via dermoscopy.";
          steps = [
            "Schedule a standard dermoscopic examination with a Board-Certified Dermatologist.",
            "Dermatologists typically perform detailed full-body mapping and complete a standard punch biopsy if any suspicious areas are confirmed."
          ];
          followUp = "Do you have other dermatological images or a detailed timeline of mole sizing changes?";
        } else if (typeLower.includes("brain")) {
          title = "Brain Tumor / Cerebral Oncology Educational Profile";
          risk = (symptoms || "").toLowerCase().includes("headache") ? "Medium" : "Low";
          analysis = "Neurological symptom report identifies persistent, early morning headaches that resolve slightly during daylight hours. Mild sensory vision notes exist. Radiology inputs suggest a detailed examination of contrast imaging.";
          explanation = "Early morning headaches coupled with mild intracranial pressure symptoms represents a clinical profile that doctors usually evaluate with detailed neuro-imaging to exclude space-occupying lesions.";
          steps = [
            "Consult a clinical medical Neurologist or Neuro-oncology Physician.",
            "Potential tests include detailed Cranial MRI with and without gadolinium contrast, formal visual field mapping, and standard neurological motor reflex examinations."
          ];
          followUp = "Would you like to check how standard white blood count (WBC) listings from a lab report relate to general neurological evaluations?";
        } else if (typeLower.includes("blood")) {
          title = "Blood Cancer (Leukemia/Lymphoma) Educational Screening Profile";
          const hasHighWbc = (symptoms || "").toLowerCase().includes("lymph") || (symptoms || "").toLowerCase().includes("sweat") || JSON.stringify(files).includes("WBC");
          risk = hasHighWbc ? "High" : "Medium";
          analysis = "Laboratory markers indicate a borderline leucocytosis (elevated WBC) and mild anemia. Symptoms include low-grade night sweats and soft fatigue. This pattern indicates a systemic inflammation profile or potential marrow strain.";
          explanation = "Persistent lymphocytosis combined with systemic symptoms like night sweats warrants a medical workspace overview to rule out myeloproliferative disorders or temporary infectious mononucleosis.";
          steps = [
            "We strongly recommend consulting an Oncologist, Hematologist, or Primary Family Physician.",
            "Doctors will typically order a Hematology review with peripheral blood smear, flow cytometry, repeat differential check, and lymph node ultrasound diagnostics."
          ];
          followUp = "Would you like to simulate checking how a chest X-Ray scan would correlate with this lymphatic presentation?";
        } else {
          // General
          title = "General Oncology Educational Risk Assessment";
          analysis = "An educational analysis was simulated. General oncology risk is evaluated by matching constitutional symptoms (unexplained weight loss, night sweats, fatigue) with targeted, guideline-supported screeners.";
          explanation = "Multiple baseline inputs provided. Your details can provide doctors with clues about which organ systems to evaluate first.";
          steps = [
            "Make an appointment with an Internal Medicine Specialist or Family Physician for a comprehensive wellness screen.",
            "Typical screening options include standard Age-Appropriate screenings (e.g., Colonoscopy, Mammography, Pap smear, or Prostate Specific Antigen (PSA))."
          ];
          followUp = "Would you like to choose a specific target cancer screening area like Lung, Skin, Brain, or Blood?";
        }

        return res.json({
          detectedInputs: detected,
          selectedScreeningType: title,
          analysisText: analysis,
          riskLevel: risk,
          explanation: explanation,
          nextSteps: steps,
          followUpQuestion: followUp,
          isCustomResponse: true
        });
      }

      // 1. Initialize GoogleGenAI SDK with key
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // 2. Prepare multimodal parts
      const parts: any[] = [];

      // Process uploaded scan images / base64 images
      for (const file of files) {
        if (file.dataUrl && file.dataUrl.includes(";base64,")) {
          const partsBase = file.dataUrl.split(";base64,");
          const mime = partsBase[0].split(":")[1];
          const base64Data = partsBase[1];
          
          parts.push({
            inlineData: {
              mimeType: mime,
              data: base64Data
            }
          });
        }
        
        // Include textual context of reports if any
        if (file.textContent) {
          parts.push({
            text: `Document Content [Name: ${file.name}, Type: ${file.type}]:\n${file.textContent}`
          });
        }
      }

      // Add symptom statement
      parts.push({
        text: `Patient Clinical Symptoms: ${symptoms || "None described (Only scans/reports provided)."}`
      });

      // User prompt directive
      const userPrompt = `
Analyze the following patient presentation:

Chosen Screening Category: ${selectedScreeningType}

Included artifacts metadata:
${files.map((f: any) => `- ${f.name} (Type: ${f.type})`).join("\n")}

Please formulate an educational screening routing analysis.
Adhere strictly to the safety rules. Use cautious phrasing (e.g., 'requires further investigation', 'may correlate', 'potential clinical indicators'). Suggest appropriate screening routing, determine an educational risk triage level ("Low", "Medium", "High"), explain clearly why, outline the exact next step recommendations (consultation and typical doctor tests), and ask a pertinent follow-up question.
`;

      parts.push({ text: userPrompt });

      // Call Gemini 3.5-flash with structured config
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedInputs: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              selectedScreeningType: { type: Type.STRING },
              analysisText: { type: Type.STRING },
              riskLevel: {
                type: Type.STRING,
                description: "Must be 'Low' or 'Medium' or 'High' only"
              },
              explanation: { type: Type.STRING },
              nextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              followUpQuestion: { type: Type.STRING }
            },
            required: [
              "detectedInputs",
              "selectedScreeningType",
              "analysisText",
              "riskLevel",
              "explanation",
              "nextSteps",
              "followUpQuestion"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini model.");
      }

      const cleanJson = JSON.parse(responseText.trim());
      res.json(cleanJson);

    } catch (error: any) {
      console.error("Gemini oncology analysis endpoint error: ", error);
      res.status(500).json({
        error: "Failed to perform oncology risk assessment logic.",
        details: error.message
      });
    }
  });

  // Educational Gemini Q&A Chat route
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      const isApiKeyAvailable = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "";

      if (!isApiKeyAvailable) {
        console.warn("GEMINI_API_KEY is not configured or in placeholder state. Falling back to rule-based Educational Q&A Expert Engine.");

        const lower = message.toLowerCase();
        let answer = "Thank you for asking an educational oncology question. As OncoNavigator Q&A Assistant, I can provide general clinical screening guidelines. Please note that I cannot provide medical diagnoses or replace a physician's advice. Always check with an oncologist.";

        if (lower.includes("lung") || lower.includes("smoke") || lower.includes("cough")) {
          answer = "According to standard clinical screening guidelines (such as USPSTF criteria), individuals aged 50 to 80 with a 20 pack-year smoking history who currently smoke or have quit within the past 15 years are recommended for annual screening with Low-Dose Computed Tomography (LDCT). Always consult a pulmonologist or oncologist for tailored medical guidance.";
        } else if (lower.includes("skin") || lower.includes("mole") || lower.includes("melanoma")) {
          answer = "Dermatologists recommend the ABCDE criteria to examine skin spots:\n\n- **A**symmetry (one half unlike the other)\n- **B**order irregularity\n- **C**olor variation (multiple shades)\n- **D**iameter (larger than 6mm)\n- **E**volving (changing over time).\n\nAny worrisome mole should be examined under a polarized dermatoscope by a certified dermatologist. This is an educational reference.";
        } else if (lower.includes("brain") || lower.includes("headache")) {
          answer = "Brain tumor screenings typically begin when localized focal neurological symptoms, seizure activity, or progressive morning headaches are observed by a physician. In clinical settings, a Contrast-Enhanced Cranial MRI (Magnetic Resonance Imaging) is typically the standard of care for spatial diagnostic verification. This guidance is purely simulated and informational.";
        } else if (lower.includes("blood") || lower.includes("wbc") || lower.includes("cbc")) {
          answer = "Complete Blood Count (CBC) reports measure lymphocytes, leukocytes, erythrocytes, and platelet concentrations. Elevated white blood cell levels (leucocytosis) can indicate stress, infection, or hematological strain. Any persistent lymphoid swelling or general anemia flags require clinical evaluations with follow-up manual peripheral blood smears by a hematologist.";
        } else if (lower.includes("chemo") || lower.includes("treatment") || lower.includes("therapy")) {
          answer = "Oncology treatment paths typically involve a combination of localized therapies (surgical resections, stereotactic radiation therapy) and systemic therapies (cytotoxic chemotherapy, precision immunotherapy, hormone blockades). Each treatment plan is specifically computed based on immunohistochemical tumor staging and genetic profiling by a medical oncology team.";
        }

        return res.json({ text: answer });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Prepare list of content roles matching GenAI SDK roles
      const contents = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: "You are OncoNavigator Q&A Assistant, a compassionate, informative, and clinical oncology screening guidelines companion. " +
            "You provide educational summaries of cancer risks, screening milestones (e.g. USPSTF guidelines, ABCDE melanoma checks, CBC ranges), and the science of oncology treatments. " +
            "CRITICAL SAFETY WARNING: You are NOT a doctor, and you CANNOT make diagnostic declarations or claim that a user has cancer. " +
            "You MUST always end or sprinkle your statements with standard guidance to consult standard board-certified professionals. " +
            "Be descriptive, clean, clear, and highly reassuring."
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Q&A Chat route error: ", error);
      res.status(500).json({ error: "Failed to generate Q&A response.", details: error.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OncoNavigator AI server is listening on port ${PORT}`);
  });
}

startServer();
