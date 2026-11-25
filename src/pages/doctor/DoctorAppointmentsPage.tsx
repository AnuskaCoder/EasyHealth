import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  Pill,
  User,
  Filter,
  Search,
  Phone,
  MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { doctors } from "../../data/doctors";
import { Appointment } from "../../types";

export const DoctorAppointmentsPage: React.FC = () => {
  const {
    appointments,
    updateAppointmentStatus,
    startTeleconsult,
    setCurrentPage,
  } = useApp();

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const doctor = doctors[0];

  const filtered = appointments.filter((a) => {
    const matchFilter = filter === "all" || a.status === filter;
    const matchSearch =
      (a.patientName || "Ananya").toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      (a.symptoms || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">
            Appointment Management Schedule
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Dr. Priya Sharma • Cardiology Clinic &amp; Virtual Telehealth Suite
          </p>
        </div>

        <div className="flex gap-2">
          <span className="bg-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold">
            {appointments.length} Total Bookings
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, booking ID, or reported symptoms..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {["all", "upcoming", "ongoing", "completed", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
                filter === st
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filtered.map((appt) => (
          <div
            key={appt.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {appt.patientName ? appt.patientName.charAt(0) : "A"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">
                      {appt.patientName || "Ananya Krishnan"}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">#{appt.id}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Patient Age: {appt.patientAge || 28} yrs • Blood Group: B+
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    appt.status === "upcoming"
                      ? "bg-blue-100 text-blue-800"
                      : appt.status === "ongoing"
                      ? "bg-emerald-100 text-emerald-800 animate-pulse"
                      : appt.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {appt.status}
                </span>
                <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">
                  ₹{appt.fee}
                </span>
              </div>
            </div>

            {/* Time & Symptoms info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span>Date: <strong>{appt.date}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" />
                <span>Time Slot: <strong>{appt.time}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Video size={14} className="text-blue-600" />
                <span>Mode: <strong className="capitalize">{appt.mode} Consult</strong></span>
              </div>
            </div>

            {appt.symptoms && (
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-xs text-blue-900">
                <strong>Reported Symptoms / Chief Complaint:</strong> {appt.symptoms}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage("doctor-patients")}
                  className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  View Patient History
                </button>
                <button
                  onClick={() => setCurrentPage("doctor-prescriptions")}
                  className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 flex items-center gap-1"
                >
                  <Pill size={13} /> Write Rx
                </button>
              </div>

              <div className="flex gap-2">
                {appt.status !== "completed" && (
                  <button
                    onClick={() => startTeleconsult(appt, doctor)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Video size={13} /> Start Consultation
                  </button>
                )}

                {appt.status === "upcoming" && (
                  <button
                    onClick={() => updateAppointmentStatus(appt.id, "completed")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                  >
                    <CheckCircle size={13} /> Mark Completed
                  </button>
                )}

                {appt.status !== "cancelled" && appt.status !== "completed" && (
                  <button
                    onClick={() => updateAppointmentStatus(appt.id, "cancelled")}
                    className="text-gray-400 hover:text-red-600 text-xs font-semibold px-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
