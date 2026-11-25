import React, { useState } from "react";
import {
  Zap, Eye, EyeOff, User, Stethoscope, Mail, Lock,
  Phone, ArrowRight, CheckCircle, AlertCircle, Sparkles,
  Shield, Activity, Heart, Pill, FlaskConical,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  loginAccount, registerAccount, seedDemoAccounts,
  saveSession, accountExists,
} from "../../services/authStorage";
import { PatientProfile, Doctor, DoctorCategory } from "../../types";

type AuthMode = "login" | "signup";
type SignupStep = "role" | "credentials" | "profile";

const COMMON_ALLERGIES = ["Penicillin", "Sulfa Drugs", "Dust Mites", "Peanuts", "Pollen", "Latex", "Aspirin"];
const COMMON_CONDITIONS = ["Mild Asthma", "Hypertension", "Type 2 Diabetes", "Hypothyroidism", "Migraine", "GERD", "None"];
const SPECIALTIES: DoctorCategory[] = ["Cardiologist","Neurologist","Orthopedic Surgeon","Dermatologist","Pediatrician","Gynecologist","Psychiatrist","Ophthalmologist","ENT Specialist","Endocrinologist","Gastroenterologist","General Physician","Emergency Medicine","Pulmonologist"];

export const LoginPage: React.FC = () => {
  const { registerPatient, registerDoctor } = useApp();
  seedDemoAccounts();

  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<SignupStep>("role");
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  // Shared credential fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Patient profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Female" | "Male" | "Other">("Female");
  const [dob, setDob] = useState("1996-01-01");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [height, setHeight] = useState<number | "">(164);
  const [weight, setWeight] = useState<number | "">(60);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");

  // Doctor profile fields
  const [specialty, setSpecialty] = useState<DoctorCategory>("Cardiologist");
  const [qualifications, setQualifications] = useState("MBBS, MD");
  const [experience, setExperience] = useState<number | "">(10);
  const [hospital, setHospital] = useState("");
  const [consultFee, setConsultFee] = useState<number | "">(800);
  const [emergencyFee, setEmergencyFee] = useState<number | "">(2000);
  const [languages, setLanguages] = useState("English, Hindi");
  const [about, setAbout] = useState("");

  const bmi = height && weight
    ? (Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1)
    : "--";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    setTimeout(() => {
      try {
        const account = loginAccount(email, password);
        saveSession({ role: account.role, userId: account.id, name: account.name, email: account.email, rememberMe, loginTime: Date.now() });
        if (account.role === "patient") registerPatient(account.profileData);
        else registerDoctor(account.profileData);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }, 600);
  };

  const handleSignupCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (accountExists(email)) { setError("An account with this email already exists. Please log in."); return; }
    setStep("profile");
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    setTimeout(() => {
      try {
        const profileName = role === "patient" ? name.trim() : (name.startsWith("Dr.") ? name.trim() : `Dr. ${name.trim()}`);
        if (!profileName || profileName === "Dr.") { setError("Please enter your name."); setLoading(false); return; }

        const profileData: PatientProfile | Doctor = role === "patient"
          ? { id: `p-${Date.now()}`, name: profileName, age: Number(age) || 25, gender, dob, phone, email, bloodGroup, height: Number(height) || 164, weight: Number(weight) || 60, allergies: allergies.length ? allergies : ["None"], chronicConditions: conditions.length ? conditions : ["None"], emergencyContact: emergencyContact || "Not provided", address: address || "India", pastSurgeries: [], vaccinations: [] }
          : { id: `d-${Date.now()}`, name: profileName, specialty, qualifications: qualifications.split(",").map(q => q.trim()), experience: Number(experience) || 5, hospital: hospital || "City Hospital", hospitalId: "h1", rating: 4.5, reviewCount: 0, consultFee: Number(consultFee) || 800, emergencyFee: Number(emergencyFee) || 2000, availableToday: true, nextSlot: "9:00 AM", languages: languages.split(",").map(l => l.trim()), about: about || `${specialty} with ${experience} years of experience.`, image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80", verified: true, online: true, patientsCount: 0, successRate: 95 };

        const account = registerAccount(role, profileName, email, phone, password, profileData);
        saveSession({ role, userId: account.id, name: profileName, email, rememberMe, loginTime: Date.now() });
        if (role === "patient") registerPatient(profileData as PatientProfile);
        else registerDoctor(profileData as Doctor);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }, 700);
  };

  const toggleAllergy = (a: string) => setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const toggleCondition = (c: string) => {
    if (c === "None") { setConditions(["None"]); return; }
    setConditions(prev => { const f = prev.filter(x => x !== "None"); return f.includes(c) ? f.filter(x => x !== c) : [...f, c]; });
  };

  const fillDemo = () => {
    setEmail(role === "patient" ? "patient@demo.com" : "doctor@demo.com");
    setPassword("demo1234");
    setRememberMe(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-stretch">
        {/* ── Left Panel: Branding ── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-b from-blue-700 to-indigo-800 rounded-3xl p-8 w-80 flex-shrink-0 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-2.5 rounded-2xl"><Zap size={22} className="text-white" /></div>
              <div>
                <p className="font-black text-white text-xl">EasyHealth</p>
                <p className="text-blue-200 text-xs font-medium">Complete Care Platform</p>
              </div>
            </div>
            <h2 className="text-white font-bold text-2xl leading-snug mb-3">Your health, smarter.</h2>
            <p className="text-blue-200 text-sm leading-relaxed">AI-powered consultations, real-time lab reports, home medicine delivery & more.</p>

            <div className="mt-8 space-y-3">
              {[
                { icon: Stethoscope, text: "15+ specialist categories" },
                { icon: FlaskConical, text: "Home blood & urine collection" },
                { icon: Pill, text: "Medicines at up to 55% off" },
                { icon: Activity, text: "AI symptom & report analysis" },
                { icon: Heart, text: "Emergency beds & ambulance" },
                { icon: Shield, text: "HIPAA-grade data security" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="bg-white/15 p-1.5 rounded-lg flex-shrink-0"><Icon size={14} className="text-white" /></div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-white/10 rounded-2xl p-4 border border-white/20">
            <p className="text-white/80 text-xs font-semibold mb-2">🎯 Demo Credentials</p>
            <div className="space-y-1 text-xs text-blue-200">
              <p><span className="text-white font-semibold">Patient:</span> patient@demo.com</p>
              <p><span className="text-white font-semibold">Doctor:</span> doctor@demo.com</p>
              <p><span className="text-white font-semibold">Password:</span> demo1234</p>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Auth Form ── */}
        <div className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="bg-blue-600 p-1.5 rounded-lg"><Zap size={16} className="text-white" /></div>
              <span className="font-black text-gray-900">EasyHealth</span>
            </div>
            {/* Mode tabs */}
            <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-xl text-xs font-bold ml-auto">
              <button onClick={() => { setMode("login"); setStep("role"); setError(""); }} className={`px-4 py-1.5 rounded-lg transition-all ${mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}>
                Sign In
              </button>
              <button onClick={() => { setMode("signup"); setStep("role"); setError(""); }} className={`px-4 py-1.5 rounded-lg transition-all ${mode === "signup" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}>
                Sign Up
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[75vh]">
            {/* ════════════════ LOGIN ════════════════ */}
            {mode === "login" && (
              <div className="max-w-sm mx-auto space-y-5">
                <div className="text-center">
                  <h1 className="text-2xl font-black text-gray-900">Welcome back 👋</h1>
                  <p className="text-gray-500 text-sm mt-1">Sign in to your EasyHealth account</p>
                </div>

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-3">
                  {(["patient", "doctor"] as const).map(r => (
                    <button key={r} type="button" onClick={() => { setRole(r); setError(""); }}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${role === r ? (r === "patient" ? "border-blue-500 bg-blue-50" : "border-indigo-500 bg-indigo-50") : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`p-2 rounded-xl ${r === "patient" ? "bg-blue-600" : "bg-indigo-600"}`}>
                        {r === "patient" ? <User size={18} className="text-white" /> : <Stethoscope size={18} className="text-white" />}
                      </div>
                      <span className="text-xs font-bold text-gray-800 capitalize">{r === "patient" ? "I'm a Patient" : "I'm a Doctor"}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder={role === "patient" ? "patient@demo.com" : "doctor@demo.com"}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">Password</label>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div onClick={() => setRememberMe(!rememberMe)}
                        className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 cursor-pointer ${rememberMe ? "bg-blue-600" : "bg-gray-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${rememberMe ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-800">Remember me</span>
                    </label>
                    <span className="text-xs text-gray-400">{rememberMe ? "Stay signed in for 30 days" : "Session only"}</span>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-blue-200">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Signing in...</span></> : <><span>Sign In</span><ArrowRight size={16} /></>}
                  </button>

                  {/* Demo autofill */}
                  <button type="button" onClick={fillDemo}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
                    <Sparkles size={13} /> Use Demo Account ({role})
                  </button>
                </form>

                <p className="text-center text-xs text-gray-500">
                  Don't have an account?{" "}
                  <button onClick={() => { setMode("signup"); setStep("role"); }} className="text-blue-600 font-bold hover:underline">Create one free</button>
                </p>
              </div>
            )}

            {/* ════════════════ SIGNUP ════════════════ */}
            {mode === "signup" && (
              <div className="max-w-2xl mx-auto">
                {/* Progress steps */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {(["role", "credentials", "profile"] as const).map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === s ? "text-blue-700" : (["role", "credentials", "profile"].indexOf(step) > i ? "text-green-600" : "text-gray-400")}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-blue-600 text-white" : (["role", "credentials", "profile"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500")}`}>
                          {["role", "credentials", "profile"].indexOf(step) > i ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <span className="hidden sm:block capitalize">{s === "role" ? "Role" : s === "credentials" ? "Account" : "Profile"}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-0.5 max-w-12 rounded ${["role", "credentials", "profile"].indexOf(step) > i ? "bg-green-400" : "bg-gray-200"}`} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1: Role */}
                {step === "role" && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <h2 className="text-xl font-black text-gray-900">Join EasyHealth</h2>
                      <p className="text-gray-500 text-sm mt-1">Choose how you'll use the platform</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      {(["patient", "doctor"] as const).map(r => (
                        <button key={r} onClick={() => setRole(r)}
                          className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${role === r ? (r === "patient" ? "border-blue-500 bg-blue-50 shadow-md" : "border-indigo-500 bg-indigo-50 shadow-md") : "border-gray-200 hover:border-gray-300"}`}>
                          <div className={`p-3 rounded-2xl ${r === "patient" ? "bg-blue-600" : "bg-indigo-600"}`}>
                            {r === "patient" ? <User size={28} className="text-white" /> : <Stethoscope size={28} className="text-white" />}
                          </div>
                          <div className="text-center">
                            <p className="font-extrabold text-sm text-gray-900">{r === "patient" ? "Patient" : "Doctor"}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{r === "patient" ? "Book doctors, buy medicines, lab tests" : "Manage patients, prescribe, analytics"}</p>
                          </div>
                          {role === r && <CheckCircle size={16} className={r === "patient" ? "text-blue-600" : "text-indigo-600"} />}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center">
                      <button onClick={() => setStep("credentials")}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
                        Continue as {role} <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Email + Password */}
                {step === "credentials" && (
                  <form onSubmit={handleSignupCredentials} className="space-y-4 max-w-sm mx-auto">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-black text-gray-900">Create your account</h2>
                      <p className="text-gray-500 text-sm">Set up your login credentials</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"
                          className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {[1,2,3,4].map(i => <div key={i} className={`flex-1 h-1 rounded-full transition-all ${password.length >= i * 2 ? (password.length >= 8 ? "bg-green-500" : "bg-amber-400") : "bg-gray-200"}`} />)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                          className={`w-full pl-10 pr-11 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${confirmPassword && confirmPassword !== password ? "border-red-400 bg-red-50" : confirmPassword && confirmPassword === password ? "border-green-400" : "border-gray-200 focus:border-blue-500"}`} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div onClick={() => setRememberMe(!rememberMe)}
                        className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 cursor-pointer ${rememberMe ? "bg-blue-600" : "bg-gray-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${rememberMe ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Remember me</p>
                        <p className="text-xs text-gray-400">{rememberMe ? "Stay signed in — no need to log in again" : "You'll need to log in every visit"}</p>
                      </div>
                    </label>

                    {error && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setStep("role")} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm">← Back</button>
                      <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                        Next: Profile <ArrowRight size={15} />
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Profile */}
                {step === "profile" && (
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div className="text-center mb-2">
                      <h2 className="text-xl font-black text-gray-900">{role === "patient" ? "Your Medical Profile" : "Your Doctor Profile"}</h2>
                      <p className="text-gray-500 text-sm">This personalises your AI assistant and health data</p>
                    </div>

                    {role === "patient" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                            <input type="number" min="1" max="120" value={age} onChange={e => setAge(Number(e.target.value) || "")} placeholder="25"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                            <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
                            <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white font-bold">
                              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 bg-blue-50 rounded-2xl p-3 border border-blue-100">
                          <div>
                            <label className="block text-xs font-semibold text-blue-800 mb-1">Height (cm)</label>
                            <input type="number" value={height} onChange={e => setHeight(Number(e.target.value) || "")}
                              className="w-full border-2 border-blue-200 rounded-xl px-3 py-2 text-sm bg-white font-bold" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-blue-800 mb-1">Weight (kg)</label>
                            <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value) || "")}
                              className="w-full border-2 border-blue-200 rounded-xl px-3 py-2 text-sm bg-white font-bold" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-blue-800 mb-1">BMI</label>
                            <div className="border-2 border-blue-200 rounded-xl px-3 py-2 text-sm bg-white font-bold text-blue-800">{bmi}</div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Known Allergies</label>
                          <div className="flex flex-wrap gap-1.5">
                            {COMMON_ALLERGIES.map(a => (
                              <button type="button" key={a} onClick={() => toggleAllergy(a)}
                                className={`text-xs px-3 py-1 rounded-full border transition-all ${allergies.includes(a) ? "bg-red-500 text-white border-red-500 font-semibold" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}>
                                {allergies.includes(a) ? "✓ " : ""}{a}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Chronic Conditions</label>
                          <div className="flex flex-wrap gap-1.5">
                            {COMMON_CONDITIONS.map(c => (
                              <button type="button" key={c} onClick={() => toggleCondition(c)}
                                className={`text-xs px-3 py-1 rounded-full border transition-all ${conditions.includes(c) ? "bg-amber-500 text-white border-amber-500 font-semibold" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}>
                                {conditions.includes(c) ? "✓ " : ""}{c}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact</label>
                            <input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="+91 XXXXX XXXXX (Name)"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="City, State"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                          </div>
                        </div>
                      </div>
                    )}

                    {role === "doctor" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Your Name"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Specialization</label>
                            <select value={specialty} onChange={e => setSpecialty(e.target.value as DoctorCategory)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Years of Experience</label>
                            <input type="number" value={experience} onChange={e => setExperience(Number(e.target.value) || "")} placeholder="10"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Qualifications</label>
                            <input value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="MBBS, MD, DM"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital / Clinic</label>
                            <input value={hospital} onChange={e => setHospital(e.target.value)} placeholder="Apollo Hospitals"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Consultation Fee (₹)</label>
                            <input type="number" value={consultFee} onChange={e => setConsultFee(Number(e.target.value) || "")} placeholder="800"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Languages Spoken</label>
                            <input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi"
                              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / About</label>
                          <textarea value={about} onChange={e => setAbout(e.target.value)} rows={2} placeholder="Brief professional background..."
                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setStep("credentials")} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm">← Back</button>
                      <button type="submit" disabled={loading}
                        className={`flex-1 font-bold py-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg ${role === "patient" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"}`}>
                        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Creating account...</span></> : <><span>Create Account</span><ArrowRight size={15} /></>}
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-center text-xs text-gray-500 pt-4">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(""); }} className="text-blue-600 font-bold hover:underline">Sign in</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
