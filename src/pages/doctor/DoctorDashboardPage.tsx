import React from "react";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Video,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronRight,
  ShieldAlert,
  Stethoscope,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { doctors } from "../../data/doctors";

export const DoctorDashboardPage: React.FC = () => {
  const {
    appointments,
    startTeleconsult,
    setCurrentPage,
    consentPermissions,
    doctorPrescriptions,
  } = useApp();

  const doctor = doctors[0]; // Dr. Priya Sharma
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === doctor.id || a.doctorSpecialty === doctor.specialty
  );
  const todayUpcoming = doctorAppointments.filter((a) => a.status === "upcoming" || a.status === "ongoing");

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Doctor Profile Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{doctor.name}</h1>
              <span className="bg-emerald-400 text-emerald-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Online &amp; Active
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              {doctor.specialty} • {doctor.hospital} • {doctor.experience} yrs Experience
            </p>
            <p className="text-[11px] text-gray-300 mt-1">
              Qualifications: {doctor.qualifications.join(", ")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={() => setCurrentPage("doctor-prescriptions")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
          >
            <Plus size={14} /> Write Prescription
          </button>
          <button
            onClick={() => setCurrentPage("doctor-analytics")}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
          >
            <TrendingUp size={14} /> Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <Calendar size={18} />
            <span className="text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded-full text-blue-700">Today</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{todayUpcoming.length || 2}</p>
          <p className="text-xs text-gray-500 font-medium">Scheduled Consults</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <Users size={18} />
            <span className="text-[10px] font-bold bg-purple-50 px-2 py-0.5 rounded-full text-purple-700">Lifetime</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{doctor.patientsCount.toLocaleString()}+</p>
          <p className="text-xs text-gray-500 font-medium">Treated Patients</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <TrendingUp size={18} />
            <span className="text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-700">Monthly</span>
          </div>
          <p className="text-2xl font-black text-gray-900">₹1,84,000</p>
          <p className="text-xs text-gray-500 font-medium">Consultation Revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <Star size={18} />
            <span className="text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded-full text-amber-700">
              {doctor.reviewCount} reviews
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">{doctor.rating} / 5</p>
          <p className="text-xs text-gray-500 font-medium">Patient Satisfaction</p>
        </div>
      </div>

      {/* Main Schedule & Patient Queue */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            Today's Patient Consultation Queue
          </h2>
          <button
            onClick={() => setCurrentPage("doctor-appointments")}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Manage Schedule →
          </button>
        </div>

        <div className="space-y-3">
          {doctorAppointments.map((appt) => (
            <div
              key={appt.id}
              className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">
                    {appt.patientName || "Ananya Krishnan"}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({appt.patientAge || 28} yrs, {appt.patientGender || "Female"})
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      appt.status === "upcoming"
                        ? "bg-blue-100 text-blue-800"
                        : appt.status === "ongoing"
                        ? "bg-emerald-100 text-emerald-800 animate-pulse"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 flex items-center gap-3">
                  <span>⏰ {appt.time}</span>
                  <span>•</span>
                  <span>{appt.mode === "video" ? "📹 Telehealth Video" : "🏥 In-Hospital"}</span>
                  <span>•</span>
                  <span>Fee: ₹{appt.fee}</span>
                </p>
                {appt.symptoms && (
                  <p className="text-xs text-blue-700 bg-blue-50/80 p-2 rounded-xl border border-blue-100">
                    Chief Complaint: "{appt.symptoms}"
                  </p>
                )}
              </div>

              {/* Consultation Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => startTeleconsult(appt, doctor)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Video size={14} /> Start Consultation
                </button>
                <button
                  onClick={() => setCurrentPage("doctor-patients")}
                  className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold px-3 py-2 rounded-xl text-xs"
                >
                  View EHR History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consent-gated Patient Records */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Patient History Permissions
            </h3>
            <button
              onClick={() => setCurrentPage("doctor-patients")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Access Directory →
            </button>
          </div>
          <p className="text-xs text-gray-500">
            You hold active HIPAA patient-granted access to {consentPermissions.filter((c) => c.status === "granted").length} patient records.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
            <span>Ananya Krishnan granted full EHR access for consultation #APT-849102.</span>
          </div>
        </div>

        {/* Issued Prescriptions */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Recent Prescriptions
            </h3>
            <button
              onClick={() => setCurrentPage("doctor-prescriptions")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Prescription Pad →
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {doctorPrescriptions.length} digital prescriptions signed and transmitted to pharmacy network.
          </p>
          {doctorPrescriptions.slice(0, 1).map((rx) => (
            <div key={rx.id} className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-900 space-y-1">
              <div className="flex justify-between font-bold">
                <span>{rx.id} • {rx.patientName}</span>
                <span>{rx.date}</span>
              </div>
              <p className="text-gray-600">Diagnosis: {rx.diagnosis}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
