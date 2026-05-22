import React, { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon, CheckCircle } from "lucide-react";
import { MedicalFile, MedicalInputType } from "../types";

interface ScannerUploadProps {
  onFileAdded: (file: MedicalFile) => void;
  onFileRemoved: (id: string) => void;
  uploadedFiles: MedicalFile[];
  onContinue?: () => void;
}

export function ScannerUpload({
  onFileAdded,
  onFileRemoved,
  uploadedFiles,
  onContinue
}: ScannerUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<MedicalInputType>(MedicalInputType.CT_SCAN);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB limit
    if (file.size > maxSize) {
      setErrorMessage("File exceeds 20MB limit.");
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onFileAdded({
          id: `file-${Date.now()}-${file.name}`,
          name: file.name,
          type: selectedType,
          mimeType: file.type,
          dataUrl: dataUrl
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onFileAdded({
          id: `file-${Date.now()}-${file.name}`,
          name: file.name,
          type: MedicalInputType.BLOOD_REPORT,
          mimeType: file.type || "text/plain",
          dataUrl: "",
          textContent: text
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto font-sans text-slate-800">
      
      {/* Category selector pill bar */}
      <div className="space-y-2">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-slate-405 text-center">
          First, choose file type to upload
        </label>
        <div className="flex flex-wrap justify-center gap-1.5">
          {[
            { type: MedicalInputType.CT_SCAN, label: "CT Scan" },
            { type: MedicalInputType.MRI_SCAN, label: "MRI Scan" },
            { type: MedicalInputType.X_RAY, label: "X-Ray" },
            { type: MedicalInputType.SKIN_IMAGE, label: "Skin Photo" },
            { type: MedicalInputType.BLOOD_REPORT, label: "Lab Sheet" }
          ].map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setSelectedType(opt.type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                selectedType === opt.type
                  ? "bg-slate-900 border-slate-900 text-white font-semibold"
                  : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-55"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
          isDragActive
            ? "border-blue-500 bg-blue-50/20"
            : "border-slate-200 bg-white hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-800">
              Drag file here or <span className="text-blue-600 font-semibold hover:underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Select any clinical images or lab text records (Max 20MB)
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-red-655 text-center bg-red-50 p-2.5 rounded-xl border border-red-100">{errorMessage}</p>
      )}

      {/* Uploaded items view */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
            Uploaded Data Files ({uploadedFiles.length})
          </p>

          <div className="space-y-1.5 max-w-md mx-auto">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[85%]">
                  {file.type === MedicalInputType.BLOOD_REPORT ? (
                    <FileText className="h-4 w-4 text-slate-450 mt-0.5 shrink-0" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-slate-450 mt-0.5 shrink-0" />
                  )}
                  <div className="truncate text-left font-sans">
                    <span className="text-xs font-semibold text-slate-800 block truncate">{file.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium font-mono">
                      {file.type.toUpperCase()} MATERIAL
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemoved(file.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple Supported Formats indicator as requested in 'Supported file types' */}
      <div className="space-y-1 text-center">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
          Supported Formats
        </p>
        <span className="text-[11px] text-slate-405 block">
          DICOM Voxel Slices, Chest X-Rays, High-Res Dermatology Selfies, CSV/TXT Lab Differential sheets
        </span>
      </div>

      {onContinue && (
        <div className="pt-2 text-center">
          <button
            onClick={onContinue}
            className="px-8 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 hover:shadow-lg transition cursor-pointer"
          >
            Continue to screen selection
          </button>
        </div>
      )}

    </div>
  );
}
