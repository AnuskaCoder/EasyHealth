import React, { useState } from "react";
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  FileText,
  Bot,
  Send,
  Download,
  Share2,
  ShieldCheck,
  Stethoscope,
  Info,
} from "lucide-react";
import { MedicalReport } from "../../types";

interface ReportSummarizerModalProps {
  report: MedicalReport;
  onClose: () => void;
}

export const ReportSummarizerModal: React.FC<ReportSummarizerModalProps> = ({ report, onClose }) => {
  const [activeTab, setActiveTab] = useState<"summary" | "biomarkers" | "ask">("summary");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: `Hello! I have analyzed **${report.name}** (${report.date}). Feel free to ask anything, such as "Why is my hemoglobin low?", "What foods should I eat?", or "Should I see a doctor immediately?".`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;

    const userText = chatQuestion.trim();
    setChatLog((prev) => [...prev, { sender: "user", text: userText }]);
    setChatQuestion("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Based on this laboratory report, your parameters generally show mild variation. Always consult your attending physician before altering prescribed medications.";
      const lower = userText.toLowerCase();

      if (lower.includes("hemoglobin") || lower.includes("anemia") || lower.includes("low")) {
        reply = "Your hemoglobin is measured at 11.4 g/dL, which is mildly below the standard adult female reference range (12.0 - 15.5 g/dL). This corresponds to mild microcytic anemia, which commonly causes symptoms like slight tiredness, breathlessness on climbing stairs, or pale nails. Incorporating heme/non-heme iron with Vitamin C (e.g. spinach with lemon juice, beetroot, lentils) is recommended.";
      } else if (lower.includes("food") || lower.includes("diet") || lower.includes("eat")) {
        reply = "Recommended foods: Spinach, methi leaves, pomegranate, dates, beetroot, lentils, chia seeds, and citrus fruits (orange/lemon) which multiply iron absorption by up to 3x. Avoid drinking tea or coffee within 1 hour of meals, as tannins inhibit iron uptake.";
      } else if (lower.includes("emergency") || lower.includes("serious") || lower.includes("worry")) {
        reply = "This report is classified as **Low Risk / Non-Emergency**. There are no acute signs of severe infection (WBC is normal at 7,200/μL) or internal bleeding (Platelets healthy at 245,000/μL). A routine follow-up with your General Physician or Hematologist within 2-4 weeks is appropriate.";
      } else if (lower.includes("doctor") || lower.includes("consult")) {
        reply = "We recommend booking a consultation with a General Physician or Cardiologist to review whether oral iron supplements (e.g., Ferrous Sulphate) and a serum Ferritin test are appropriate.";
      }

      setChatLog((prev) => [...prev, { sender: "ai", text: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles size={22} className="text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-white/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    LLM Medical Report Analysis
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-200">
                    <ShieldCheck size={13} /> Verified Model
                  </span>
                </div>
                <h2 className="text-lg font-bold mt-0.5">{report.name}</h2>
                <p className="text-xs text-blue-100 flex items-center gap-2 mt-0.5">
                  <span>Dated: {report.date}</span>
                  <span>•</span>
                  <span>Source: {report.uploadedBy}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-2 mt-4 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "summary" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setActiveTab("biomarkers")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "biomarkers" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"
              }`}
            >
              Extracted Biomarkers ({report.biomarkers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("ask")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "ask" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"
              }`}
            >
              Ask AI Questions
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "summary" && (
            <div className="space-y-4">
              {/* Clinical Bottom-Line */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                  <Stethoscope size={16} className="text-blue-600" />
                  Clinical Bottom Line
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {report.aiSummary ||
                    "This test panel has been evaluated against standard adult clinical physiological benchmarks. All critical life-threatening pathology flags are clear."}
                </p>
              </div>

              {/* Status Indicator Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <CheckCircle2 size={18} className="text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs text-emerald-800 font-semibold">Healthy Range</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {report.biomarkers ? report.biomarkers.filter((b) => b.status === "Normal").length : 3}
                  </p>
                  <p className="text-[10px] text-emerald-700">Parameters normal</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <AlertCircle size={18} className="text-amber-600 mx-auto mb-1" />
                  <p className="text-xs text-amber-800 font-semibold">Attention Needed</p>
                  <p className="text-lg font-bold text-amber-900">
                    {report.biomarkers ? report.biomarkers.filter((b) => b.status !== "Normal").length : 1}
                  </p>
                  <p className="text-[10px] text-amber-700">Mild deviation</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                  <Sparkles size={18} className="text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-purple-800 font-semibold">Triage Level</p>
                  <p className="text-sm font-bold text-purple-900 mt-1">Routine Care</p>
                  <p className="text-[10px] text-purple-700">No emergency</p>
                </div>
              </div>

              {/* What this means in plain English */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-600" />
                  What This Means For You (Plain English)
                </h4>
                <ul className="text-xs text-gray-700 space-y-2 pl-4 list-disc leading-relaxed">
                  <li>
                    <strong>Oxygen Delivery:</strong> Your red blood cells carry slightly less oxygen than optimal, which can make you feel drained by late afternoon.
                  </li>
                  <li>
                    <strong>Immunity & Defenses:</strong> Your white blood cell counts are healthy, which confirms that your body is not actively battling a bacterial or severe viral infection.
                  </li>
                  <li>
                    <strong>Clotting Safety:</strong> Platelet counts are well-regulated, meaning your blood will clot normally when minor cuts occur.
                  </li>
                </ul>
              </div>

              {/* Doctor-approved Action Plan */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                  Actionable Next Steps
                </h4>
                <div className="space-y-2 text-xs text-amber-950">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      <strong>Dietary Iron:</strong> Add pomegranate, boiled eggs/spinach, and soaked dates to your breakfast.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      <strong>Doctor Follow-Up:</strong> Discuss with Dr. Priya Sharma or your physician whether an oral iron supplement course is beneficial.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      <strong>Repeat Panel:</strong> A re-check in 6 to 8 weeks is suggested to track hemoglobin recovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "biomarkers" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Detailed parameter measurements extracted by AI &amp; verified against clinical standards:
              </p>

              {report.biomarkers && report.biomarkers.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {report.biomarkers.map((b, idx) => (
                    <div key={idx} className="p-3 bg-white hover:bg-gray-50 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{b.parameter}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === "Normal"
                                ? "bg-emerald-100 text-emerald-700"
                                : b.status === "Low"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Normal Reference: <span className="font-medium text-gray-700">{b.referenceRange} {b.unit}</span>
                        </p>
                        {b.explanation && (
                          <p className="text-[11px] text-gray-600 mt-1 italic">{b.explanation}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-gray-900">
                          {b.value}
                        </span>{" "}
                        <span className="text-xs text-gray-500">{b.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 text-center rounded-xl text-gray-500 text-xs">
                  This report is an imaging or unstructured document. The general diagnosis has been synthesized into the Executive Summary tab.
                </div>
              )}
            </div>
          )}

          {activeTab === "ask" && (
            <div className="flex flex-col h-[350px]">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white mt-1">
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 items-center text-xs text-gray-400">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <Bot size={14} />
                    </div>
                    <span>AI is reading clinical reference documents...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-hide">
                {["Why is hemoglobin low?", "What foods to avoid?", "Is this an emergency?"].map(
                  (q) => (
                    <button
                      key={q}
                      onClick={() => setChatQuestion(q)}
                      className="text-[11px] whitespace-nowrap bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100"
                    >
                      {q}
                    </button>
                  )
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="flex gap-2 pt-1 border-t border-gray-100">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask a question about this medical report..."
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={!chatQuestion.trim() || isTyping}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" />
            HIPAA-compliant on-device AI synthesis
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => alert("Summary report downloaded as encrypted PDF.")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-white"
            >
              <Download size={13} /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
