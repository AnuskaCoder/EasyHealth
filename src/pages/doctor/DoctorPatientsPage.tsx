import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  FileText,
  Heart,
  Activity,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle,
  Eye,
  Pill,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const DoctorPatientsPage: React.FC = () => {
  const {
    patientProfile,
    reports,
    medications,
    consentPermissions,
    grantConsent,
    revokeConsent,
    setSelectedReportForAi,
  } = useApp();

  // For Dr. Priya Sharma (d1)
  const currentConsent = consentPermissions.find((c) => c.doctorId === "d1");
  const isGranted = currentConsent?.status === "granted";

  const [activePatientTab, setActivePatientTab] = useState<"records" | "vitals" | "prescriptions">("records");

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> HIPAA §164 Consent Protocol
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Patient EHR Records Directory
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Access to patient medical history is strictly governed by patient authorization.
          </p>
        </div>

        {/* Consent Status Toggle */}
        <div className="bg-white/10 border border-white/20 p-3 rounded-2xl flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isGranted ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {isGranted ? <Unlock size={18} /> : <Lock size={18} />}
          </div>
          <div>
            <p className="text-xs font-bold">
              {isGranted ? "Access Status: Granted" : "Access Status: Restricted"}
            </p>
            <p className="text-[10px] text-gray-300">
              {isGranted ? "Authorized by Ananya K." : "Consent requested"}
            </p>
          </div>
          <button
            onClick={() => {
              if (isGranted) revokeConsent("d1");
              else grantConsent("d1");
            }}
            className="ml-2 bg-white text-blue-950 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-blue-50 transition-all shadow-xs"
          >
            {isGranted ? "Revoke (Demo)" : "Grant Access"}
          </button>
        </div>
      </div>

      {/* Patient Profile Summary Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-xl">
            AK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{patientProfile.name}</h2>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                DOB: {patientProfile.dob}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {patientProfile.age} yrs • {patientProfile.gender} • Blood Group:{" "}
              <strong className="text-gray-900">{patientProfile.bloodGroup}</strong> • Height: {patientProfile.height}cm • Weight: {patientProfile.weight}kg
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Emergency Contact: {patientProfile.emergencyContact}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-xl">
            <strong>Allergies:</strong> {patientProfile.allergies.join(", ")}
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-xl">
            <strong>Conditions:</strong> {patientProfile.chronicConditions.join(", ")}
          </div>
        </div>
      </div>

      {/* Content Gating */}
      {!isGranted ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h3 className="font-bold text-lg text-gray-900">
            Patient Consent Required to View History
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            In compliance with healthcare data regulations, you cannot review diagnostic reports or clinical notes until the patient authorizes access.
          </p>
          <button
            onClick={() => grantConsent("d1")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow transition-all"
          >
            Grant Patient Authorization (Demo)
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Sub Navigation */}
          <div className="flex border-b border-gray-200 gap-4 text-xs font-bold text-gray-500">
            <button
              onClick={() => setActivePatientTab("records")}
              className={`pb-2 transition-all border-b-2 ${
                activePatientTab === "records" ? "border-blue-600 text-blue-600" : "border-transparent"
              }`}
            >
              Diagnostic Reports ({reports.length})
            </button>
            <button
              onClick={() => setActivePatientTab("prescriptions")}
              className={`pb-2 transition-all border-b-2 ${
                activePatientTab === "prescriptions" ? "border-blue-600 text-blue-600" : "border-transparent"
              }`}
            >
              Active Medications ({medications.length})
            </button>
            <button
              onClick={() => setActivePatientTab("vitals")}
              className={`pb-2 transition-all border-b-2 ${
                activePatientTab === "vitals" ? "border-blue-600 text-blue-600" : "border-transparent"
              }`}
            >
              Surgical History &amp; Vaccines
            </button>
          </div>

          {/* Diagnostic Reports Tab */}
          {activePatientTab === "records" && (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{r.name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        {r.type}
                      </span>
                      <span className="text-gray-400">({r.date})</span>
                    </div>
                    {r.aiSummary && (
                      <p className="text-gray-600 italic bg-gray-50 p-2 rounded-xl border border-gray-100">
                        "{r.aiSummary}"
                      </p>
                    )}
                    {r.biomarkers && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {r.biomarkers.map((b, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              b.status === "Normal"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {b.parameter}: {b.value} {b.unit} ({b.status})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedReportForAi(r)}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 self-start sm:self-center"
                  >
                    <Sparkles size={12} /> AI Clinical Breakdown
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Medications Tab */}
          {activePatientTab === "prescriptions" && (
            <div className="space-y-3">
              {medications.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-gray-900">{m.name}</h4>
                    <p className="text-gray-500">
                      Dosage: {m.dosage} • Frequency: {m.frequency} • Prescriber: {m.prescribedBy}
                    </p>
                    {m.instructions && (
                      <p className="text-[11px] text-blue-700 mt-0.5">Instructions: {m.instructions}</p>
                    )}
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                    Active Regimen
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Vitals & Surgeries Tab */}
          {activePatientTab === "vitals" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Past Surgical Procedures
                </h4>
                <div className="flex gap-2">
                  {(patientProfile.pastSurgeries || ["Appendectomy (2019)"]).map((surg) => (
                    <span key={surg} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-xl font-medium">
                      ✓ {surg}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Immunization Record
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(patientProfile.vaccinations || ["COVID-19 (3 doses)", "Hepatitis B", "Tetanus (2024)"]).map((vac) => (
                    <span key={vac} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl font-medium">
                      ✓ {vac}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
