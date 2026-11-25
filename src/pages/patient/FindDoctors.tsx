import React, { useState, useMemo } from "react";
import { Search, X, Star, Clock, MapPin, Video, Zap, CheckCircle, ChevronDown, ChevronUp, Globe, Filter } from "lucide-react";
import { doctors, doctorCategories } from "../../data/doctors";
import { Doctor } from "../../types";
import { useApp } from "../../context/AppContext";

const timeSlots = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM"];

const BookModal: React.FC<{ doctor: Doctor; mode: "video"|"in-person"|"emergency"; onClose: () => void; }> = ({ doctor, mode, onClose }) => {
  const { addAppointment } = useApp();
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const fee = mode === "emergency" ? doctor.emergencyFee : doctor.consultFee;
  const refId = `APT-${Math.floor(100000 + Math.random() * 900000)}`;

  const confirm = () => {
    if (!name || !phone || (!slot && mode !== "emergency")) return;
    setLoading(true);
    setTimeout(() => {
      addAppointment({ id: refId, doctorId: doctor.id, doctorName: doctor.name, doctorSpecialty: doctor.specialty, doctorImage: doctor.image, patientId: "p1", date: new Date().toISOString().split("T")[0], time: slot || "Now", mode, status: mode === "emergency" ? "ongoing" : "upcoming", hospital: doctor.hospital, fee, symptoms });
      setLoading(false); setDone(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className={`flex items-center gap-3 p-4 rounded-t-2xl ${mode === "emergency" ? "bg-red-50" : "bg-blue-50"} border-b`}>
          <img src={doctor.image} className="w-10 h-10 rounded-xl object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{doctor.name}</p>
            <p className="text-xs text-gray-500">{mode === "emergency" ? "⚡ Emergency" : mode === "video" ? "📹 Video" : "🏥 In-Person"} · ₹{fee.toLocaleString()}</p>
          </div>
          {!done && <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded-lg"><X size={18} className="text-gray-500" /></button>}
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {done ? (
            <div className="text-center py-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={32} className="text-green-600" /></div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Booked!</h3>
              <p className="text-gray-500 text-sm mb-4">{mode === "emergency" ? `${doctor.name} has been alerted.` : `Appointment confirmed with ${doctor.name}.`}</p>
              <div className="bg-blue-50 rounded-xl p-3 mb-4"><p className="text-xs text-blue-600 mb-1">Booking ID</p><p className="text-xl font-bold text-blue-700 tracking-wider">{refId}</p></div>
              <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              {mode !== "emergency" && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Select Time Slot</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((t) => (
                      <button key={t} onClick={() => setSlot(t)} className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${slot === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
              {mode === "emergency" && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">⚡ The doctor will be notified immediately. Response within minutes.</div>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Symptoms <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2} placeholder="Describe your symptoms..." className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700">Cancel</button>
                <button onClick={confirm} disabled={!name || !phone || loading || (!slot && mode !== "emergency")} className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all ${mode === "emergency" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50`}>
                  {loading ? "Booking..." : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
  const [expanded, setExpanded] = useState(false);
  const [booking, setBooking] = useState<null | "video" | "in-person" | "emergency">(null);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-shrink-0">
              <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-2xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              {doctor.online && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm">{doctor.name}</h3>
                    {doctor.verified && <CheckCircle size={13} className="text-blue-500" />}
                  </div>
                  <p className="text-xs text-blue-600 font-semibold">{doctor.specialty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-gray-800">{doctor.rating}</span>
                  <span className="text-xs text-gray-400">({doctor.reviewCount.toLocaleString()})</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500"><MapPin size={11} /><span className="truncate">{doctor.hospital}</span></div>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-gray-500">{doctor.experience} yrs exp</span>
                <span className={`font-semibold flex items-center gap-1 ${doctor.availableToday ? "text-green-600" : "text-orange-500"}`}><Clock size={11} />{doctor.nextSlot}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-blue-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Consult</p><p className="text-sm font-bold text-blue-700">₹{doctor.consultFee.toLocaleString()}</p></div>
            <div className="flex-1 bg-green-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Patients</p><p className="text-sm font-bold text-green-700">{(doctor.patientsCount / 1000).toFixed(1)}K+</p></div>
            <div className="flex-1 bg-purple-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Success</p><p className="text-sm font-bold text-purple-700">{doctor.successRate}%</p></div>
          </div>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-600 leading-relaxed">{doctor.about}</p>
              <div className="flex flex-wrap gap-1">{doctor.qualifications.map(q => <span key={q} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q}</span>)}</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><Globe size={12} />{doctor.languages.join(", ")}</div>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 mt-2 text-xs text-gray-400 py-1">
            {expanded ? <><span>Less</span><ChevronUp size={12} /></> : <><span>More info</span><ChevronDown size={12} /></>}
          </button>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setBooking("video")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-blue-500 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-all">
              <Video size={14} />Video Consult
            </button>
            <button onClick={() => setBooking("in-person")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all">
              Book Appointment
            </button>
            <button onClick={() => setBooking("emergency")} className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all">
              <Zap size={14} />
            </button>
          </div>
        </div>
      </div>
      {booking && <BookModal doctor={doctor} mode={booking} onClose={() => setBooking(null)} />}
    </>
  );
};

export const FindDoctors: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const filtered = useMemo(() => doctors.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()) || d.hospital.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || d.specialty === activeCategory;
    const matchAvail = !availableOnly || d.availableToday;
    const matchOnline = !onlineOnly || d.online;
    return matchSearch && matchCat && matchAvail && matchOnline;
  }), [search, activeCategory, availableOnly, onlineOnly]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors, specialties..." className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-gray-400" /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border-2 transition-all ${showFilters ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500"}`}>
          <Filter size={16} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3 flex gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="rounded" /><span>Available Today</span></label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="rounded" /><span>Online Now</span></label>
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {[{ label: "All", icon: "🏥" }, ...doctorCategories].map((cat) => {
          const label = typeof cat === "string" ? cat : cat.label;
          const icon = typeof cat === "object" ? cat.icon : "🏥";
          const isAll = label === "All";
          return (
            <button key={label} onClick={() => setActiveCategory(label)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${activeCategory === label ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
              <span>{isAll ? "🏥" : icon}</span>{label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mb-3 font-medium">{filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found</p>
      <div className="space-y-3 pb-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><p className="text-gray-400">No doctors match your search.</p></div>
        ) : (
          filtered.map((d) => <DoctorCard key={d.id} doctor={d} />)
        )}
      </div>
    </div>
  );
};
