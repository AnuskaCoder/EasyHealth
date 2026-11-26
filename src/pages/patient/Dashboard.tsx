import React from "react";
import {
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Stethoscope,
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock,
  Heart,
  TrendingUp,
  MessageCircle,
  Building2,
  Sparkles,
  Scan,
  Shield,
  Video,
  UserCheck,
  Droplet,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { doctors } from "../../data/doctors";

export const Dashboard: React.FC = () => {
  const {
    patientProfile,
    appointments,
    medications,
    reports,
    setCurrentPage,
    startTeleconsult,
    setShowSymptomAssistant,
    setShowOcrUpload,
    setSelectedReportForAi,
    setShowSecurityModal,
  } = useApp();

  const upcomingAppt = appointments.find(
    (a) => a.status === "upcoming" || a.status === "ongoing"
  );
  const lowStockMeds = medications.filter((m) => m.stock <= 10);
  const latestAnalyzedReport = reports.find((r) => r.aiAnalysed);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleJoinCall = () => {
    if (!upcomingAppt) return;
    const doc = doctors.find((d) => d.id === upcomingAppt.doctorId) || doctors[0];
    startTeleconsult(upcomingAppt, doc);
  };

  const quickActions = [
    { id: "find-doctors", label: "Find Doctors", icon: Stethoscope, color: "bg-blue-600", page: "find-doctors" },
    { id: "labs", label: "Full Body Checkup", icon: FlaskConical, color: "bg-purple-600", page: "labs" },
    { id: "pharmacy", label: "Buy Medicines", icon: Pill, color: "bg-emerald-600", page: "pharmacy" },
    { id: "blood-bank", label: "Urgent Blood", icon: Droplet, color: "bg-rose-600", page: "blood-bank" },
    { id: "symptom", label: "Symptom AI", icon: Heart, color: "bg-teal-600", action: () => setShowSymptomAssistant(true) },
    { id: "records", label: "Medical Records", icon: FileText, color: "bg-orange-500", page: "records" },
    { id: "ocr", label: "OCR Scan", icon: Scan, color: "bg-indigo-600", action: () => setShowOcrUpload(true) },
    { id: "chatbot", label: "RAG AI Chat", icon: MessageCircle, color: "bg-cyan-600", page: "chatbot" },
    { id: "emergency", label: "Emergency 24x7", icon: AlertTriangle, color: "bg-red-600", page: "emergency" },
  ];

  const healthStats = [
    { label: "Heart Rate", value: "78", unit: "bpm", icon: Heart, color: "text-red-500", bg: "bg-red-50", status: "Normal" },
    { label: "Blood Pressure", value: "118/76", unit: "mmHg", icon: Activity, color: "text-blue-500", bg: "bg-blue-50", status: "Optimal" },
    { label: "Blood Sugar (Fast)", value: "95", unit: "mg/dL", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", status: "Normal" },
    { label: "SpO2 Oxygen", value: "98", unit: "%", icon: Activity, color: "text-purple-500", bg: "bg-purple-50", status: "Normal" },
  ];

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      {/* Hero Greeting Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">{greeting()}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5">
              {patientProfile.name.split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              Your health profile is active • Blood: {patientProfile.bloodGroup} • Age: {patientProfile.age} yrs
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowSecurityModal(true)}
              className="bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Shield size={14} className="text-emerald-300" />
              <span>AES Vault Safe</span>
            </button>
            <button
              onClick={() => setCurrentPage("profile")}
              className="bg-white text-blue-800 text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-blue-50 transition-all shadow-xs"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Next Active Appointment Card */}
        {upcomingAppt && (
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={upcomingAppt.doctorImage}
                alt={upcomingAppt.doctorName}
                className="w-12 h-12 rounded-xl object-cover border border-white/30"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  Upcoming Consultation • {upcomingAppt.mode === "video" ? "📹 Telehealth" : "🏥 In-Person"}
                </span>
                <p className="font-bold text-sm text-white">{upcomingAppt.doctorName}</p>
                <p className="text-xs text-blue-200 flex items-center gap-2 mt-0.5">
                  <Clock size={12} /> {upcomingAppt.date} at {upcomingAppt.time} • {upcomingAppt.doctorSpecialty}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleJoinCall}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95"
              >
                <Video size={14} /> Join Video Consult
              </button>
              <button
                onClick={() => setCurrentPage("appointments")}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl"
              >
                Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Proactive Suggestion & OCR Fast Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Symptom Checker Prompt */}
        <div
          onClick={() => setShowSymptomAssistant(true)}
          className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-900 group-hover:text-teal-700">
                Feeling Unwell? Use AI Symptom Assessment
              </p>
              <p className="text-[11px] text-teal-700">
                Interactive triager identifies urgency level &amp; suggests the right doctor
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-teal-600 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Latest Lab Report AI Explanation */}
        {latestAnalyzedReport && (
          <div
            onClick={() => setSelectedReportForAi(latestAnalyzedReport)}
            className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Sparkles size={20} className="text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-purple-900 group-hover:text-purple-700 truncate">
                  AI Summary: {latestAnalyzedReport.name}
                </p>
                <p className="text-[11px] text-purple-700 truncate">
                  Tap to view biomarker breakdown, nutritional tips &amp; plain English insights
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-purple-600 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>

      {/* Low Stock Medication Alert */}
      {lowStockMeds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-900">
                Low Medication Stock Alert: {lowStockMeds.map((m) => m.name).join(", ")}
              </p>
              <p className="text-amber-700 text-[11px]">
                Under 10 tablets remaining. Order generic alternatives at up to 50% discount.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage("pharmacy")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all shadow-xs"
          >
            Refill Now
          </button>
        </div>
      )}

      {/* Urgent Blood Network Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Droplet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-rose-900">
                Urgent Blood Donation &amp; Bank Network
              </p>
              <span className="bg-red-100 text-red-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                Live Feed
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-0.5">
              4 critical blood requests nearby in Bangalore • Fast procurement &amp; verified on-call volunteer donors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage("blood-bank")}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
          >
            <span>Urgent Blood Bank</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
          Healthcare Services &amp; Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  if (action.action) action.action();
                  else if (action.page) setCurrentPage(action.page);
                }}
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all active:scale-95 text-left group"
              >
                <div className={`${action.color} p-2.5 rounded-xl text-white shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600 leading-tight">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Health Vitals Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Health Track &amp; Biometrics
          </h2>
          <button
            onClick={() => setCurrentPage("records")}
            className="text-xs text-blue-600 font-semibold flex items-center gap-0.5 hover:underline"
          >
            All Diagnostic Panels <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {healthStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-2xl p-4 border border-transparent shadow-xs space-y-1`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon size={16} className={stat.color} />
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {stat.status}
                  </span>
                </div>
                <p className="text-xl font-black text-gray-900">
                  {stat.value} <span className="text-xs font-normal text-gray-500">{stat.unit}</span>
                </p>
                <p className="text-xs font-semibold text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Appointments & Daily Meds Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appointments card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Care Appointments
            </h3>
            <button
              onClick={() => setCurrentPage("appointments")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-2">
            {appointments.slice(0, 2).map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={a.doctorImage}
                    alt={a.doctorName}
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{a.doctorName}</p>
                    <p className="text-[11px] text-gray-500">
                      {a.doctorSpecialty} • {a.date}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.status === "upcoming"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Meds card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Today's Prescriptions
            </h3>
            <button
              onClick={() => setCurrentPage("appointments")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Checklist
            </button>
          </div>

          <div className="space-y-2">
            {medications.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💊</span>
                  <div>
                    <p className="font-bold text-gray-900">{m.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {m.dosage} • {m.frequency}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.stock <= 10 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {m.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
