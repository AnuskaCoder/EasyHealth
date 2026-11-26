import React, { useState, useEffect } from "react";
import {
  FileText, Upload, Scan, Sparkles, Search, Download,
  ShieldCheck, Calendar, Tag, Plus, Trash2, FilePlus,
  FlaskConical, Pill, Heart, X, ChevronDown, ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MedicalReport, ReportType } from "../../types";
import { AddMedicalRecordModal } from "../../components/records/AddMedicalRecordModal";
import { recordApi } from "../../services/api";

// ─── Report type icon map ─────────────────────────────────────────────────────
const REPORT_ICONS: Record<string, string> = {
  "Blood Test": "🩸", "Urine Test": "🧪", "X-Ray": "🩻",
  MRI: "🧠", "CT Scan": "📡", ECG: "❤️",
  Prescription: "💊", "Full Body Panel": "🏥", Other: "📄",
};

const REPORT_TYPES = ["All", "Blood Test", "Urine Test", "X-Ray", "MRI", "CT Scan", "ECG", "Prescription", "Full Body Panel", "Other"];

// ─── Quick Add Form (inline, no modal needed) ─────────────────────────────────
const QuickAddForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addReport } = useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<ReportType>("Blood Test");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [center, setCenter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Report name is required."); return; }
    if (!center.trim()) { setError("Hospital / lab name is required."); return; }
    setError("");
    setSaving(true);
    setTimeout(() => {
      addReport({
        id: `r-${Date.now()}`,
        name: name.trim(),
        type,
        date,
        uploadedBy: center.trim(),
        fileName: file?.name,
        fileUrl: file ? URL.createObjectURL(file) : "#",
        aiSummary: `${type} from ${center.trim()} on ${date}. Added manually by patient.`,
        aiAnalysed: false,
        tags: [type],
        isEncrypted: true,
      });
      setSaving(false);
      onDone();
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
          <Plus size={16} /> Quick Add Report
        </p>
        <button type="button" onClick={onDone} className="p-1 hover:bg-blue-100 rounded-lg">
          <X size={16} className="text-blue-600" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-700">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Report Name *</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Complete Blood Count, Lipid Profile, HbA1c..."
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Report Type</label>
          <select value={type} onChange={e => setType(e.target.value as ReportType)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500">
            {REPORT_TYPES.filter(t => t !== "All").map(t => (
              <option key={t} value={t}>{REPORT_ICONS[t]} {t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Report Date</label>
          <input
            type="date" value={date} max={new Date().toISOString().split("T")[0]}
            onChange={e => setDate(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital / Diagnostic Lab *</label>
          <input
            value={center} onChange={e => setCenter(e.target.value)}
            placeholder="e.g. Apollo Diagnostics, Dr. Lal PathLabs..."
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Attach File <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl px-3 py-2.5 cursor-pointer transition-colors bg-white">
            <Upload size={15} className="text-gray-400" />
            <span className="text-sm text-gray-500 truncate">
              {file ? file.name : "PDF, JPG, PNG"}
            </span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onDone}
          className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Plus size={15} /> Save Record</>
          )}
        </button>
      </div>
    </form>
  );
};

// ─── Report Card ──────────────────────────────────────────────────────────────
const ReportCard: React.FC<{
  report: MedicalReport;
  onAiExplain: () => void;
  onDelete: () => void;
}> = ({ report, onAiExplain, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl flex-shrink-0">
          {REPORT_ICONS[report.type] || "📄"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate">{report.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {report.uploadedBy} · {report.date}
              </p>
            </div>
            {/* Badges */}
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                {report.type}
              </span>
              {report.aiAnalysed && (
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={9} /> AI
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {report.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI Summary expandable */}
          {report.aiSummary && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Hide summary" : "Show AI summary"}
              </button>
              {expanded && (
                <p className="mt-1.5 text-xs text-gray-600 italic bg-gray-50 border border-gray-100 rounded-xl p-2.5 leading-relaxed">
                  "{report.aiSummary}"
                </p>
              )}
            </div>
          )}

          {/* Biomarkers preview */}
          {report.biomarkers && report.biomarkers.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {report.biomarkers.slice(0, 4).map((bm, i) => (
                <div key={i} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border ${
                  bm.status === "Normal" ? "bg-green-50 border-green-100 text-green-800" :
                  bm.status === "Low" ? "bg-amber-50 border-amber-100 text-amber-800" :
                  bm.status === "High" ? "bg-red-50 border-red-100 text-red-800" :
                  "bg-red-100 border-red-200 text-red-900"
                }`}>
                  <span className="font-medium truncate">{bm.parameter}</span>
                  <span className="font-bold ml-1 flex-shrink-0">{bm.value} {bm.unit}</span>
                </div>
              ))}
              {report.biomarkers.length > 4 && (
                <div className="col-span-2 text-xs text-gray-400 text-center">
                  +{report.biomarkers.length - 4} more parameters
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onAiExplain}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <Sparkles size={13} className="text-amber-300" /> AI Explain
        </button>

        {report.fileUrl && report.fileUrl !== "#" ? (
          <a
            href={report.fileUrl}
            download={report.fileName || "report"}
            className="flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <Download size={13} /> Download
          </a>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-400 px-3 py-2">
            <FileText size={13} /> Details only
          </span>
        )}

        <button
          onClick={onDelete}
          className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-400 rounded-xl transition-all"
          title="Delete record"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const MedicalRecordsPage: React.FC = () => {
  const { reports, addReport, updateReport, setSelectedReportForAi, setShowOcrUpload } = useApp();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [showFullModal, setShowFullModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Try loading records from backend; fall back to context
  const [localReports, setLocalReports] = useState<MedicalReport[]>(reports);

  useEffect(() => {
    recordApi.getAll().then(result => {
      if (result.data?.data?.length) {
        setLocalReports(result.data.data);
      } else {
        setLocalReports(reports);
      }
    }).catch(() => setLocalReports(reports));
  }, [reports]);

  // Keep in sync with context when new reports are added locally
  useEffect(() => { setLocalReports(reports); }, [reports]);

  const deleteReport = async (id: string) => {
    // Try backend delete first
    await recordApi.delete(id).catch(() => {});
    setLocalReports(prev => prev.filter(r => r.id !== id));
  };

  const filtered = localReports.filter(r => {
    const matchType = selectedType === "All" || r.type === selectedType;
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.uploadedBy.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const isFirstTime = localReports.length === 0;

  return (
    <>
      {showFullModal && <AddMedicalRecordModal onClose={() => setShowFullModal(false)} />}

      <div className="space-y-5 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 bg-white/20 text-blue-100 text-xs font-bold px-2.5 py-1 rounded-full mb-2 w-fit">
                <ShieldCheck size={12} className="text-emerald-300" /> AES-256 Encrypted Vault
              </div>
              <h1 className="text-xl font-black">Medical Records</h1>
              <p className="text-xs text-blue-200 mt-1">
                {isFirstTime
                  ? "No records yet — add your first report below."
                  : `${localReports.length} report${localReports.length !== 1 ? "s" : ""} · securely stored`}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowQuickAdd(true); setShowFullModal(false); }}
                className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap shadow">
                <Plus size={14} /> Quick Add
              </button>
              <button onClick={() => setShowOcrUpload(true)}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap">
                <Scan size={14} /> Scan / Upload
              </button>
            </div>
          </div>
        </div>

        {/* ── EMPTY STATE for brand-new users ─────────────────── */}
        {isFirstTime && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-blue-400" />
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-1">No medical records yet</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                Add your existing reports manually, upload a file, or scan a physical report to get started. Your AI assistant will analyse each report automatically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <button
                  onClick={() => { setShowQuickAdd(true); }}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-800">Quick Add</p>
                    <p className="text-[11px] text-blue-500">Enter basic details</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowFullModal(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FilePlus size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-800">Add with Values</p>
                    <p className="text-[11px] text-indigo-500">Include test parameters</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowOcrUpload(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scan size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-800">Scan Report</p>
                    <p className="text-[11px] text-purple-500">OCR extract values</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Common tests guide */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FlaskConical size={14} className="text-blue-500" /> Common tests to add first
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: "Complete Blood Count", icon: "🩸", type: "Blood Test" },
                  { name: "Blood Sugar (Fasting)", icon: "🔬", type: "Blood Test" },
                  { name: "Lipid Profile", icon: "❤️", type: "Blood Test" },
                  { name: "Thyroid (TSH)", icon: "🦋", type: "Blood Test" },
                  { name: "Urine Routine", icon: "🧪", type: "Urine Test" },
                  { name: "Recent Prescription", icon: "💊", type: "Prescription" },
                ].map(test => (
                  <button
                    key={test.name}
                    onClick={() => { setShowQuickAdd(true); }}
                    className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-all text-left"
                  >
                    <span className="text-base">{test.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">{test.name}</p>
                      <p className="text-[10px] text-gray-400">{test.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Form (inline) */}
        {showQuickAdd && (
          <QuickAddForm onDone={() => setShowQuickAdd(false)} />
        )}

        {/* Records exist — show search + list */}
        {!isFirstTime && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Reports", value: localReports.length, icon: "📋" },
                { label: "AI Analysed", value: localReports.filter(r => r.aiAnalysed).length, icon: "🤖" },
                { label: "Types", value: [...new Set(localReports.map(r => r.type))].length, icon: "📂" },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-lg font-black text-gray-900">{s.value}</div>
                  <div className="text-[10px] text-gray-500 font-semibold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, lab, tag..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Type filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {REPORT_TYPES.map(type => (
                <button key={type} onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedType === type
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}>
                  {type !== "All" && REPORT_ICONS[type]} {type}
                </button>
              ))}
            </div>

            {/* Add more button */}
            <div className="flex gap-2">
              <button onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl transition-all">
                <Plus size={13} /> Quick Add
              </button>
              <button onClick={() => setShowFullModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-all">
                <FilePlus size={13} /> Add with Test Values
              </button>
            </div>

            {/* Report cards */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <FileText size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">No records match your filter</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search or type filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-medium">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  {selectedType !== "All" ? ` · ${selectedType}` : ""}
                </p>
                {filtered.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onAiExplain={() => setSelectedReportForAi(report)}
                    onDelete={() => deleteReport(report.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
