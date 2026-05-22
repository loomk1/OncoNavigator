import React, { useEffect, useState } from "react";
import { Activity, ShieldAlert, Crosshair, HelpCircle } from "lucide-react";

interface ScanVisualizerHeatmapProps {
  cancerType: string;
  riskLevel: "Low" | "Medium" | "High";
}

export function ScanVisualizerHeatmap({ cancerType, riskLevel }: ScanVisualizerHeatmapProps) {
  const [scanCoordinate, setScanCoordinate] = useState({ x: 120, y: 90 });
  const [pScale, setPScale] = useState(1);
  const [activeSlice, setActiveSlice] = useState(42);

  useEffect(() => {
    // Dynamic breathing scale for ripple animations
    const interval = setInterval(() => {
      setPScale((prev) => (prev === 1 ? 1.15 : 1));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const typeLower = cancerType.toLowerCase();

  // Establish coordinates aligning perfectly with the centered SVG anatomical elements
  useEffect(() => {
    if (typeLower.includes("lung")) {
      setScanCoordinate({ x: 152, y: 96 }); // Suspicious nodule in right lung branch
      setActiveSlice(58);
    } else if (typeLower.includes("skin")) {
      setScanCoordinate({ x: 121, y: 92 }); // Center suspicious mole lesion
      setActiveSlice(12);
    } else if (typeLower.includes("brain")) {
      setScanCoordinate({ x: 132, y: 71 }); // Suspicious mass in frontal hemisphere
      setActiveSlice(114);
    } else if (typeLower.includes("blood")) {
      setScanCoordinate({ x: 108, y: 114 }); // Activated leukopathic granulocyte highlight
      setActiveSlice(8);
    } else {
      setScanCoordinate({ x: 120, y: 90 }); // Default centered clinical focus coordinate
      setActiveSlice(32);
    }
  }, [cancerType, typeLower]);

  // Dynamic parameters based on Staged Triage Priority
  const getRiskColors = () => {
    switch (riskLevel) {
      case "High":
        return {
          glow: "rgba(244, 63, 94, 0.45)", // high-strength rose glow
          ring: "border-rose-500",
          strokeColor: "#f43f5e",
          text: "text-rose-600 bg-rose-50 border-rose-100",
          pulse: "bg-rose-500",
          pulseSpeed: "0.7s",
          spinSpeed: "2.5s",
          scale: 1.25,
          glowRadius: "0 0 20px 6px rgba(244, 63, 94, 0.75)"
        };
      case "Medium":
        return {
          glow: "rgba(245, 158, 11, 0.35)", // solid amber glow
          ring: "border-amber-500",
          strokeColor: "#d97706",
          text: "text-amber-700 bg-amber-50 border-amber-100",
          pulse: "bg-amber-500",
          pulseSpeed: "1.4s",
          spinSpeed: "6s",
          scale: 1.05,
          glowRadius: "0 0 14px 4px rgba(245, 158, 11, 0.5)"
        };
      default:
        return {
          glow: "rgba(59, 130, 246, 0.25)", // calm sapphire blue layout
          ring: "border-blue-500",
          strokeColor: "#2563eb",
          text: "text-blue-600 bg-blue-50 border-blue-105",
          pulse: "bg-blue-650",
          pulseSpeed: "2.5s",
          spinSpeed: "12s",
          scale: 0.85,
          glowRadius: "0 0 10px 2px rgba(59, 130, 246, 0.35)"
        };
    }
  };

  const currentColors = getRiskColors();

  // Renders the specific target graphics on focus point (Reflective of cancer type & triage)
  const renderTargetReticle = () => {
    if (typeLower.includes("lung")) {
      return (
        <div 
          className="absolute pointer-events-none transition-all duration-700"
          style={{ left: `${scanCoordinate.x}px`, top: `${scanCoordinate.y}px`, transform: "translate(-50%, -50%)" }}
        >
          {/* Target crosshair markers */}
          <div className={`absolute w-[24px] h-[0.5px] border-t border-dashed ${currentColors.ring} -left-[12px] top-0`} />
          <div className={`absolute h-[24px] w-[0.5px] border-l border-dashed ${currentColors.ring} left-0 -top-[12px]`} />
          {/* Outer spin reticle */}
          <div 
            className={`absolute rounded-full border border-dashed ${currentColors.ring}`}
            style={{
              width: `${26 * currentColors.scale}px`,
              height: `${26 * currentColors.scale}px`,
              marginLeft: `-${13 * currentColors.scale}px`,
              marginTop: `-${13 * currentColors.scale}px`,
              animation: `spin ${currentColors.spinSpeed} linear infinite`
            }}
          />
          {/* Wave shock ripple */}
          <div 
            className={`absolute rounded-full border-2 ${currentColors.ring} opacity-50 animate-ping`}
            style={{
              width: `${16 * currentColors.scale * pScale}px`,
              height: `${16 * currentColors.scale * pScale}px`,
              marginLeft: `-${8 * currentColors.scale * pScale}px`,
              marginTop: `-${8 * currentColors.scale * pScale}px`,
              animationDuration: currentColors.pulseSpeed
            }}
          />
          {/* Master pinpoint core */}
          <div 
            className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full ${currentColors.pulse}`}
            style={{ boxShadow: currentColors.glowRadius }}
          />
        </div>
      );
    }

    if (typeLower.includes("skin")) {
      return (
        <div 
          className="absolute pointer-events-none transition-all duration-700"
          style={{ left: `${scanCoordinate.x}px`, top: `${scanCoordinate.y}px`, transform: "translate(-50%, -50%)" }}
        >
          {/* Concentric tick gauge */}
          <div 
            className={`absolute rounded-full border border-dashed ${currentColors.ring}`}
            style={{
              width: `${22 * currentColors.scale}px`,
              height: `${22 * currentColors.scale}px`,
              marginLeft: `-${11 * currentColors.scale}px`,
              marginTop: `-${11 * currentColors.scale}px`,
              animation: "spin 15s linear infinite"
            }}
          />
          <div 
            className={`absolute rounded-full border ${currentColors.ring} opacity-80`}
            style={{
              width: `${14 * currentColors.scale}px`,
              height: `${14 * currentColors.scale}px`,
              marginLeft: `-${7 * currentColors.scale}px`,
              marginTop: `-${7 * currentColors.scale}px`,
            }}
          />
          {/* Suspicious lesion center focus core */}
          <div 
            className={`absolute w-3 h-3 -ml-[6px] -mt-[6px] rounded-full ${currentColors.pulse} opacity-90`}
            style={{ boxShadow: currentColors.glowRadius }}
          />
        </div>
      );
    }

    if (typeLower.includes("brain")) {
      return (
        <div 
          className="absolute pointer-events-none transition-all duration-700"
          style={{ left: `${scanCoordinate.x}px`, top: `${scanCoordinate.y}px`, transform: "translate(-50%, -50%)" }}
        >
          {/* Scanning corner brackets around tumor bounds */}
          <div className={`absolute -left-[11px] -top-[11px] w-2 h-2 border-l-2 border-t-2 ${currentColors.ring}`} />
          <div className={`absolute -right-[11px] -top-[11px] w-2 h-2 border-r-2 border-t-2 ${currentColors.ring}`} />
          <div className={`absolute -left-[11px] -bottom-[11px] w-2 h-2 border-l-2 border-b-2 ${currentColors.ring}`} />
          <div className={`absolute -right-[11px] -bottom-[11px] w-2 h-2 border-r-2 border-b-2 ${currentColors.ring}`} />
          {/* Radiating brackets pulse */}
          <div 
            className={`absolute rounded-full border border-dashed ${currentColors.ring} opacity-60 animate-pulse`}
            style={{
              width: `${18 * currentColors.scale}px`,
              height: `${18 * currentColors.scale}px`,
              marginLeft: `-${9 * currentColors.scale}px`,
              marginTop: `-${9 * currentColors.scale}px`,
              animationDuration: currentColors.pulseSpeed
            }}
          />
          {/* Focal core */}
          <div 
            className={`absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full ${currentColors.pulse}`}
            style={{ boxShadow: currentColors.glowRadius }}
          />
        </div>
      );
    }

    if (typeLower.includes("blood")) {
      return (
        <div 
          className="absolute pointer-events-none transition-all duration-700"
          style={{ left: `${scanCoordinate.x}px`, top: `${scanCoordinate.y}px`, transform: "translate(-50%, -50%)" }}
        >
          {/* Triple cascading fluid scan loops */}
          <div 
            className={`absolute rounded-full border border-dashed ${currentColors.ring}`}
            style={{
              width: `${24 * currentColors.scale}px`,
              height: `${24 * currentColors.scale}px`,
              marginLeft: `-${12 * currentColors.scale}px`,
              marginTop: `-${12 * currentColors.scale}px`,
              animation: "spin 20s linear infinite"
            }}
          />
          <div 
            className={`absolute rounded-full border ${currentColors.ring} opacity-40 animate-ping`}
            style={{
              width: `${30 * currentColors.scale * pScale}px`,
              height: `${30 * currentColors.scale * pScale}px`,
              marginLeft: `-${15 * currentColors.scale * pScale}px`,
              marginTop: `-${15 * currentColors.scale * pScale}px`,
              animationDuration: currentColors.pulseSpeed
            }}
          />
          {/* Fluid cytometry highlighting core */}
          <div 
            className={`absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full ${currentColors.pulse}`}
            style={{ boxShadow: currentColors.glowRadius }}
          />
        </div>
      );
    }

    // Default targeting crosshair
    return (
      <div 
        className="absolute pointer-events-none transition-all duration-700"
        style={{ left: `${scanCoordinate.x}px`, top: `${scanCoordinate.y}px`, transform: "translate(-50%, -50%)" }}
      >
        <div 
          className={`absolute rounded-full border-2 border-dashed ${currentColors.ring} animate-[spin_8s_linear_infinite]`}
          style={{
            width: `${20 * pScale}px`,
            height: `${20 * pScale}px`,
            marginLeft: `-${10 * pScale}px`,
            marginTop: `-${10 * pScale}px`
          }}
        />
        <div 
          className={`absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full ${currentColors.pulse}`}
          style={{ boxShadow: currentColors.glowRadius }}
        />
      </div>
    );
  };

  return (
    <div id="scan-visualizer-card" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs font-sans space-y-4 transition-colors duration-200">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Anatomical Guideline Reference Map
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-105">
          LOCAL VISUALIZATION
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        
        {/* Vector Viewport Canvas with dynamically generated grids and outlines */}
        <div className="sm:col-span-6 flex justify-center">
          <div className="relative w-[240px] h-[180px] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
            
            {/* Dynamic visual grids adapting perfectly to selected cancer type */}
            {typeLower.includes("lung") ? (
              // Radial CT Scanner circles mapping
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.12]">
                <div className="absolute border border-slate-400 rounded-full w-[60px] h-[60px]" />
                <div className="absolute border border-slate-400 rounded-full w-[110px] h-[110px]" />
                <div className="absolute border border-slate-400 rounded-full w-[170px] h-[170px]" />
                <div className="absolute border-l border-slate-400 h-full left-1/2" />
                <div className="absolute border-t border-slate-400 w-full top-1/2" />
              </div>
            ) : typeLower.includes("skin") ? (
              // Microscopic dermal hex cellular lattice or dense grid dots representing magnifying dermoscope bounds
              <div className="absolute inset-0 pointer-events-none opacity-[0.12] flex flex-wrap gap-4 p-2">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-slate-500 rounded-full" />
                ))}
              </div>
            ) : typeLower.includes("brain") ? (
              // Brain section coordinate grid markers & hemispheric reference sectors
              <div className="absolute inset-0 pointer-events-none opacity-[0.09]">
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="border-[0.2px] border-slate-500" />
                  ))}
                </div>
                {/* Hemispheric dividing axis guidelines */}
                <div className="absolute border-l-2 border-dashed border-teal-500/40 h-full left-1/2" />
                <div className="absolute border-t border-slate-300 w-full top-1/2" />
              </div>
            ) : typeLower.includes("blood") ? (
              // Cytometric laminar fluid microfluidic flow channels running left-to-right
              <div className="absolute inset-0 pointer-events-none opacity-[0.14] overflow-hidden">
                <svg className="w-full h-full text-slate-300" viewBox="0 0 240 180" fill="none" stroke="currentColor">
                  <path d="M0,35 Q60,25 120,45 Q180,65 240,35" strokeWidth="0.8" strokeDasharray="2,2" />
                  <path d="M0,90 Q60,95 120,85 Q180,75 240,90" strokeWidth="0.8" />
                  <path d="M0,145 Q60,155 120,135 Q180,115 240,145" strokeWidth="0.8" strokeDasharray="2,2" />
                </svg>
              </div>
            ) : (
              // Standard cartesian uniform grid lines
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-30 pointer-events-none">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-slate-200"></div>
                ))}
              </div>
            )}

            {/* Labels overlay */}
            <span className="absolute top-2 left-3 text-[8px] font-mono text-slate-450 uppercase tracking-wider">LAYER: SOL_{activeSlice}</span>
            <span className="absolute bottom-2 left-3 text-[8px] font-mono text-slate-450 uppercase tracking-wider">TARGET ASPECT: MULTIPHASE</span>

            {/* Custom SVG Outlines specifically detailed for chosen cancer types */}
            <svg className="w-32 h-32 text-slate-300 relative z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              {typeLower.includes("lung") ? (
                <>
                  {/* Detailed double lungs with trachea and bronchial branches */}
                  {/* Trachea tube */}
                  <path d="M48,10 L52,10 L52,28 L48,28 Z" strokeWidth="1" fill="none" />
                  <line x1="48" y1="16" x2="52" y2="16" strokeWidth="0.7" />
                  <line x1="48" y1="22" x2="52" y2="22" strokeWidth="0.7" />
                  {/* Left Lung silhouette with notch */}
                  <path d="M48,28 C36,25 18,28 14,56 C12,74 24,86 42,78 C46,74 46,55 48,28 Z" strokeWidth="1.2" fill="rgba(241, 245, 249, 0.5)" />
                  {/* Right Lung lobes */}
                  <path d="M52,28 C64,25 82,28 86,56 C88,74 76,86 58,78 C54,74 54,55 52,28 Z" strokeWidth="1.2" fill="rgba(241, 245, 249, 0.5)" />
                  {/* Bronchial internal branches */}
                  <path d="M48,28 Q38,38 28,42" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M38,38 Q30,48 24,46" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M52,28 Q62,38 72,42" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M62,38 Q70,48 76,46" strokeWidth="0.6" strokeLinecap="round" />
                  
                  {/* Pathology node location */}
                  <circle cx="75" cy="55" r="4" fill={currentColors.strokeColor} fillOpacity="0.2" stroke={currentColors.strokeColor} strokeWidth="0.5" strokeDasharray="1,1" />
                </>
              ) : typeLower.includes("skin") ? (
                <>
                  {/* Magnifying scope boundaries and irregular multilayer melanoma nevus illustration */}
                  <circle cx="50" cy="50" r="46" strokeWidth="1" strokeDasharray="2,2" />
                  {/* Irregular nevus path showing asymmetrical border details (ABCDE) */}
                  <path 
                    d="M51,34 C61,35 71,40 68,52 C65,64 54,68 44,63 C34,58 31,48 38,41 C43,36 45,33 51,34 Z" 
                    strokeWidth="1.2" 
                    fill="rgba(67, 56, 202, 0.08)" 
                  />
                  {/* Shadowed focal center segment showing color variability */}
                  <path 
                    d="M51,34 C56,36 60,40 58,46 C56,52 48,54 44,51 C39,48 42,42 46,38 Z" 
                    fill="rgba(15, 23, 42, 0.15)"
                    stroke="none"
                  />
                  {/* Highlighting measurement points */}
                  <line x1="38" y1="41" x2="68" y2="52" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
                  <circle cx="51" cy="46" r="3.5" fill={currentColors.strokeColor} fillOpacity="0.15" stroke={currentColors.strokeColor} strokeWidth="0.5" />
                </>
              ) : typeLower.includes("brain") ? (
                <>
                  {/* Full cranial hemispheric skull with ventricular structures and cerebral lobes */}
                  {/* Skull outer outline */}
                  <path d="M50,14 C22,14 16,38 18,74 C20,88 34,90 50,88 C66,90 80,88 82,74 C84,38 78,14 50,14 Z" strokeWidth="1.5" fill="rgba(241, 245, 249, 0.4)" />
                  {/* Ventricles inner complex shape */}
                  <path d="M50,32 Q42,42 50,56 Q58,42 50,32 Z" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
                  {/* Sulci (Brain fold lines) */}
                  <path d="M46,20 Q32,28 42,38 Q28,48 44,58" strokeWidth="0.8" />
                  <path d="M54,20 Q68,28 58,38 Q72,48 56,58" strokeWidth="0.8" />
                  <path d="M50,14 L50,88" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Mass pathology node representation */}
                  <circle cx="59" cy="35" r="5" fill={currentColors.strokeColor} fillOpacity="0.2" stroke={currentColors.strokeColor} strokeWidth="0.5" />
                </>
              ) : typeLower.includes("blood") ? (
                <>
                  {/* Highlighting microscopic hematology elements (cytopathic elements suspended list) */}
                  {/* Cellular membrane boundary */}
                  <circle cx="50" cy="50" r="44" strokeWidth="1" strokeDasharray="4,4" />
                  {/* RBC biconcave discs */}
                  <ellipse cx="28" cy="34" rx="7" ry="4" strokeWidth="0.8" fill="rgba(239, 68, 68, 0.1)" />
                  <circle cx="28" cy="34" r="2.5" fill="rgba(239, 68, 68, 0.25)" stroke="none" />

                  <ellipse cx="72" cy="74" rx="8" ry="5" strokeWidth="0.8" fill="rgba(239, 68, 68, 0.1)" />
                  <circle cx="72" cy="74" r="3" fill="rgba(239, 68, 68, 0.25)" stroke="none" />
                  
                  <ellipse cx="76" cy="32" rx="6" ry="3.5" strokeWidth="0.8" fill="rgba(239, 68, 68, 0.1)" />
                  {/* White Blood Cell (Granulocyte showing lobed nucleus inside) */}
                  <circle cx="41" cy="68" r="9" strokeWidth="1" fill="rgba(219, 234, 254, 0.4)" />
                  <path d="M38,65 Q41,69 39,72 Q43,72 45,67 Z" fill="rgba(30, 64, 175, 0.4)" stroke="none" />

                  {/* Suspected blast component coordinates */}
                  <circle cx="41" cy="68" r="9" stroke={currentColors.strokeColor} strokeWidth="0.8" strokeDasharray="1,1" />
                </>
              ) : (
                <>
                  {/* Standard concentric medical targeting circle reticles */}
                  <circle cx="50" cy="50" r="38" strokeWidth="1" />
                  <circle cx="50" cy="50" r="22" strokeWidth="0.7" strokeDasharray="3,3" />
                  <circle cx="50" cy="50" r="8" strokeWidth="0.5" />
                </>
              )}
            </svg>

            {/* Glowing active target pointing widget (Vibrates beautifully reflecting types & risk weights) */}
            {renderTargetReticle()}

            {/* Floating precise coordinate badge locked directly above target lesion coordinates */}
            <div 
              className={`absolute px-2 py-0.5 rounded-md text-[8px] font-mono border ${currentColors.text} transition-all duration-700 pointer-events-none shadow-sm font-semibold`}
              style={{
                left: `${scanCoordinate.x}px`,
                top: `${scanCoordinate.y - 25}px`,
                transform: "translate(-50%, -50%)"
              }}
            >
              COORDS: X{Math.round(scanCoordinate.x)}px / Y{Math.round(scanCoordinate.y)}px
            </div>

          </div>
        </div>

        {/* Legend Notes & Clinical Coordinates Info */}
        <div className="sm:col-span-6 space-y-3 text-left">
          <div className="space-y-1 bg-transparent">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Simulated Screening Region</span>
            <p className="text-xs font-semibold text-slate-800 uppercase flex items-center gap-1.5 font-serif italic">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              {cancerType} TARGET
            </p>
          </div>

          <div className="space-y-1 bg-transparent">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Assessment Triage</span>
            <p className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${currentColors.pulse} border border-white`} />
              {riskLevel} Risk Priority
            </p>
          </div>

          <div className="space-y-1 bg-transparent border-t border-slate-50 pt-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Clinical Note</span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Anatomical overlays represent simulated guidance coordinates compiled dynamically for educational validation inside standard oncology imaging guidelines. Evaluated locally.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
