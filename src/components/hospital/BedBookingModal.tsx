import React, { useState } from "react";
import { X, Bed, CheckCircle } from "lucide-react";
import { Hospital } from "../../types";
import { Button } from "../ui/Button";

interface BedBookingModalProps {
  hospital: Hospital;
  initialBedType?: string;
  onClose: () => void;
}

type Step = "select" | "details" | "success";

export const BedBookingModal: React.FC<BedBookingModalProps> = ({
  hospital,
  initialBedType = "General",
  onClose,
}) => {
  const [step, setStep] = useState<Step>("select");
  const [bedType, setBedType] = useState(initialBedType);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [refId] = useState(`BED-${Math.floor(100000 + Math.random() * 900000)}`);

  const selectedBed = hospital.beds.find((b) => b.type === bedType);

  const handleBook = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1800);
  };

  const bedTypeInfo: Record<string, { desc: string; priceRange: string }> = {
    ICU: { desc: "Intensive monitoring, ventilator support, 24×7 nursing", priceRange: "₹8,000–15,000/day" },
    Emergency: { desc: "Immediate emergency stabilisation and triage", priceRange: "₹5,000–8,000/day" },
    Private: { desc: "Single occupancy, attached bath, attendant facility", priceRange: "₹3,000–6,000/day" },
    General: { desc: "Shared ward, standard nursing care, meals included", priceRange: "₹1,500–3,000/day" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Bed size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Book a Bed</h3>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{hospital.name}</p>
            </div>
          </div>
          {step !== "success" && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {step === "select" && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Select the type of bed you need.</p>
              <div className="space-y-3 mb-5">
                {hospital.beds.map((bed) => {
                  const info = bedTypeInfo[bed.type];
                  const isAvailable = bed.available > 0;
                  return (
                    <button
                      key={bed.type}
                      disabled={!isAvailable}
                      onClick={() => setBedType(bed.type)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        bedType === bed.type
                          ? "border-blue-500 bg-blue-50"
                          : isAvailable
                          ? "border-gray-200 hover:border-gray-300"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{bed.type}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isAvailable ? `${bed.available} free` : "Full"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{info?.desc}</p>
                      <p className="text-xs font-semibold text-blue-600 mt-1">{info?.priceRange}</p>
                    </button>
                  );
                })}
              </div>
              <Button
                fullWidth
                variant="primary"
                size="lg"
                disabled={!selectedBed || selectedBed.available === 0}
                onClick={() => setStep("details")}
              >
                Continue →
              </Button>
            </div>
          )}

          {step === "details" && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Fill in the patient details to complete the booking.</p>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="Years"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+91 XXXXX"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason for Admission</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief description of the medical condition..."
                    rows={3}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Hospital</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[180px]">{hospital.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bed Type</span>
                  <span className="font-semibold text-gray-800">{bedType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost Range</span>
                  <span className="font-semibold text-gray-800">{bedTypeInfo[bedType]?.priceRange}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep("select")}>← Back</Button>
                <Button
                  variant="primary"
                  disabled={!patientName || !patientPhone || !patientAge}
                  loading={loading}
                  onClick={handleBook}
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bed Booked!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Your <span className="font-semibold">{bedType}</span> bed at {hospital.name} is confirmed.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-blue-800 mb-1">Booking Reference</p>
                <p className="text-2xl font-bold text-blue-600 tracking-widest">{refId}</p>
                <p className="text-xs text-blue-500 mt-1">Present this ID at the hospital admission desk</p>
              </div>
              <Button fullWidth variant="primary" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
