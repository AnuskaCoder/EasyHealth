import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Pill,
  Calendar,
  User,
  Stethoscope,
  Send,
  Download,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DoctorPrescription } from "../../types";

export const DoctorPrescriptionsPage: React.FC = () => {
  const { doctorPrescriptions, addDoctorPrescription, patientProfile } = useApp();

  // New Prescription Form State
  const [patientName, setPatientName] = useState(patientProfile.name);
  const [diagnosis, setDiagnosis] = useState("Microcytic Anemia & Sinus Tachycardia on exertion");
  const [bp, setBp] = useState("118/76");
  const [pulse, setPulse] = useState("78 bpm");
  const [notes, setNotes] = useState("Advised 2-3L fluid intake daily. Increase dietary heme iron with citrus juices.");
  const [followUp, setFollowUp] = useState("2026-12-24");

  const [medList, setMedList] = useState<
    { name: string; dosage: string; frequency: string; duration: string; timing: "Before Food" | "After Food" | "With Food" }[]
  >([
    { name: "Ferrous Ascorbate 100mg + Folic Acid", dosage: "1 tablet", frequency: "Twice daily", duration: "30 days", timing: "After Food" },
    { name: "Vitamin C 500mg Chewable", dosage: "1 tablet", frequency: "Once daily", duration: "30 days", timing: "After Food" },
  ]);

  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("1 tablet");
  const [newMedFreq, setNewMedFreq] = useState("Once daily");
  const [newMedDuration, setNewMedDuration] = useState("14 days");
  const [newMedTiming, setNewMedTiming] = useState<"Before Food" | "After Food" | "With Food">("After Food");

  const [successMsg, setSuccessMsg] = useState(false);

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    setMedList((prev) => [
      ...prev,
      {
        name: newMedName.trim(),
        dosage: newMedDosage,
        frequency: newMedFreq,
        duration: newMedDuration,
        timing: newMedTiming,
      },
    ]);
    setNewMedName("");
  };

  const handleRemoveMed = (index: number) => {
    setMedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (medList.length === 0) {
      alert("Please add at least one medication to the prescription.");
      return;
    }

    const newRx: DoctorPrescription = {
      id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      appointmentId: `APT-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: "p1",
      patientName,
      doctorId: "d1",
      doctorName: "Dr. Priya Sharma",
      doctorSpecialty: "Cardiologist",
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      vitals: { bp, pulse, temp: "98.4 F", weight: `${patientProfile.weight} kg` },
      medications: medList,
      notes,
      nextFollowUp: followUp,
    };

    addDoctorPrescription(newRx);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Digital Prescription Pad &amp; Clinical Notes</h1>
          <p className="text-xs text-blue-200 mt-1">
            Dr. Priya Sharma (Cardiology) • Digitally signed &amp; synchronized to patient EHR
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>Prescription successfully issued, signed, and transmitted to patient's active medication list!</span>
        </div>
      )}

      {/* Prescription Creator Form */}
      <form onSubmit={handleSubmitPrescription} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
          <Stethoscope size={16} className="text-blue-600" />
          Issue New Electronic Prescription (e-Rx)
        </h2>

        {/* Patient & Vitals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Pressure (mmHg)</label>
            <input
              type="text"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              placeholder="120/80"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Heart Pulse</label>
            <input
              type="text"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="76 bpm"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Clinical Diagnosis */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Clinical Diagnosis &amp; Findings</label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Iron Deficiency Anemia, Essential Hypertension..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium"
          />
        </div>

        {/* Medication Builder Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Pill size={14} className="text-emerald-600" />
              Prescribed Drug Regimen ({medList.length} items)
            </label>
          </div>

          {/* Current med items list */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {medList.map((med, index) => (
              <div key={index} className="p-3 bg-gray-50/50 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{med.name}</p>
                  <p className="text-gray-500 text-[11px]">
                    {med.dosage} • {med.frequency} • {med.timing} • Duration: {med.duration}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMed(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Medicine Subform */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 space-y-3">
            <p className="text-[11px] font-bold text-blue-900 uppercase">Add Medication to Prescription:</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medicine name & strength (e.g. Pantop 40mg)"
                className="sm:col-span-2 border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
              <input
                type="text"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 1 tab)"
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
              <select
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Thrice daily">Thrice daily</option>
                <option value="Once weekly">Once weekly</option>
                <option value="SOS / When needed">SOS / When needed</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newMedTiming}
                onChange={(e) => setNewMedTiming(e.target.value as any)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
              >
                <option value="After Food">After Food</option>
                <option value="Before Food">Before Food</option>
                <option value="With Food">With Food</option>
              </select>
              <input
                type="text"
                value={newMedDuration}
                onChange={(e) => setNewMedDuration(e.target.value)}
                placeholder="Duration (e.g. 30 days)"
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
              <button
                type="button"
                onClick={handleAddMed}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
              >
                <Plus size={14} /> Add Drug Line
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Advice & Follow-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor Advice / Lifestyle Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-xl p-3 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Recommended Follow-Up Date</label>
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow transition-all active:scale-95"
          >
            <Send size={15} /> Digitally Sign &amp; Dispatch Prescription
          </button>
        </div>
      </form>

      {/* History of Issued Prescriptions */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Previously Issued Prescriptions ({doctorPrescriptions.length})
        </h3>

        <div className="space-y-3">
          {doctorPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{rx.patientName}</span>
                  <span className="font-mono text-gray-400 font-semibold">{rx.id}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Signed e-Rx
                  </span>
                </div>
                <p className="text-gray-600">
                  Diagnosis: <strong>{rx.diagnosis}</strong> • Date: {rx.date}
                </p>
                <p className="text-gray-500">
                  {rx.medications.map((m) => m.name).join(" • ")}
                </p>
              </div>

              <button
                onClick={() => alert(`Prescription ${rx.id} downloaded.`)}
                className="p-2 border border-gray-300 hover:bg-white rounded-xl text-gray-600 self-start sm:self-center"
              >
                <Download size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
