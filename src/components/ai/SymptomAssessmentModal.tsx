import React, { useState } from "react";
import {
  X,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Calendar,
  HeartPulse,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DoctorCategory } from "../../types";

const COMMON_SYMPTOMS = [
  { id: "chest_pain", label: "Chest pain / Tightness", category: "Cardiologist" as DoctorCategory, urgency: "critical" },
  { id: "breathlessness", label: "Shortness of breath / Wheezing", category: "Pulmonologist" as DoctorCategory, urgency: "high" },
  { id: "fever", label: "High fever & body chills", category: "General Physician" as DoctorCategory, urgency: "medium" },
  { id: "rash", label: "Skin rash / Itching / Redness", category: "Dermatologist" as DoctorCategory, urgency: "low" },
  { id: "joint_pain", label: "Joint pain / Swelling / Stiffness", category: "Orthopedic Surgeon" as DoctorCategory, urgency: "medium" },
  { id: "headache", label: "Severe headache / Migraine", category: "Neurologist" as DoctorCategory, urgency: "medium" },
  { id: "stomach_pain", label: "Acid reflux / Abdominal cramp", category: "Gastroenterologist" as DoctorCategory, urgency: "medium" },
  { id: "ear_throat", label: "Sore throat / Earache / Sinus", category: "ENT Specialist" as DoctorCategory, urgency: "low" },
  { id: "anxiety", label: "Anxiety / Panic / Sleep issues", category: "Psychiatrist" as DoctorCategory, urgency: "low" },
  { id: "pediatric", label: "Child health / Growth issue", category: "Pediatrician" as DoctorCategory, urgency: "medium" },
];

export const SymptomAssessmentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setCurrentPage } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSymptom, setSelectedSymptom] = useState<typeof COMMON_SYMPTOMS[0] | null>(null);
  const [customSymptom, setCustomSymptom] = useState("");
  const [duration, setDuration] = useState("1-3 days");
  const [severity, setSeverity] = useState(5);
  const [hasRedFlags, setHasRedFlags] = useState(false);
  const [redFlagsChecked, setRedFlagsChecked] = useState<string[]>([]);

  const handleNextFromSymptom = (sym: typeof COMMON_SYMPTOMS[0]) => {
    setSelectedSymptom(sym);
    setStep(2);
  };

  const handleCustomNext = () => {
    if (!customSymptom.trim()) return;
    setSelectedSymptom({
      id: "custom",
      label: customSymptom,
      category: "General Physician",
      urgency: "medium",
    });
    setStep(2);
  };

  const calculateTriage = () => {
    const isCriticalSymptom = selectedSymptom?.urgency === "critical";
    const isHighSeverity = severity >= 8;
    const anyRedFlags = redFlagsChecked.length > 0;

    if (isCriticalSymptom || isHighSeverity || anyRedFlags) {
      return {
        level: "Urgent Attention Needed",
        color: "bg-red-50 text-red-700 border-red-200",
        badge: "bg-red-600 text-white",
        desc: "Your symptoms indicate severe discomfort or potential red flag indicators. An immediate medical consultation or emergency evaluation is advised.",
        action: "emergency",
      };
    }
    if (severity >= 5 || selectedSymptom?.urgency === "high") {
      return {
        level: "Priority Doctor Consultation",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        badge: "bg-amber-500 text-white",
        desc: "Your symptoms warrant professional clinical assessment within 24 to 48 hours to prevent escalation.",
        action: "appointment",
      };
    }
    return {
      level: "Routine Care & Observation",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "bg-emerald-600 text-white",
      desc: "Your symptoms appear mild to moderate. Rest, hydration, and a routine physician visit are suggested.",
      action: "appointment",
    };
  };

  const triage = calculateTriage();

  const handleBookSpecialist = () => {
    onClose();
    setCurrentPage("find-doctors");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <HeartPulse size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">AI Symptom Assessment Assistant</h2>
              <p className="text-xs text-teal-100">Step {step} of 4 • Clinical Triaging</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                What is your primary symptom or health concern?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_SYMPTOMS.map((sym) => (
                  <button
                    key={sym.id}
                    onClick={() => handleNextFromSymptom(sym)}
                    className="text-left p-3 rounded-xl border border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-xs font-semibold text-gray-800 flex items-center justify-between group"
                  >
                    <span>{sym.label}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-teal-600" />
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Or type your symptom in your own words:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="e.g. Dizziness when standing up, mild shivering..."
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-600"
                  />
                  <button
                    onClick={handleCustomNext}
                    disabled={!customSymptom.trim()}
                    className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs text-teal-800 font-medium">
                Evaluating: <strong>{selectedSymptom?.label}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  How long have you had this symptom?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Less than 24 hours", "1 - 3 days", "1 - 2 weeks", "More than a month"].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`p-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        duration === dur
                          ? "border-teal-600 bg-teal-50 text-teal-800 font-bold"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Severity Rating (1 to 10)
                  </label>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      severity >= 8 ? "bg-red-100 text-red-700" : severity >= 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    Level {severity} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1 - Mild / Annoying</span>
                  <span>5 - Moderate</span>
                  <span>10 - Severe / Debilitating</span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 px-3 py-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-teal-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-teal-700"
                >
                  Continue to Red Flags
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert size={16} className="text-red-600" />
                Critical Red Flag Screening
              </div>
              <p className="text-xs text-gray-600">
                Do you experience any of the following emergency warning indicators?
              </p>

              <div className="space-y-2">
                {[
                  "Pain radiating down left arm, neck or jaw",
                  "Sudden numbness or weakness in face or limbs",
                  "High fever (>103°F) with stiff neck or delirium",
                  "Severe breathlessness even while resting",
                  "Coughing up blood or dark vomiting",
                ].map((rf) => {
                  const isChecked = redFlagsChecked.includes(rf);
                  return (
                    <label
                      key={rf}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked ? "border-red-500 bg-red-50 text-red-900 font-medium" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setRedFlagsChecked([...redFlagsChecked, rf]);
                          else setRedFlagsChecked(redFlagsChecked.filter((x) => x !== rf));
                        }}
                        className="mt-0.5 rounded text-red-600"
                      />
                      <span>{rf}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 px-3 py-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-teal-700 flex items-center gap-1"
                >
                  Generate Assessment <Sparkles size={13} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Triage Banner */}
              <div className={`p-4 rounded-2xl border ${triage.color} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${triage.badge}`}>
                    {triage.level}
                  </span>
                  <span className="text-xs font-bold">Severity: {severity}/10</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">{triage.desc}</p>
              </div>

              {/* Recommended Specialist */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope size={15} className="text-blue-600" />
                    Recommended Medical Specialist
                  </span>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    95% Match
                  </span>
                </div>
                <p className="text-base font-extrabold text-blue-950">
                  {selectedSymptom?.category || "General Physician"}
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  Doctors in this field specialize in evaluating {selectedSymptom?.label.toLowerCase()} and related clinical root causes.
                </p>
              </div>

              {/* Self-care Advice */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
                <h4 className="text-xs font-bold text-gray-700">Self-Care &amp; Pre-Visit Advice:</h4>
                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                  <li>Drink adequate room-temperature fluids and avoid strenuous exertion.</li>
                  <li>Do not consume heavy or spicy meals if gastrointestinal symptoms are present.</li>
                  <li>Keep a record of your temperature, blood pressure, and symptom triggers.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleBookSpecialist}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow"
                >
                  <Calendar size={15} /> Book Appointment with {selectedSymptom?.category}
                </button>
                <button
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Close &amp; Save to Health Log
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
