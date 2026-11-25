import React, { useState, useMemo } from "react";
import {
  Search, SlidersHorizontal, MapPin, Zap, Users,
  Building2, Stethoscope, X,
} from "lucide-react";
import { EmergencyBanner } from "../components/emergency/EmergencyBanner";
import { EmergencyAdmitModal } from "../components/emergency/EmergencyAdmitModal";
import { HospitalCard } from "../components/hospital/HospitalCard";
import { BedBookingModal } from "../components/hospital/BedBookingModal";
import { DoctorCard } from "../components/doctors/DoctorCard";
import { ConsultBookingModal } from "../components/doctors/ConsultBookingModal";
import { hospitals } from "../data/hospitals";
import { doctors } from "../data/doctors";
import { Hospital as HospitalType, Doctor } from "../types";

type TabId = "hospitals" | "doctors";

export const EmergencyPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>("hospitals");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHospitalId, setFilterHospitalId] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [showEmergencyAdmit, setShowEmergencyAdmit] = useState(false);
  const [bedBooking, setBedBooking] = useState<{ hospital: HospitalType; bedType: string } | null>(null);
  const [consultBooking, setConsultBooking] = useState<{ doctor: Doctor; mode: "regular" | "emergency" } | null>(null);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => set.add(d.specialty));
    return Array.from(set).sort();
  }, []);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.specialities.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.hospital.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHospital = filterHospitalId === "all" || d.hospitalId === filterHospitalId;
      const matchesSpecialty = filterSpecialty === "all" || d.specialty === filterSpecialty;
      return matchesSearch && matchesHospital && matchesSpecialty;
    });
  }, [searchQuery, filterHospitalId, filterSpecialty]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">EasyHealth</h1>
                <p className="text-xs text-gray-500">Emergency &amp; Hospital Services</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 font-medium">Live</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tab === "hospitals" ? "Search hospitals, specialities..." : "Search doctors, specialties..."}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-gray-100 p-1 rounded-xl">
            {[
              { id: "hospitals" as TabId, label: "Hospitals & Beds", icon: <Building2 size={14} /> },
              { id: "doctors" as TabId, label: "Doctors", icon: <Stethoscope size={14} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Emergency banner */}
        <EmergencyBanner
          onCallAmbulance={() => window.open("tel:108")}
          onAdmitNow={() => setShowEmergencyAdmit(true)}
        />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hospitals Nearby", value: hospitals.length, icon: <Building2 size={16} className="text-blue-500" /> },
            {
              label: "Beds Available",
              value: hospitals.reduce((s, h) => s + h.beds.reduce((a, b) => a + b.available, 0), 0),
              icon: <Users size={16} className="text-green-500" />,
            },
            {
              label: "Doctors Online",
              value: doctors.filter((d) => d.online).length,
              icon: <Stethoscope size={16} className="text-purple-500" />,
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Hospitals tab */}
        {tab === "hospitals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {filteredHospitals.length} hospital{filteredHospitals.length !== 1 ? "s" : ""} found
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                Sorted by distance
              </div>
            </div>
            {filteredHospitals.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">No hospitals match your search.</p>
              </div>
            ) : (
              filteredHospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  onBookBed={(h, bedType) => setBedBooking({ hospital: h, bedType })}
                  onViewDoctors={(id) => {
                    setFilterHospitalId(id);
                    setTab("doctors");
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Doctors tab */}
        {tab === "doctors" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <div className="flex items-center gap-1.5 flex-shrink-0 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <select
                  value={filterHospitalId}
                  onChange={(e) => setFilterHospitalId(e.target.value)}
                  className="text-xs text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">All Hospitals</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <Stethoscope size={13} className="text-gray-500" />
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="text-xs text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">All Specialties</option>
                  {allSpecialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {(filterHospitalId !== "all" || filterSpecialty !== "all") && (
                <button
                  onClick={() => { setFilterHospitalId("all"); setFilterSpecialty("all"); }}
                  className="flex-shrink-0 flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-medium"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-700">
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} found
            </p>

            {filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">No doctors match your filters.</p>
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBook={(d, mode) => setConsultBooking({ doctor: d, mode })}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEmergencyAdmit && (
        <EmergencyAdmitModal onClose={() => setShowEmergencyAdmit(false)} />
      )}
      {bedBooking && (
        <BedBookingModal
          hospital={bedBooking.hospital}
          initialBedType={bedBooking.bedType}
          onClose={() => setBedBooking(null)}
        />
      )}
      {consultBooking && (
        <ConsultBookingModal
          doctor={consultBooking.doctor}
          mode={consultBooking.mode}
          onClose={() => setConsultBooking(null)}
        />
      )}
    </div>
  );
};
