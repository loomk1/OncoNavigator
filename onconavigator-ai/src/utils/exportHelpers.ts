import { jsPDF } from "jspdf";

export interface PDFExportData {
  selectedScreeningType: string;
  riskLevel: "Low" | "Medium" | "High" | string;
  detectedInputs?: string[];
  analysisText: string;
  explanation: string;
  nextSteps: string[];
  followUpQuestion?: string;
}

// Generates a well-escaped corporate tabular CSV structure containing every clinical variable.
export const exportToCSV = (analysis: PDFExportData) => {
  const data = [
    ["Clinical Reference Property", "Details / Guideline Determinations"],
    ["Clinical Screening Module Chosen", analysis.selectedScreeningType],
    ["Calculated Baseline Risk Priority", analysis.riskLevel],
    ["Pre-Detected Audit Components", (analysis.detectedInputs || []).join("; ")],
    ["Institutional Guidance Interpretation Text", analysis.analysisText],
    ["Clinician Decision-Support Explanation", analysis.explanation],
    ["Primary Recommended Medical Consult Action", (analysis.nextSteps || []).slice(0, 1).join("")],
    ["Typical Next Diagnostic Checks Available", (analysis.nextSteps || []).slice(1).join("; ")],
    ["Interactive Secondary Recommendation Prompts", analysis.followUpQuestion || ""]
  ];

  const csvContent = data
    .map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const cleanScreeningName = analysis.selectedScreeningType.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `OncoNavigator_Analysis_Export_${cleanScreeningName}.csv`;
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generates an elegant, fully certified format PDF Complete with margins, borders and clinical details.
export const exportToPDF = (analysis: PDFExportData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = 20;

  // Header boundary limit checker to wrap content neatly and avoid spills
  const addPageIfNeeded = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
  };

  const addHeading = (text: string) => {
    addPageIfNeeded(12);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(text, margin, currentY);
    currentY += 6;
  };

  const addBodyText = (text: string, isItalic = false) => {
    doc.setFont("Helvetica", isItalic ? "italic" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate-600
    
    const lines = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line: string) => {
      addPageIfNeeded(6);
      doc.text(line, margin, currentY);
      currentY += 5;
    });
    currentY += 3; // spacing
  };

  const addDivider = () => {
    addPageIfNeeded(6);
    doc.setDrawColor(241, 245, 249); // Slate-100
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 8;
  };

  // Header branding segment
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue-500
  doc.text("OncoNavigator AI", margin, currentY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("CLINICAL PROTOCOLS SIMULATOR REPORT", margin + 105, currentY - 2);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin + 105, currentY + 3);

  currentY += 4;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 10;

  // Screening Pathway Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(`Screening Target: ${analysis.selectedScreeningType}`, margin, currentY);
  currentY += 8;

  // Triage alert block
  const risk = analysis.riskLevel || "Medium";
  let riskColor = [244, 63, 94]; // Rose-500 for high
  if (risk === "Medium") riskColor = [245, 158, 11]; // Amber-500
  if (risk === "Low") riskColor = [59, 130, 246]; // Blue-500

  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.rect(margin, currentY, 40, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`TRIAGE STATUS: ${risk.toUpperCase()}`, margin + 3, currentY + 4.8);

  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8.5);
  doc.text("Educational Oncology Screening Pathway Log", margin + 46, currentY + 4.5);
  currentY += 12;

  // 1. Inputs Check
  addHeading("Detected Symptoms & Clinical Ingest Stats");
  const inputsStr = (analysis.detectedInputs || []).join(", ") || "Patient-supplied symptoms profile.";
  addBodyText(inputsStr);
  addDivider();

  // 2. Decision Support Narrative
  addHeading("AI Guideline Assessment Narrative");
  const paras = (analysis.analysisText || "").split("\n\n");
  paras.forEach(p => {
    if (p.trim()) addBodyText(p.trim());
  });
  addDivider();

  // 3. Explanation
  addHeading("General Oncology Screening Rationale & Standard Guidelines");
  addBodyText(analysis.explanation || "Diagnostic checkpoints studies aligned according to current standard guidelines.");
  addDivider();

  // 4. Proposed steps
  addHeading("Standard Primary Practice Clinical Steps Suggested");
  const steps = analysis.nextSteps || [];
  if (steps.length > 0) {
    steps.forEach((step, idx) => {
      addBodyText(`${idx + 1}.  ${step}`);
    });
  } else {
    addBodyText("No subsequent consultation specified.");
  }

  if (analysis.followUpQuestion) {
    addDivider();
    addHeading("AI Follow-Up Reflection Spot");
    addBodyText(`"${analysis.followUpQuestion}"`, true);
  }

  // Footer Disclaimers
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 24, margin + contentWidth, pageHeight - 24);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(
    "Disclaimer: OncoNavigator is a decision-support learning platform, not a physical medical diagnostics developer. The statements provided in this education sheet are formatted for classroom validation and training simulation only.",
    margin,
    pageHeight - 19,
    { maxWidth: contentWidth }
  );

  const cleanFilename = analysis.selectedScreeningType.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`OncoNavigator_Report_${cleanFilename}.pdf`);
};
