import React, { useState } from "react";
import { X, Calendar, Clock, CheckCircle, Video, Zap } from "lucide-react";
import { Doctor } from "../../types";
import { Button } from "../ui/Button";

interface ConsultBookingModalProps {
  doctor: Doctor;
  mode: "regular" | "emergency";
  onClose: () => void;
}

type Step = "slot" | "details" | "success";

const slots = [
  { id: "s1", time: "9:00 AM", available: true },
  { id: "s2", time: "9:30 AM", available: false },
  { id: "s3", time: "10:00 AM", available: true },
  { id: "s4", time: "10:30 AM", available: true },
  { id: "s5", time: "11:00 AM", available: false },
  { id: "s6", time: "11:30 AM", available: true },
  { id: "s7", time: "2:00 PM", available: true },
  { id: "s8", time: "2:30 PM", available: true },
  { id: "s9", time: "3:00 PM", available: false },
  { id: "s10", time: "3:30 PM", available: true },
  { id: "s11", time: "4:00 PM", available: true },
  { id: "s12", time: "4:30 PM", available: false },
];

export const ConsultBookingModal: React.FC<ConsultBookingModalProps> = ({
  doctor,
  mode,
  onClose,
}) => {
  const [step, setStep] = useState<Step>(mode === "emergency" ? "details" : "slot");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [refId] = useState(`CONS-${Math.floor(100000 + Math.random() * 900000)}`);

  const isEmergency = mode === "emergency";
  const fee = isEmergency ? doctor.emergencyFee : doctor.consultFee;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 border-b border-gray-100 ${
            isEmergency ? "bg-red-50" : "bg-blue-50"
          } rounded-t-2xl`}
        >
          <div className="flex items-center gap-3">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{doctor.name}</h3>
              <div className="flex items-center gap-1.5">
                {isEmergency ? (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                    <Zap size={11} /> Emergency Consult
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                    <Video size={11} /> Regular Consult
                  </span>
                )}
                <span className="text-xs text-gray-500">· ₹{fee.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {step !== "success" && (
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* Slot selection */}
          {step === "slot" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Today · Available Slots</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      selectedSlot === slot.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : slot.available
                        ? "border-gray-200 text-gray-700 hover:border-gray-300"
                        : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                    }`}
                  >
                    <Clock size={11} className="inline mr-1" />
                    {slot.time}
                  </button>
                ))}
              </div>
              <Button
                fullWidth
                variant="primary"
                size="lg"
                disabled={!selectedSlot}
                onClick={() => setStep("details")}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Patient details */}
          {step === "details" && (
            <div>
              {isEmergency && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700 font-medium">
                  ⚡ Emergency consultation — the doctor will be notified immediately.
                </div>
              )}
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Describe Symptoms <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="What are you experiencing?"
                    rows={3}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-semibold text-gray-800">{doctor.name}</span>
                </div>
                {!isEmergency && selectedSlot && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time Slot</span>
                    <span className="font-semibold text-gray-800">
                      {slots.find((s) => s.id === selectedSlot)?.time}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Consultation Fee</span>
                  <span className={`font-bold ${isEmergency ? "text-red-600" : "text-blue-600"}`}>
                    ₹{fee.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!isEmergency && (
                  <Button variant="outline" onClick={() => setStep("slot")}>← Back</Button>
                )}
                {isEmergency && <Button variant="outline" onClick={onClose}>Cancel</Button>}
                <Button
                  variant={isEmergency ? "emergency" : "primary"}
                  disabled={!patientName || !patientPhone}
                  loading={loading}
                  onClick={handleConfirm}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isEmergency ? "bg-red-100" : "bg-green-100"}`}>
                <CheckCircle size={40} className={isEmergency ? "text-red-600" : "text-green-600"} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Consultation Booked!</h3>
              <p className="text-gray-500 text-sm mb-6">
                {isEmergency
                  ? `${doctor.name} has been alerted. Expect a call within minutes.`
                  : `Your appointment with ${doctor.name} is confirmed.`}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-blue-800 mb-1">Booking Reference</p>
                <p className="text-2xl font-bold text-blue-600 tracking-widest">{refId}</p>
              </div>
              <Button fullWidth variant="primary" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
