import React, { useState } from "react";
import {
  X,
  Shield,
  Lock,
  Unlock,
  Key,
  CheckCircle,
  Eye,
  EyeOff,
  UserCheck,
  Server,
  FileCode,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const RbacSecurityModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { role, setRole, isVaultLocked, toggleVaultLock, patientProfile } = useApp();
  const [activeTab, setActiveTab] = useState<"rbac" | "vault">("rbac");

  const MOCK_CIPHERTEXT = {
    patientName: "U2FsdGVkX194A8sD1uN+qE1l4zG9Zkm2m81YpW6u0vA=",
    bloodGroup: "U2FsdGVkX18mP9+kLx4s21B8zW==",
    allergies: "U2FsdGVkX19zL8xM9pQ3W1aK4vL8xN0zQ2mK9pL1wA8sD1uN+qE=",
    chronicConditions: "U2FsdGVkX1+vP1mQ8zL3xN9wA8sD1uN+qE1l4zG9Zkm2m81=",
    cbcHemoglobin: "U2FsdGVkX1+kL9xP2wM4vN1zQ8sD1uN==",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
              <Shield size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Role-Based Access Control &amp; Data Vault</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  AES-256 GCM
                </span>
              </div>
              <p className="text-xs text-slate-300">
                End-to-end security matrix and cryptographic data protection
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 px-5 pt-3 gap-4 bg-gray-50">
          <button
            onClick={() => setActiveTab("rbac")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "rbac"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserCheck size={14} /> Role-Based Access Control (RBAC)
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "vault"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Lock size={14} /> Encrypted Health Vault Demo
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === "rbac" && (
            <div className="space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-900">Current Active Session Role: <span className="capitalize text-blue-700 underline">{role}</span></p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Switch between roles anytime to test permissions across the platform.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {(["patient", "doctor", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                        role === r ? "bg-blue-600 text-white shadow" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* RBAC Permission Matrix */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="p-3">Platform Capability</th>
                      <th className="p-3 text-center">Patient</th>
                      <th className="p-3 text-center">Doctor</th>
                      <th className="p-3 text-center">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { cap: "Create & Update Personal Health Profile", p: true, d: false, a: true },
                      { cap: "Search Doctors & Book Consultations", p: true, d: false, a: false },
                      { cap: "Upload Medical Reports & Run AI OCR", p: true, d: true, a: true },
                      { cap: "View Patient History (Consent Gated)", p: false, d: true, a: true },
                      { cap: "Upload & Issue Digital Prescriptions", p: false, d: true, a: false },
                      { cap: "Access Doctor Practice Analytics", p: false, d: true, a: true },
                      { cap: "Order Discount Medicines & Checkups", p: true, d: false, a: false },
                      { cap: "Manage Hospital Emergency Beds & Triage", p: false, d: true, a: true },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/70">
                        <td className="p-3 font-medium text-gray-800">{row.cap}</td>
                        <td className="p-3 text-center">
                          {row.p ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[10px]">✓</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {row.d ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[10px]">✓</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {row.a ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-blue-100 text-blue-600 font-bold text-[10px]">✓</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "vault" && (
            <div className="space-y-4 text-xs">
              {/* Vault status banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isVaultLocked
                    ? "bg-slate-900 text-white border-slate-800"
                    : "bg-emerald-50 text-emerald-900 border-emerald-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isVaultLocked ? "bg-amber-500/20 text-amber-400" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isVaultLocked ? <Lock size={20} /> : <Unlock size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {isVaultLocked ? "Vault Locked: Displaying Raw AES-256 Ciphertext" : "Vault Authorized: Verified Clinical Decrypted View"}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {isVaultLocked
                        ? "Sensitive patient health identifiers (PHI) are encrypted at rest with zero-knowledge keys."
                        : "Authenticated through biometric/token key session. Clinical values readable."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleVaultLock}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow transition-all ${
                    isVaultLocked ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-900 hover:bg-black text-white"
                  }`}
                >
                  {isVaultLocked ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{isVaultLocked ? "Unlock View" : "Lock & Encrypt"}</span>
                </button>
              </div>

              {/* Live Field Comparison Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                <div className="bg-gray-100 p-2.5 font-bold text-gray-700 flex justify-between text-[11px]">
                  <span>Field Name</span>
                  <span>Data Value in Vault</span>
                </div>

                <div className="p-3 flex justify-between items-center bg-white">
                  <span className="font-semibold text-gray-800">Patient Full Name</span>
                  <span className={`font-mono text-xs ${isVaultLocked ? "text-amber-600" : "text-gray-900 font-bold"}`}>
                    {isVaultLocked ? MOCK_CIPHERTEXT.patientName : patientProfile.name}
                  </span>
                </div>

                <div className="p-3 flex justify-between items-center bg-white">
                  <span className="font-semibold text-gray-800">Blood Group</span>
                  <span className={`font-mono text-xs ${isVaultLocked ? "text-amber-600" : "text-gray-900 font-bold"}`}>
                    {isVaultLocked ? MOCK_CIPHERTEXT.bloodGroup : patientProfile.bloodGroup}
                  </span>
                </div>

                <div className="p-3 flex justify-between items-center bg-white">
                  <span className="font-semibold text-gray-800">Known Allergies</span>
                  <span className={`font-mono text-xs ${isVaultLocked ? "text-amber-600" : "text-gray-900 font-bold"}`}>
                    {isVaultLocked ? MOCK_CIPHERTEXT.allergies : patientProfile.allergies.join(", ")}
                  </span>
                </div>

                <div className="p-3 flex justify-between items-center bg-white">
                  <span className="font-semibold text-gray-800">Chronic Conditions</span>
                  <span className={`font-mono text-xs ${isVaultLocked ? "text-amber-600" : "text-gray-900 font-bold"}`}>
                    {isVaultLocked ? MOCK_CIPHERTEXT.chronicConditions : patientProfile.chronicConditions.join(", ")}
                  </span>
                </div>

                <div className="p-3 flex justify-between items-center bg-white">
                  <span className="font-semibold text-gray-800">Recent CBC Hemoglobin</span>
                  <span className={`font-mono text-xs ${isVaultLocked ? "text-amber-600" : "text-gray-900 font-bold"}`}>
                    {isVaultLocked ? MOCK_CIPHERTEXT.cbcHemoglobin : "11.4 g/dL (Mild Low)"}
                  </span>
                </div>
              </div>

              {/* Cryptography details */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-[11px] text-gray-600 space-y-1">
                <p>
                  <strong>Cipher Suite:</strong> AES-256-GCM authenticated encryption with 96-bit initialization vectors.
                </p>
                <p>
                  <strong>Key Derivation:</strong> PBKDF2 with HMAC-SHA512 over 100,000 rounds.
                </p>
                <p>
                  <strong>Compliance:</strong> HIPAA Security Rule §164.312(a)(2)(iv) and GDPR Health Data Article 9.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
          >
            Close Security Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
