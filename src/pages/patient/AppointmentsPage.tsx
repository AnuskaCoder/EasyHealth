import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Pill,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  User,
  Zap,
  PhoneCall,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Appointment } from "../../types";
import { doctors } from "../../data/doctors";

export const AppointmentsPage: React.FC = () => {
  const {
    appointments,
    updateAppointmentStatus,
    startTeleconsult,
    medications,
    toggleMedicationTaken,
    setCurrentPage,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"appointments" | "medications">("appointments");
  const [appointmentFilter, setAppointmentFilter] = useState<string>("all");

  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === "all") return true;
    return a.status === appointmentFilter;
  });

  const handleJoinConsult = (appt: Appointment) => {
    const doc = doctors.find((d) => d.id === appt.doctorId) || doctors[0];
    startTeleconsult(appt, doc);
  };

  // Medication adherence calculation
  const totalDoses = medications.reduce((sum, m) => sum + m.taken.length, 0);
  const takenDoses = medications.reduce(
    (sum, m) => sum + m.taken.filter((t) => t).length,
    0
  );
  const adherenceScore = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Selector Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">
            Care Schedule &amp; Medication Reminders
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Track your doctor appointments, join live video consultations, and maintain your daily prescription adherence checklist.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-black/20 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "appointments" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"
            }`}
          >
            Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("medications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "medications" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"
            }`}
          >
            Medication Tracker ({medications.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          {/* Status Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: "all", label: "All Appointments" },
              { id: "upcoming", label: "Upcoming" },
              { id: "ongoing", label: "Ongoing / Active" },
              { id: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setAppointmentFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  appointmentFilter === f.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Appointments List */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 text-gray-400 space-y-3">
                <Calendar size={40} className="mx-auto text-gray-300" />
                <p className="text-sm font-semibold">No appointments found.</p>
                <button
                  onClick={() => setCurrentPage("find-doctors")}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Book New Appointment
                </button>
              </div>
            ) : (
              filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={appt.doctorImage}
                      alt={appt.doctorName}
                      className="w-14 h-14 rounded-2xl object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{appt.doctorName}</h3>
                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {appt.doctorSpecialty}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            appt.status === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : appt.status === "ongoing"
                              ? "bg-emerald-100 text-emerald-800 animate-pulse"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <Calendar size={13} /> {appt.date}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <Clock size={13} /> {appt.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {appt.hospital}
                        </span>
                      </p>
                      {appt.symptoms && (
                        <p className="text-xs text-gray-600 italic">
                          Reported Symptoms: "{appt.symptoms}"
                        </p>
                      )}
                      {appt.notes && (
                        <p className="text-xs text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                          Doctor Note: {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {(appt.status === "upcoming" || appt.status === "ongoing") && (
                      <button
                        onClick={() => handleJoinConsult(appt)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                      >
                        <Video size={14} />
                        <span>Join Live Video Consult</span>
                      </button>
                    )}

                    {appt.status === "upcoming" && (
                      <button
                        onClick={() => {
                          updateAppointmentStatus(appt.id, "cancelled");
                          alert("Appointment cancelled.");
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    )}

                    {appt.status === "completed" && (
                      <button
                        onClick={() => setCurrentPage("find-doctors")}
                        className="px-3.5 py-2 border border-blue-600 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50"
                      >
                        Book Follow-Up
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Medications & Reminders */}
      {activeTab === "medications" && (
        <div className="space-y-4">
          {/* Adherence Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Weekly Adherence Rate
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-gray-900">{adherenceScore}%</span>
                <span className="text-xs text-emerald-600 font-bold">Good compliance</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You took {takenDoses} of {totalDoses} scheduled prescription doses this week.
              </p>
            </div>

            <button
              onClick={() => setCurrentPage("pharmacy")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <Pill size={14} /> Buy Medicine Refills
            </button>
          </div>

          {/* Daily Schedule Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Active Prescribed Medications:
            </h3>

            {medications.map((med) => (
              <div
                key={med.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                      💊
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{med.name}</h4>
                      <p className="text-xs text-gray-500">
                        {med.dosage} • {med.frequency} • Prescribed by {med.prescribedBy}
                      </p>
                      {med.instructions && (
                        <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                          Note: {med.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        med.stock <= 10
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {med.stock} pills remaining
                    </span>
                    {med.stock <= 10 && (
                      <button
                        onClick={() => setCurrentPage("pharmacy")}
                        className="block text-[10px] text-red-600 font-bold hover:underline mt-1"
                      >
                        Refill now →
                      </button>
                    )}
                  </div>
                </div>

                {/* 7-Day Dose Tick Checklist */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    7-Day Dose Check-in:
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                      const isTaken = med.taken[idx];
                      return (
                        <button
                          key={day}
                          onClick={() => toggleMedicationTaken(med.id, idx)}
                          className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                            isTaken
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-[10px] font-normal">{day}</span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              isTaken ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isTaken ? "✓" : "•"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
