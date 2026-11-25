import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { hospitals } from "../../data/hospitals";
import { Button } from "../ui/Button";

interface EmergencyAdmitModalProps {
  onClose: () => void;
}

type Step = "symptoms" | "hospital" | "confirm" | "success";

const symptomOptions = [
  "Chest Pain / Heart Attack",
  "Difficulty Breathing",
  "Stroke / Loss of Consciousness",
  "Severe Injury / Trauma",
  "High Fever (> 104°F)",
  "Severe Allergic Reaction",
  "Poisoning / Overdose",
  "Seizure / Convulsions",
  "Severe Abdominal Pain",
  "Other Emergency",
];

export const EmergencyAdmitModal: React.FC<EmergencyAdmitModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<Step>("symptoms");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [bedType, setBedType] = useState<string>("Emergency");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1800);
  };

  const hospital = hospitals.find((h) => h.id === selectedHospital);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Emergency Admission</h3>
              <p className="text-xs text-gray-500">
                Step {step === "symptoms" ? 1 : step === "hospital" ? 2 : step === "confirm" ? 3 : 4} of 3
              </p>
            </div>
          </div>
          {step !== "success" && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* Step 1: Symptoms */}
          {step === "symptoms" && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select all symptoms that apply so we can assign the right emergency bed and doctor.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {symptomOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedSymptoms.includes(s)
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button
                fullWidth
                variant="emergency"
                size="lg"
                className="mt-5"
                disabled={selectedSymptoms.length === 0}
                onClick={() => setStep("hospital")}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2: Hospital + Bed */}
          {step === "hospital" && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Choose a nearby hospital with available emergency beds.</p>
              <div className="space-y-3 mb-5">
                {hospitals.map((h) => {
                  const emergencyBed = h.beds.find((b) => b.type === "Emergency");
                  const icuBed = h.beds.find((b) => b.type === "ICU");
                  const hasEmergencyBed = (emergencyBed?.available ?? 0) > 0;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHospital(h.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedHospital === h.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{h.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{h.distance} km away · ~{h.waitTime} min wait</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            hasEmergencyBed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {hasEmergencyBed ? `${emergencyBed?.available} beds` : "Full"}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-gray-500">
                          ICU: <b className={(icuBed?.available ?? 0) > 0 ? "text-green-600" : "text-red-600"}>{icuBed?.available ?? 0} free</b>
                        </span>
                        <span className="text-gray-500">
                          Emergency: <b className={hasEmergencyBed ? "text-green-600" : "text-red-600"}>{emergencyBed?.available ?? 0} free</b>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bed Type Required</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Emergency", "ICU", "Private", "General"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setBedType(type)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        bedType === type
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep("symptoms")}>← Back</Button>
                <Button
                  variant="emergency"
                  disabled={!selectedHospital}
                  onClick={() => setStep("confirm")}
                >
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Patient Details */}
          {step === "confirm" && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Enter patient details for admission registration.</p>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Hospital</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[200px]">{hospital?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bed Type</span>
                  <span className="font-semibold text-gray-800">{bedType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Wait Time</span>
                  <span className="font-semibold text-gray-800">~{hospital?.waitTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Symptoms</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[200px]">
                    {selectedSymptoms.slice(0, 2).join(", ")}
                    {selectedSymptoms.length > 2 && ` +${selectedSymptoms.length - 2} more`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep("hospital")}>← Back</Button>
                <Button
                  variant="emergency"
                  disabled={!patientName || !patientPhone}
                  loading={loading}
                  onClick={handleConfirm}
                >
                  Confirm Admission
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admission Confirmed!</h3>
              <p className="text-gray-500 text-sm mb-1">
                {hospital?.name} has been notified.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Expected wait: <span className="font-semibold text-gray-800">~{hospital?.waitTime} min</span>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-blue-800 mb-1">Reference ID</p>
                <p className="text-2xl font-bold text-blue-600 tracking-widest">
                  EH-{Math.floor(100000 + Math.random() * 900000)}
                </p>
                <p className="text-xs text-blue-500 mt-1">Show this at the emergency desk</p>
              </div>
              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outline"
                  icon={<span>📍</span>}
                  onClick={() => window.open(`https://maps.google.com/?q=${hospital?.name}`, "_blank")}
                >
                  Get Directions
                </Button>
                <Button fullWidth variant="primary" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
