import React, { useState, useRef, useCallback } from "react";
import {
  X, Upload, FileText, CheckCircle, Sparkles, AlertTriangle,
  ArrowRight, ShieldCheck, Scan, Loader, Trash2, Plus,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MedicalReport, BiomarkerResult, ReportType } from "../../types";
import {
  extractTextFromFile, parseReportText, generateSummary,
} from "../../services/reportParser";

const REPORT_TYPES: ReportType[] = [
  "Blood Test", "Urine Test", "X-Ray", "MRI",
  "CT Scan", "ECG", "Prescription", "Full Body Panel", "Other",
];

type Stage = "upload" | "scanning" | "review" | "done";

const statusStyle: Record<BiomarkerResult["status"], string> = {
  Normal:   "bg-green-50 text-green-700 border-green-200",
  Low:      "bg-amber-50 text-amber-700 border-amber-200",
  High:     "bg-red-50  text-red-700  border-red-200",
  Critical: "bg-red-100 text-red-900  border-red-400 font-black",
};

export const OcrUploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addReport, setSelectedReportForAi } = useApp();

  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<ReportType>("Blood Test");
  const [centerName, setCenterName] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");

  const [rawText, setRawText] = useState("");
  const [biomarkers, setBiomarkers] = useState<BiomarkerResult[]>([]);
  const [summary, setSummary] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  // Manual biomarker entry
  const [manualParam, setManualParam] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [manualUnit, setManualUnit] = useState("");
  const [manualRef, setManualRef] = useState("");
  const [manualStatus, setManualStatus] = useState<BiomarkerResult["status"]>("Normal");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
    setFile(f);
    setError("");
    setReportName(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl("");
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  // ── Run extraction ─────────────────────────────────────────────────────────
  const runExtraction = async () => {
    if (!file) return;
    setStage("scanning");
    setError("");

    try {
      // Step 1: read file
      setProgress(10); setProgressLabel("Reading file...");
      const text = await extractTextFromFile(file);
      setRawText(text);

      // Step 2: parse parameters
      setProgress(60); setProgressLabel("Extracting parameters...");
      await new Promise(r => setTimeout(r, 300)); // small visual pause
      const params = parseReportText(text);

      // Step 3: generate summary
      setProgress(90); setProgressLabel("Generating AI summary...");
      await new Promise(r => setTimeout(r, 300));
      const aiSummary = generateSummary(params, reportName || file.name);

      setProgress(100);
      setBiomarkers(params);
      setSummary(aiSummary);

      // Auto-detect report type from text
      const textLower = text.toLowerCase();
      if (/urine|urinalysis/.test(textLower)) setReportType("Urine Test");
      else if (/ecg|electrocardiograph/.test(textLower)) setReportType("ECG");
      else if (/x.?ray|radiograph/.test(textLower)) setReportType("X-Ray");
      else if (/mri|magnetic resonance/.test(textLower)) setReportType("MRI");
      else if (/ct scan|computed tomography/.test(textLower)) setReportType("CT Scan");
      else if (/prescription|rx\b/.test(textLower)) setReportType("Prescription");
      else if (params.some(p => /hemoglobin|wbc|platelet|rbc/i.test(p.parameter))) setReportType("Blood Test");

      // Auto-detect center name
      const centerMatch = text.match(/(?:lab(?:oratory)?|hospital|diagnostics?|healthcare|clinic|pathlab|path\s*lab)\s*[:\-]?\s*([A-Z][A-Za-z\s&]+?)(?:\n|,|\|)/);
      if (centerMatch && !centerName) setCenterName(centerMatch[1].trim());

      setStage("review");
    } catch (err: any) {
      setError(err.message || "Failed to process file. Please try again.");
      setStage("upload");
    }
  };

  // ── Manually add a biomarker row ───────────────────────────────────────────
  const addManualBiomarker = () => {
    if (!manualParam.trim() || !manualValue.trim()) return;
    setBiomarkers(prev => [...prev, {
      parameter: manualParam.trim(),
      value: manualValue.trim(),
      unit: manualUnit.trim(),
      referenceRange: manualRef.trim(),
      status: manualStatus,
      explanation: "",
    }]);
    setManualParam(""); setManualValue(""); setManualUnit(""); setManualRef(""); setManualStatus("Normal");
    // Regenerate summary
    setTimeout(() => {
      setSummary(generateSummary([...biomarkers, {
        parameter: manualParam, value: manualValue, unit: manualUnit,
        referenceRange: manualRef, status: manualStatus,
      }], reportName));
    }, 50);
  };

  const removeBiomarker = (idx: number) => {
    setBiomarkers(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Save to records ────────────────────────────────────────────────────────
  const handleSave = () => {
    const newReport: MedicalReport = {
      id: `r-ocr-${Date.now()}`,
      name: reportName || "Uploaded Report",
      type: reportType,
      date: reportDate,
      uploadedBy: centerName || "Uploaded by Patient",
      fileName: file?.name,
      fileUrl: previewUrl || (file ? URL.createObjectURL(file) : "#"),
      aiAnalysed: true,
      aiSummary: summary || generateSummary(biomarkers, reportName),
      tags: ["Uploaded", reportType, ...(biomarkers.some(b => b.status !== "Normal") ? ["Abnormal Values"] : [])],
      biomarkers: biomarkers.length > 0 ? biomarkers : undefined,
      isEncrypted: true,
    };
    addReport(newReport);
    setStage("done");
    setTimeout(() => {
      onClose();
      setSelectedReportForAi(newReport);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Scan size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">Upload & Parse Medical Report</h2>
              <p className="text-xs text-blue-200">PDF or image → automatic parameter extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── UPLOAD STAGE ─────────────────────────────────────── */}
          {stage === "upload" && (
            <>
              {/* Drop zone */}
              <div
                ref={dragRef}
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  file
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText size={24} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · {file.type || "document"}</p>
                    </div>
                    <CheckCircle size={22} className="text-green-500 ml-auto" />
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Upload size={26} className="text-blue-600" />
                    </div>
                    <p className="font-bold text-gray-800 mb-1">Drop your report here or tap to browse</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG, WebP — lab reports, prescriptions, scans</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFileInput} />
              </div>

              {/* Preview for images */}
              {previewUrl && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 max-h-48">
                  <img src={previewUrl} alt="Preview" className="w-full object-contain max-h-48" />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Metadata fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Report Name</label>
                  <input value={reportName} onChange={e => setReportName(e.target.value)}
                    placeholder="e.g. CBC Blood Test Nov 2026"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Report Type</label>
                  <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500">
                    {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input type="date" value={reportDate} max={new Date().toISOString().split("T")[0]}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital / Lab Name</label>
                  <input value={centerName} onChange={e => setCenterName(e.target.value)}
                    placeholder="e.g. Apollo Diagnostics, Dr. Lal PathLabs"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </>
          )}

          {/* ── SCANNING STAGE ───────────────────────────────────── */}
          {stage === "scanning" && (
            <div className="py-8 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scan size={28} className="text-blue-600" />
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{progressLabel}</p>
                <p className="text-xs text-gray-500 mt-1">Reading every line of your report...</p>
              </div>
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Extracting parameters</span>
                  <span className="font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                {["Reading PDF", "OCR Text Extraction", "Parameter Detection", "Reference Matching", "AI Summary"].map((step, i) => (
                  <span key={step} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                    progress >= (i + 1) * 20 ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200"
                  }`}>
                    {progress >= (i + 1) * 20 && <CheckCircle size={10} />} {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── REVIEW STAGE ─────────────────────────────────────── */}
          {stage === "review" && (
            <div className="space-y-4">
              {/* Result header */}
              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                biomarkers.length > 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex items-center gap-2">
                  {biomarkers.length > 0
                    ? <CheckCircle size={18} className="text-green-600" />
                    : <AlertTriangle size={18} className="text-amber-600" />}
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {biomarkers.length > 0
                        ? `${biomarkers.length} parameters extracted from your report`
                        : "No parameters detected automatically"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {biomarkers.filter(b => b.status !== "Normal").length > 0
                        ? `${biomarkers.filter(b => b.status !== "Normal").length} out-of-range values found`
                        : "All detected values are within normal range"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(["Normal", "Low", "High", "Critical"] as const).map(s => {
                    const count = biomarkers.filter(b => b.status === s).length;
                    if (!count) return null;
                    return (
                      <span key={s} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[s]}`}>
                        {count} {s}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Metadata fields (editable) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Report Name</label>
                  <input value={reportName} onChange={e => setReportName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500">
                    {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lab / Hospital</label>
                  <input value={centerName} onChange={e => setCenterName(e.target.value)}
                    placeholder="Diagnostic center name"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Parameters table */}
              {biomarkers.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">Extracted Parameters</p>
                  <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {biomarkers.map((b, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 text-xs hover:bg-gray-50">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-semibold text-gray-900 truncate">{b.parameter}</p>
                          {b.referenceRange && (
                            <p className="text-gray-400 text-[10px]">Ref: {b.referenceRange} {b.unit}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-gray-800">{b.value} {b.unit}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[b.status]}`}>
                            {b.status}
                          </span>
                          <button onClick={() => removeBiomarker(i)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual add row */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">
                  {biomarkers.length > 0 ? "Add missing parameters manually" : "Add parameters manually"}
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={manualParam} onChange={e => setManualParam(e.target.value)}
                      placeholder="Parameter (e.g. Hemoglobin)"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                    <input value={manualValue} onChange={e => setManualValue(e.target.value)}
                      placeholder="Value (e.g. 11.4)"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                    <input value={manualUnit} onChange={e => setManualUnit(e.target.value)}
                      placeholder="Unit (e.g. g/dL)"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                    <input value={manualRef} onChange={e => setManualRef(e.target.value)}
                      placeholder="Reference (e.g. 12.0–15.5)"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1 flex-1">
                      {(["Normal", "Low", "High", "Critical"] as const).map(s => (
                        <button key={s} onClick={() => setManualStatus(s)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            manualStatus === s ? statusStyle[s] : "bg-white text-gray-400 border-gray-200"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <button onClick={addManualBiomarker}
                      disabled={!manualParam.trim() || !manualValue.trim()}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-amber-500" /> AI Summary
                </p>
                <p className="text-xs text-indigo-900 leading-relaxed">{summary}</p>
              </div>

              {/* Raw text toggle */}
              {rawText && (
                <div>
                  <button onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                    {showRaw ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showRaw ? "Hide" : "Show"} extracted raw text
                  </button>
                  {showRaw && (
                    <pre className="mt-2 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-x-auto max-h-32 whitespace-pre-wrap leading-relaxed">
                      {rawText.slice(0, 3000)}{rawText.length > 3000 ? "\n\n... (truncated)" : ""}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── DONE STAGE ────────────────────────────────────────── */}
          {stage === "done" && (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Report Saved!</p>
              <p className="text-xs text-gray-500">Opening AI analysis...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck size={13} className="text-green-500" /> AES-256 Encrypted
          </span>
          <div className="flex gap-2">
            {stage === "upload" && (
              <>
                <button onClick={onClose}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button onClick={runExtraction} disabled={!file}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow">
                  <Scan size={14} /> Extract Parameters <ArrowRight size={13} />
                </button>
              </>
            )}
            {stage === "review" && (
              <>
                <button onClick={() => { setStage("upload"); setBiomarkers([]); setSummary(""); }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">
                  ← Re-upload
                </button>
                <button onClick={handleSave}
                  className="px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 flex items-center gap-1.5 shadow">
                  <CheckCircle size={14} /> Save & View AI Insights
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
