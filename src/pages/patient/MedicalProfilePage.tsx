import React, { useState } from "react";
import {
  User,
  Heart,
  Activity,
  Shield,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  Save,
  Lock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PatientProfile } from "../../types";

export const MedicalProfilePage: React.FC = () => {
  const { patientProfile, setPatientProfile, setShowSecurityModal } = useApp();
  const [profile, setProfile] = useState<PatientProfile>(patientProfile);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [saved, setSaved] = useState(false);

  // BMI Calculation
  const heightInMeters = profile.height / 100;
  const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  const bmiCategory =
    Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal Weight" : "Overweight";

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergy.trim()) return;
    setProfile((prev) => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }));
    setNewAllergy("");
  };

  const handleRemoveAllergy = (allergy: string) => {
    setProfile((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a !== allergy) }));
  };

  const handleAddCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCondition.trim()) return;
    setProfile((prev) => ({ ...prev, chronicConditions: [...prev.chronicConditions, newCondition.trim()] }));
    setNewCondition("");
  };

  const handleRemoveCondition = (condition: string) => {
    setProfile((prev) => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter((c) => c !== condition),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/30">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <span className="bg-emerald-400 text-emerald-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                Active EHR
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Patient ID: #{profile.id} • {profile.gender}, {profile.age} yrs • Blood: {profile.bloodGroup}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSecurityModal(true)}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur border border-white/20 transition-all self-start sm:self-auto"
        >
          <Lock size={14} className="text-amber-300" />
          <span>AES-256 Vault Inspector</span>
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>Medical Profile &amp; Emergency Health Records successfully synchronized.</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Vitals & Demographics Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            Vitals &amp; Physical Demographics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Group</label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 bg-white"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Height (cm)</label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">BMI Index</label>
              <div className="border border-blue-200 bg-blue-50/60 rounded-xl px-3 py-2 text-xs">
                <span className="font-extrabold text-blue-900">{bmi}</span>{" "}
                <span className="text-[10px] text-blue-700">({bmiCategory})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Residential Address</label>
            <input
              type="text"
              value={profile.address || ""}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Clinical History & Allergies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Heart size={16} className="text-red-500" />
            Allergies &amp; Chronic Conditions
          </h2>

          {/* Allergies Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Known Drug / Environmental Allergies
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{allergy}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(allergy)}
                    className="hover:text-red-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add new allergy (e.g. Sulfa drugs, Peanuts)..."
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddAllergy}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Chronic Conditions Tag Input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Chronic Medical Diagnoses
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.chronicConditions.map((cond) => (
                <span
                  key={cond}
                  className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{cond}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond)}
                    className="hover:text-amber-950"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add chronic diagnosis (e.g. Hypertension, Hypothyroidism)..."
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Emergency Contact (Primary SOS Contact)
            </label>
            <input
              type="text"
              value={profile.emergencyContact}
              onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Save size={16} /> Save Medical Profile
          </button>
        </div>
      </form>
    </div>
  );
};
