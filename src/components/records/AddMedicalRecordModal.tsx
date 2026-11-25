import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Tag,
  FlaskConical,
  Stethoscope,
  Eye,
  Loader2,
} from "lucide-react";
import { MedicalReport, ReportType, BiomarkerResult } from "../../types";
import { useApp } from "../../context/AppContext";

interface Props {
  onClose: () => void;
}

const REPORT_TYPES: ReportType[] = [
  "Blood Test",
  "Urine Test",
  "X-Ray",
  "MRI",
  "CT Scan",
  "ECG",
  "Prescription",
  "Full Body Panel",
  "Other",
];

const REPORT_ICONS: Record<ReportType, string> = {
  "Blood Test": "🩸",
  "Urine Test": "🧪",
  "X-Ray": "🩻",
  MRI: "🧠",
  "CT Scan": "📡",
  ECG: "❤️",
  Prescription: "💊",
  "Full Body Panel": "🏥",
  Other: "📄",
};

const SUGGESTED_TAGS: string[] = [
  "Routine",
  "Annual",
  "Anemia",
  "Diabetes",
  "Heart",
  "Liver",
  "Kidney",
  "Thyroid",
  "Cholesterol",
  "Vitamins",
  "Infection",
  "Cancer Screening",
  "Hormones",
  "Allergy",
  "Pre-Surgery",
  "Post-Op",
];

const STEPS = ["Report Details", "Biomarker Entry", "AI Review & Save"];

export const AddMedicalRecordModal: React.FC<Props> = ({ onClose }) => {
  const { addReport } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Step 1 — Report Details
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<ReportType>("Blood Test");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [diagnosticCenter, setDiagnosticCenter] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2 — Biomarkers
  const [biomarkers, setBiomarkers] = useState<BiomarkerResult[]>([]);
  const [bParam, setBParam] = useState("");
  const [bValue, setBValue] = useState("");
  const [bUnit, setBUnit] = useState("");
  const [bRange, setBRange] = useState("");
  const [bStatus, setBStatus] = useState<BiomarkerResult["status"]>("Normal");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setUploadedFile(file);
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addBiomarker = () => {
    if (!bParam.trim() || !bValue.trim()) return;
    setBiomarkers([
      ...biomarkers,
      {
        parameter: bParam.trim(),
        value: bValue.trim(),
        unit: bUnit.trim(),
        referenceRange: bRange.trim(),
        status: bStatus,
        explanation: "",
      },
    ]);
    setBParam("");
    setBValue("");
    setBUnit("");
    setBRange("");
    setBStatus("Normal");
  };

  const removeBiomarker = (idx: number) =>
    setBiomarkers(biomarkers.filter((_, i) => i !== idx));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!reportName.trim()) e.name = "Report name is required.";
    if (!reportDate) e.date = "Date is required.";
    if (!diagnosticCenter.trim()) e.center = "Diagnostic center / hospital name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) setStep(1);
  };

  const handleStep2Next = () => {
    setStep(2);
  };

  const generateAiSummary = () => {
    if (biomarkers.length === 0) return `${reportType} report uploaded from ${diagnosticCenter} on ${reportDate}. ${notes || "No additional clinical notes added."}`;
    const abnormal = biomarkers.filter((b) => b.status !== "Normal");
    const normal = biomarkers.filter((b) => b.status === "Normal");
    let summary = `${reportType} report from ${diagnosticCenter} (${reportDate}). `;
    if (normal.length > 0)
      summary += `${normal.length} parameter${normal.length > 1 ? "s" : ""} within normal range. `;
    if (abnormal.length > 0) {
      summary += `Notable findings: ${abnormal
        .map((b) => `${b.parameter} ${b.value} ${b.unit} (${b.status.toLowerCase()})`)
        .join("; ")}. `;
    }
    summary += notes ? `Clinical notes: ${notes}` : "Consult your physician for detailed interpretation.";
    return summary;
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const newReport: MedicalReport = {
        id: `r-${Date.now()}`,
        name: reportName.trim(),
        type: reportType,
        date: reportDate,
        uploadedBy: diagnosticCenter.trim(),
        fileName: uploadedFile?.name || `${reportName.trim().replace(/\s+/g, "_")}.pdf`,
        fileUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : "#",
        aiSummary: generateAiSummary(),
        aiAnalysed: biomarkers.length > 0,
        tags: tags.length > 0 ? tags : [reportType],
        biomarkers: biomarkers.length > 0 ? biomarkers : undefined,
        isEncrypted: true,
      };
      addReport(newReport);
      setSaving(false);
      setSaved(true);
    }, 1600);
  };

  const statusColor: Record<BiomarkerResult["status"], string> = {
    Normal: "text-emerald-700 bg-emerald-50 border-emerald-200",
    Low: "text-amber-700 bg-amber-50 border-amber-200",
    High: "text-red-700 bg-red-50 border-red-200",
    Critical: "text-red-900 bg-red-100 border-red-400",
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Report Saved!</h2>
          <p className="text-sm text-gray-500 mb-6">
            <strong>{reportName}</strong> has been securely encrypted and added to your Medical Vault.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-blue-700 w-full"
          >
            View My Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="font-black text-base leading-tight">Add Medical Record</h2>
                <p className="text-xs text-blue-100">Upload reports, check-ups & diagnostic files</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-all ${
                    i < step ? "bg-emerald-400 text-white" : i === step ? "bg-white text-blue-700" : "bg-white/20 text-white/70"
                  }`}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-[11px] font-semibold hidden sm:block ${i === step ? "text-white" : "text-white/60"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-white/20 rounded-full" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── STEP 0: Report Details ─────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              {/* File Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50 hover:bg-blue-100 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB — Tap to change</p>
                    </div>
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload size={22} className="text-blue-600" />
                    </div>
                    <p className="font-bold text-sm text-gray-700">Drag & drop report file here</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG — Or tap to browse • Optional</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

              {/* Report Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Report Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g. Complete Blood Count, Full Body Checkup, Lipid Profile..."
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Report Type */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Report Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReportType(type)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        reportType === type
                          ? "bg-blue-600 text-white border-blue-600 shadow"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <span className="text-base">{REPORT_ICONS[type]}</span>
                      <span className="leading-tight text-center">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Center */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Report Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={reportDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setReportDate(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                  </div>
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Hospital / Diagnostic Center <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={diagnosticCenter}
                      onChange={(e) => setDiagnosticCenter(e.target.value)}
                      placeholder="e.g. Apollo Diagnostics, Dr. Lal PathLabs..."
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.center ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                  </div>
                  {errors.center && <p className="text-xs text-red-500 mt-1">{errors.center}</p>}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Tags (Optional)</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {SUGGESTED_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      disabled={tags.includes(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                        tags.includes(t)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                      placeholder="Add custom tag..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button type="button" onClick={() => addTag(tagInput)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                        #{t}
                        <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Doctor's Notes / Remarks (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any doctor's remarks, follow-up instructions, or notes about this report..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: Biomarker Entry ────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                <FlaskConical size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800">Add Test Parameters (Optional)</p>
                  <p className="text-xs text-blue-600 mt-0.5">Enter individual test values to enable AI-powered analysis and tracking. Skip this step if you only have a file.</p>
                </div>
              </div>

              {/* Add Biomarker Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-700">Add a Test Parameter</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-500 font-semibold block mb-1">Parameter Name *</label>
                    <input type="text" value={bParam} onChange={(e) => setBParam(e.target.value)} placeholder="e.g. Hemoglobin" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-semibold block mb-1">Value *</label>
                    <input type="text" value={bValue} onChange={(e) => setBValue(e.target.value)} placeholder="e.g. 11.4" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-semibold block mb-1">Unit</label>
                    <input type="text" value={bUnit} onChange={(e) => setBUnit(e.target.value)} placeholder="e.g. g/dL, mg/dL, /μL" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-semibold block mb-1">Reference Range</label>
                    <input type="text" value={bRange} onChange={(e) => setBRange(e.target.value)} placeholder="e.g. 12.0 - 15.5" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 font-semibold block mb-1">Status</label>
                  <div className="flex gap-2">
                    {(["Normal", "Low", "High", "Critical"] as BiomarkerResult["status"][]).map((s) => (
                      <button key={s} type="button" onClick={() => setBStatus(s)}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${bStatus === s ? statusColor[s] + " border-current" : "bg-white text-gray-500 border-gray-200"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addBiomarker}
                  disabled={!bParam.trim() || !bValue.trim()}
                  className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Add Parameter
                </button>
              </div>

              {/* Biomarker List */}
              {biomarkers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700">{biomarkers.length} Parameter{biomarkers.length > 1 ? "s" : ""} Added</p>
                  {biomarkers.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{b.parameter}</p>
                        <p className="text-[11px] text-gray-500">
                          {b.value} {b.unit} {b.referenceRange && `· Ref: ${b.referenceRange}`}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor[b.status]}`}>{b.status}</span>
                      <button type="button" onClick={() => removeBiomarker(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {biomarkers.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs">
                  <FlaskConical size={28} className="mx-auto text-gray-300 mb-2" />
                  <p>No parameters added yet — this step is optional.</p>
                  <p className="mt-0.5">You can proceed without adding biomarker data.</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: AI Review & Save ───────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex gap-3">
                <Sparkles size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-purple-800">AI-Generated Summary Preview</p>
                  <p className="text-xs text-purple-600 mt-1 leading-relaxed italic">"{generateAiSummary()}"</p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-600" /> Record Preview
                </p>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-semibold">Report Name</span>
                    <span className="font-bold text-right max-w-[60%] truncate">{reportName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-semibold">Type</span>
                    <span className="font-bold">{REPORT_ICONS[reportType]} {reportType}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-semibold">Date</span>
                    <span className="font-bold">{reportDate}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-semibold">Center</span>
                    <span className="font-bold text-right max-w-[60%] truncate">{diagnosticCenter}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-semibold">File Attached</span>
                    <span className="font-bold">{uploadedFile ? `✅ ${uploadedFile.name}` : "No file (details only)"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-semibold">Biomarkers</span>
                    <span className="font-bold">{biomarkers.length > 0 ? `${biomarkers.length} parameters` : "Not entered"}</span>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 font-semibold">Tags</span>
                      <span className="font-bold text-right">{tags.map(t => `#${t}`).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {biomarkers.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-700">Test Parameters ({biomarkers.length})</p>
                  <div className="space-y-1.5">
                    {biomarkers.map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 font-medium">{b.parameter}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{b.value} {b.unit}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor[b.status]}`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                <p className="text-xs text-emerald-800 font-semibold">This report will be encrypted using AES-256-GCM and stored securely in your Health Vault.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          <div className="flex items-center gap-2">
            {step === 0 && (
              <button type="button" onClick={handleStep1Next} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                Continue →
              </button>
            )}
            {step === 1 && (
              <button type="button" onClick={handleStep2Next} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                Review Report →
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-2.5 rounded-xl text-xs font-bold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 disabled:opacity-70 shadow"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle size={14} /> Save to Health Vault</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
