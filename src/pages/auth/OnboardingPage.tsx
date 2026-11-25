import React, { useState } from "react";
import {
  User,
  Stethoscope,
  Heart,
  Activity,
  Shield,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Check,
  Plus,
  X,
  FileText,
  AlertCircle,
  Building2,
  DollarSign,
  Award,
  Globe,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PatientProfile, Doctor, DoctorCategory } from "../../types";

const COMMON_ALLERGIES = ["Penicillin", "Sulfa Drugs", "Dust Mites", "Peanuts", "Pollen", "Latex", "Seafood"];
const COMMON_CONDITIONS = ["Mild Asthma", "Hypertension", "Type 2 Diabetes", "Hypothyroidism", "Migraine", "None"];

export const OnboardingPage: React.FC = () => {
  const { registerPatient, registerDoctor } = useApp();

  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor">("patient");

  // Patient Form State
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Female" | "Male" | "Other">("Female");
  const [dob, setDob] = useState("1996-03-15");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [height, setHeight] = useState<number | "">(164);
  const [weight, setWeight] = useState<number | "">(58);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");

  // Doctor Form State
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState<DoctorCategory>("Cardiologist");
  const [qualifications, setQualifications] = useState("MBBS, MD, DM (Cardiology)");
  const [experience, setExperience] = useState<number | "">(15);
  const [hospital, setHospital] = useState("Apollo Hospitals");
  const [consultFee, setConsultFee] = useState<number | "">(1200);
  const [emergencyFee, setEmergencyFee] = useState<number | "">(2500);
  const [languages, setLanguages] = useState("English, Hindi");
  const [about, setAbout] = useState(
    "Senior specialist with expertise in complex clinical interventions, preventative care, and patient wellness."
  );

  // Live BMI calculation for patient
  const numHeight = Number(height) || 160;
  const numWeight = Number(weight) || 60;
  const heightMeters = numHeight / 100;
  const bmi = (numWeight / (heightMeters * heightMeters)).toFixed(1);
  const bmiCategory =
    Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal / Healthy" : "Overweight";

  // Allergies helpers
  const toggleAllergy = (al: string) => {
    if (allergies.includes(al)) {
      setAllergies(allergies.filter((x) => x !== al));
    } else {
      setAllergies([...allergies, al]);
    }
  };

  const addCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy("");
    }
  };

  // Conditions helpers
  const toggleCondition = (cond: string) => {
    if (cond === "None") {
      setChronicConditions(["None"]);
      return;
    }
    const filtered = chronicConditions.filter((x) => x !== "None");
    if (filtered.includes(cond)) {
      setChronicConditions(filtered.filter((x) => x !== cond));
    } else {
      setChronicConditions([...filtered, cond]);
    }
  };

  const addCustomCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCondition.trim() && !chronicConditions.includes(customCondition.trim())) {
      setChronicConditions([...chronicConditions.filter((x) => x !== "None"), customCondition.trim()]);
      setCustomCondition("");
    }
  };

  // Quick autofill buttons for testing
  const autofillPatient = () => {
    setPatientName("Ananya Krishnan");
    setAge(28);
    setGender("Female");
    setDob("1996-03-15");
    setPhone("+91 98765 43210");
    setEmail("ananya.k@example.com");
    setBloodGroup("B+");
    setHeight(164);
    setWeight(58);
    setAllergies(["Penicillin", "Dust Mites"]);
    setChronicConditions(["Mild Asthma"]);
    setEmergencyContact("+91 98765 00000 (Rohan Krishnan - Brother)");
    setAddress("Flat 402, Green Glen Layout, Bellandur, Bangalore 560103");
  };

  const autofillDoctor = () => {
    setDoctorName("Dr. Priya Sharma");
    setSpecialty("Cardiologist");
    setQualifications("MBBS, MD, DM (Cardiology), FACC");
    setExperience(18);
    setHospital("Apollo Hospitals");
    setConsultFee(1200);
    setEmergencyFee(2500);
    setLanguages("English, Hindi, Tamil");
    setAbout(
      "Senior interventional cardiologist with 18 years of expertise in clinical patient management, coronary care, and preventive cardiology."
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === "patient") {
      if (!patientName.trim()) {
        alert("Please enter the patient's full name.");
        return;
      }
      const newPatient: PatientProfile = {
        id: `p-${Date.now()}`,
        name: patientName.trim(),
        age: Number(age) || 28,
        gender,
        dob,
        phone: phone || "+91 98765 43210",
        email: email || `${patientName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        bloodGroup,
        height: Number(height) || 164,
        weight: Number(weight) || 58,
        allergies: allergies.length > 0 ? allergies : ["None"],
        chronicConditions: chronicConditions.length > 0 ? chronicConditions : ["None"],
        emergencyContact: emergencyContact || "Not provided",
        address: address || "City Center, Bangalore",
        pastSurgeries: [],
        vaccinations: ["COVID-19 (3 doses)"],
      };
      registerPatient(newPatient);
    } else {
      if (!doctorName.trim()) {
        alert("Please enter the doctor's name.");
        return;
      }
      const newDoc: Doctor = {
        id: `d-${Date.now()}`,
        name: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
        specialty,
        qualifications: qualifications.split(",").map((q) => q.trim()),
        experience: Number(experience) || 10,
        hospital: hospital || "Apollo Hospitals",
        hospitalId: "h1",
        rating: 4.9,
        reviewCount: 320,
        consultFee: Number(consultFee) || 1000,
        emergencyFee: Number(emergencyFee) || 2000,
        availableToday: true,
        nextSlot: "Today 11:30 AM",
        languages: languages.split(",").map((l) => l.trim()),
        about,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
        verified: true,
        online: true,
        patientsCount: 1500,
        successRate: 98,
      };
      registerDoctor(newDoc);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold">
            <Sparkles size={14} className="text-amber-300" />
            <span>Real-Time Onboarding &amp; Profile Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome to EasyHealth
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
            Please enter your details in real-time. Your personalized records, vitals, AI assistant, and dashboard will configure automatically.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-6 pb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-3">
            Step 1: Choose Your Role
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setSelectedRole("patient")}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                selectedRole === "patient"
                  ? "border-blue-600 bg-blue-50/60 shadow-md scale-102"
                  : "border-gray-200 bg-white hover:border-gray-300 opacity-70"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <User size={24} />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-sm text-gray-900">I am a Patient</p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Consult doctors, upload reports, buy medicines &amp; checkups
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("doctor")}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                selectedRole === "doctor"
                  ? "border-indigo-600 bg-indigo-50/60 shadow-md scale-102"
                  : "border-gray-200 bg-white hover:border-gray-300 opacity-70"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope size={24} />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-sm text-gray-900">I am a Doctor</p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Manage appointments, consult, prescribe &amp; view analytics
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
          {/* PATIENT REGISTRATION FORM */}
          {selectedRole === "patient" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Enter Patient Medical Details (In Real-Time)
                </h3>
                <button
                  type="button"
                  onClick={autofillPatient}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Prefill with Sample Data
                </button>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ananya Krishnan"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value) || "")}
                    placeholder="e.g. 28"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gender, DOB & Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 bg-white"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Physical Biometrics with Live BMI */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-blue-600" />
                  Biometrics &amp; Real-Time BMI Calculation:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1 font-medium">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value) || "")}
                      className="w-full border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1 font-medium">Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value) || "")}
                      className="w-full border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1 font-medium">Calculated BMI</label>
                    <div className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs">
                      <span className="font-extrabold text-blue-900">{bmi}</span>{" "}
                      <span className="text-[10px] text-emerald-700 font-bold">({bmiCategory})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Known Allergies with Clickable Chips */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Known Drug &amp; Environmental Allergies
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_ALLERGIES.map((al) => {
                    const active = allergies.includes(al);
                    return (
                      <button
                        type="button"
                        key={al}
                        onClick={() => toggleAllergy(al)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          active
                            ? "bg-red-500 text-white border-red-500 font-semibold"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {al}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    placeholder="Other allergy (e.g. Aspirin)..."
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomAllergy}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Chronic Diagnoses &amp; Pre-Existing Conditions
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_CONDITIONS.map((cond) => {
                    const active = chronicConditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          active
                            ? "bg-amber-500 text-white border-amber-500 font-semibold"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {cond}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    placeholder="Other condition..."
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomCondition}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Emergency Contact & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency SOS Contact (Name &amp; Phone)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98765 00000 (Relative / Guardian)"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Home Address (For Lab Home Pickup &amp; Pharmacy)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat / House number, Street, City"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DOCTOR REGISTRATION FORM */}
          {selectedRole === "doctor" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <Stethoscope size={16} className="text-indigo-600" />
                  Enter Doctor &amp; Practice Details (In Real-Time)
                </h3>
                <button
                  type="button"
                  onClick={autofillDoctor}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                >
                  Prefill with Sample Data
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Doctor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Medical Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as DoctorCategory)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 bg-white"
                  >
                    {[
                      "Cardiologist",
                      "Neurologist",
                      "Orthopedic Surgeon",
                      "Dermatologist",
                      "Pediatrician",
                      "Gynecologist",
                      "Psychiatrist",
                      "Ophthalmologist",
                      "ENT Specialist",
                      "Endocrinologist",
                      "Gastroenterologist",
                      "General Physician",
                      "Emergency Medicine",
                    ].map((sp) => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Qualifications &amp; Degrees
                  </label>
                  <input
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g. MBBS, MD, DM (Cardiology), FACC"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value) || "")}
                    placeholder="15"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hospital / Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Apollo Hospitals"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={consultFee}
                    onChange={(e) => setConsultFee(Number(e.target.value) || "")}
                    placeholder="1000"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={emergencyFee}
                    onChange={(e) => setEmergencyFee(Number(e.target.value) || "")}
                    placeholder="2500"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Languages Spoken
                </label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. English, Hindi, Tamil"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Doctor Bio &amp; Clinical Background
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Shield size={13} className="text-emerald-600" />
              Real-time encryption &amp; EHR synchronization active
            </span>

            <button
              type="submit"
              className={`px-8 py-3.5 rounded-2xl text-xs font-bold text-white shadow-lg flex items-center gap-2 active:scale-95 transition-all ${
                selectedRole === "patient"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <span>
                {selectedRole === "patient"
                  ? "Register Patient & Enter Platform"
                  : "Register Doctor & Launch Dashboard"}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
