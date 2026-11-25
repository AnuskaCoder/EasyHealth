import React, { useState } from "react";
import {
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Share2,
  Shield,
  Stethoscope,
  Send,
  Pill,
  CheckCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const TeleconsultRoomModal: React.FC = () => {
  const {
    teleconsultSession,
    endTeleconsult,
    toggleTeleconsultVideo,
    toggleTeleconsultAudio,
    sendTeleconsultMessage,
    addDoctorPrescription,
    patientProfile,
  } = useApp();

  const [activeSidePanel, setActiveSidePanel] = useState<"chat" | "prescription">("chat");
  const [chatInput, setChatInput] = useState("");
  const [doctorPrescriptionSent, setDoctorPrescriptionSent] = useState(false);

  if (!teleconsultSession || !teleconsultSession.isActive) return null;

  const { doctor, appointment, videoEnabled, audioEnabled, messages } = teleconsultSession;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendTeleconsultMessage(chatInput);
    setChatInput("");

    // Simulated doctor response
    setTimeout(() => {
      sendTeleconsultMessage(
        "I have noted your symptoms. I am electronically signing and generating your prescription now."
      );
    }, 1500);
  };

  const handleDoctorIssueRx = () => {
    if (!doctor) return;
    addDoctorPrescription({
      id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      appointmentId: appointment?.id || "APT-LIVE",
      patientId: "p1",
      patientName: patientProfile.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      date: new Date().toISOString().split("T")[0],
      diagnosis: "Mild Nutritional Anemia & Exertional Fatigue",
      vitals: { bp: "118/76", pulse: "78 bpm", temp: "98.4 F", weight: `${patientProfile.weight} kg` },
      medications: [
        { name: "Ferrous Ascorbate 100mg + Folic Acid", dosage: "1 tablet", frequency: "Twice daily", duration: "30 days", timing: "After Food" },
        { name: "Vitamin C 500mg (Chewable)", dosage: "1 tablet", frequency: "Once daily", duration: "30 days", timing: "After Food" },
      ],
      notes: "Follow up with repeat CBC panel after 4 weeks. Maintain adequate hydration.",
      nextFollowUp: "2026-12-25",
    });
    setDoctorPrescriptionSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-gray-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] border border-gray-800 animate-in fade-in zoom-in-95">
        {/* Top bar */}
        <div className="bg-gray-950/80 px-6 py-3.5 flex items-center justify-between border-b border-gray-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-100">
                  Live Consultation • {doctor?.name || "Dr. Priya Sharma"}
                </span>
                <span className="text-[10px] bg-blue-600/40 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-semibold">
                  {doctor?.specialty || "Cardiologist"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Patient: {patientProfile.name} • End-to-End Encrypted Telehealth Link
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
              08:42
            </span>
            <button
              onClick={endTeleconsult}
              className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Video & Workspace Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Video Streams */}
          <div className="flex-1 bg-black relative flex items-center justify-center p-4">
            {/* Main Remote Stream (Doctor) */}
            <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-950 relative flex items-center justify-center border border-gray-800">
              <img
                src={doctor?.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"}
                alt={doctor?.name}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Doctor status badge in stream */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-semibold">{doctor?.name}</span>
                <span className="text-gray-400">({doctor?.hospital || "Apollo Hospitals"})</span>
              </div>
            </div>

            {/* Patient Self-Preview PIP */}
            <div className="absolute top-8 right-8 w-36 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-2xl bg-gray-800">
              {videoEnabled ? (
                <div className="w-full h-full relative">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                    alt="Self camera"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                    You ({patientProfile.name.split(" ")[0]})
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500 text-xs">
                  <VideoOff size={20} className="mb-1" />
                  Camera Off
                </div>
              )}
            </div>
          </div>

          {/* Right Side Panel (Chat & Live Prescription) */}
          <div className="w-full md:w-80 lg:w-96 bg-gray-950 border-l border-gray-800 flex flex-col">
            {/* Panel selector tabs */}
            <div className="flex border-b border-gray-800 p-2 gap-1 bg-gray-900/60">
              <button
                onClick={() => setActiveSidePanel("chat")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeSidePanel === "chat" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <MessageSquare size={14} /> Consultation Chat
              </button>
              <button
                onClick={() => setActiveSidePanel("prescription")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeSidePanel === "prescription" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <FileText size={14} /> Live Prescription
              </button>
            </div>

            {/* Chat Body */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl ${
                        m.sender === doctor?.name
                          ? "bg-gray-900 text-gray-200 border border-gray-800 rounded-tl-none"
                          : "bg-blue-600 text-white rounded-tr-none ml-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span className="font-bold text-gray-300">{m.sender}</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type clinical inquiry..."
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* Live Prescription Body */}
            {activeSidePanel === "prescription" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs text-gray-300">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">Digital Prescription Pad</h4>
                      <p className="text-[10px] text-gray-400">Apollo Telehealth Service</p>
                    </div>
                    <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full">
                      Verified Rx
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold">Diagnosis</span>
                    <p className="font-semibold text-white">Mild Nutritional Anemia &amp; Fatigue</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-gray-400 text-[10px] uppercase font-bold">Prescribed Medicines</span>
                    <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                      <p className="font-bold text-blue-400">1. Ferrous Ascorbate 100mg + Folic Acid</p>
                      <p className="text-[11px] text-gray-400">1 tablet • Twice daily after meals • 30 days</p>
                    </div>
                    <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                      <p className="font-bold text-blue-400">2. Vitamin C 500mg (Chewable)</p>
                      <p className="text-[11px] text-gray-400">1 tablet • Once daily after breakfast • 30 days</p>
                    </div>
                  </div>

                  {doctorPrescriptionSent ? (
                    <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>Prescription signed &amp; synced to your pharmacy orders!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleDoctorIssueRx}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow"
                    >
                      <Pill size={14} /> Doctor: Sign &amp; Dispatch Prescription
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Call Controls Bar */}
        <div className="bg-gray-950 px-6 py-4 flex items-center justify-between border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield size={14} className="text-blue-500" />
            <span className="hidden sm:inline">HIPAA Compliant Video Protocol</span>
          </div>

          {/* Action Call Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTeleconsultAudio}
              className={`p-3 rounded-2xl transition-all ${
                audioEnabled ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={toggleTeleconsultVideo}
              className={`p-3 rounded-2xl transition-all ${
                videoEnabled ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              onClick={() => alert("Screen sharing active (Diagnostic Reports mirrored).")}
              className="p-3 bg-gray-800 text-white hover:bg-gray-700 rounded-2xl transition-all hidden sm:block"
            >
              <Share2 size={20} />
            </button>

            <button
              onClick={endTeleconsult}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <PhoneOff size={18} />
              <span>End Consult</span>
            </button>
          </div>

          <div className="text-xs text-gray-400 hidden sm:block">
            Dr. Priya's Room #849
          </div>
        </div>
      </div>
    </div>
  );
};
