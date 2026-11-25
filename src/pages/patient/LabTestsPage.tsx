import React, { useState } from "react";
import {
  FlaskConical,
  Home,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
  Phone,
  UserCheck,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { labTests, labCategories } from "../../data/labTests";
import { LabTest, HomeCollectionBooking } from "../../types";

export const LabTestsPage: React.FC = () => {
  const { homeBookings, addHomeBooking, patientProfile } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingTest, setBookingTest] = useState<LabTest | null>(null);

  // Booking Modal Form State
  const [collectionDate, setCollectionDate] = useState("2026-11-29");
  const [collectionSlot, setCollectionSlot] = useState("7:00 AM - 8:00 AM");
  const [sampleType, setSampleType] = useState<"Blood" | "Urine" | "Blood & Urine">("Blood & Urine");
  const [address, setAddress] = useState(
    patientProfile.address || "Flat 402, Green Glen Layout, Bellandur, Bangalore"
  );
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filteredTests = labTests.filter((t) => {
    const matchCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleConfirmHomeCollection = () => {
    if (!bookingTest) return;
    addHomeBooking({
      packageId: bookingTest.id,
      packageName: bookingTest.name,
      patientName: patientProfile.name,
      sampleType,
      date: collectionDate,
      timeSlot: collectionSlot,
      address,
      fee: bookingTest.finalPrice,
    });
    setBookingSuccess(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-purple-100 text-xs font-bold px-3 py-1 rounded-full mb-2 backdrop-blur-md">
            <Home size={14} className="text-amber-300" /> Doorstep Phlebotomy Service
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Full Body Health Checkups &amp; Home Sample Collection
          </h1>
          <p className="text-xs text-purple-100 mt-1 max-w-xl leading-relaxed">
            NABL &amp; CAP accredited diagnostic labs. Certified phlebotomists collect blood &amp; urine
            samples directly from your home with 100% sterile vacutainers. Digital reports in 6–24 hours.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center text-xs">
          <p className="text-amber-300 font-bold text-base">FREE Home Pickup</p>
          <p className="text-purple-100 text-[11px]">On all health packages &gt; ₹500</p>
        </div>
      </div>

      {/* Active Home Bookings Tracker */}
      {homeBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Clock size={15} className="text-blue-600" />
            Your Active Home Sample Pickups
          </h3>
          <div className="space-y-2">
            {homeBookings.map((b) => (
              <div
                key={b.id}
                className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">{b.packageName}</span>
                    <span className="bg-purple-200 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-0.5">
                    📅 {b.date} • ⏰ {b.timeSlot} • 🧪 Sample: {b.sampleType}
                  </p>
                  {b.phlebotomistName && (
                    <p className="text-blue-700 font-semibold mt-1 flex items-center gap-1 text-[11px]">
                      <UserCheck size={13} /> Technician: {b.phlebotomistName} ({b.phlebotomistPhone})
                    </p>
                  )}
                </div>

                <div className="text-right sm:text-right">
                  <span className="font-mono text-purple-900 font-bold text-xs">{b.id}</span>
                  <p className="text-[10px] text-gray-500">Live GPS tracking active</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search health checkups, blood tests, thyroid, diabetes panel, urine tests..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {labCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tests and Full Body Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className={`bg-white rounded-2xl border ${
              test.popular ? "border-purple-300 ring-2 ring-purple-100" : "border-gray-200"
            } overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                  {test.category}
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {test.discountPct}% OFF
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">
                {test.name}
              </h3>
              <p className="text-xs text-gray-500 mb-3">{test.description}</p>

              {/* Included parameters badge list */}
              {test.includes && (
                <div className="bg-purple-50/60 rounded-xl p-3 mb-3 border border-purple-100 space-y-1">
                  <p className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">
                    All-Included Tests ({test.includes.length} Tests):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {test.includes.map((inc, i) => (
                      <span
                        key={i}
                        className="bg-white text-purple-900 border border-purple-200 text-[10px] px-2 py-0.5 rounded-md font-medium"
                      >
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-gray-400" /> Report in {test.reportTime}
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Home size={13} /> Home Collection Included
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 pt-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-gray-900">₹{test.finalPrice}</span>
                  <span className="text-xs text-gray-400 line-through">₹{test.price}</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold">
                  Save ₹{test.price - test.finalPrice}
                </p>
              </div>

              <button
                onClick={() => {
                  setBookingTest(test);
                  setBookingSuccess(false);
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1"
              >
                Book Home Pickup <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Home Collection Booking Modal */}
      {bookingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Home size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Schedule Home Sample Collection</h3>
                  <p className="text-xs text-purple-100">{bookingTest.name}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingTest(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 text-xs">
              {bookingSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Home Collection Scheduled!
                  </h3>
                  <p className="text-gray-500">
                    A certified phlebotomist with sterile blood/urine collection kits will arrive at your address on{" "}
                    <strong>{collectionDate}</strong> between <strong>{collectionSlot}</strong>.
                  </p>
                  <div className="bg-purple-50 p-3 rounded-2xl text-purple-900 font-mono font-bold">
                    Ref ID: #HC-{Math.floor(1000 + Math.random() * 9000)}
                  </div>
                  <button
                    onClick={() => setBookingTest(null)}
                    className="w-full bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-800"
                  >
                    View My Orders &amp; Track Status
                  </button>
                </div>
              ) : (
                <>
                  {/* Sample Type Selection */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">
                      Sample Types Required for Collection:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Blood", "Urine", "Blood & Urine"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSampleType(st)}
                          className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                            sampleType === st
                              ? "border-purple-600 bg-purple-50 text-purple-900"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          🧪 {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Preferred Pickup Date
                      </label>
                      <input
                        type="date"
                        value={collectionDate}
                        onChange={(e) => setCollectionDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Pickup Time Slot (Fasting)
                      </label>
                      <select
                        value={collectionSlot}
                        onChange={(e) => setCollectionSlot(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
                      >
                        <option value="6:30 AM - 7:30 AM">6:30 AM - 7:30 AM (Fasting)</option>
                        <option value="7:30 AM - 8:30 AM">7:30 AM - 8:30 AM (Fasting)</option>
                        <option value="8:30 AM - 9:30 AM">8:30 AM - 9:30 AM (Fasting)</option>
                        <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (Routine)</option>
                        <option value="4:00 PM - 5:30 PM">4:00 PM - 5:30 PM (Evening)</option>
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Home Address for Sample Collection
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2"
                    />
                  </div>

                  {/* Fasting Tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                    <strong>Fasting Advisory:</strong> For full body checkups and lipid/sugar tests, 10–12 hours of overnight water-only fasting is recommended before technician arrival.
                  </div>

                  {/* Fee Summary */}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500">Total Checkup Fee:</span>
                      <p className="text-base font-extrabold text-purple-900">
                        ₹{bookingTest.finalPrice} <span className="text-xs text-emerald-600 font-bold">(Doorstep fee waived)</span>
                      </p>
                    </div>

                    <button
                      onClick={handleConfirmHomeCollection}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-6 py-2.5 rounded-xl shadow transition-all active:scale-95"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
