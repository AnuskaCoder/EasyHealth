import React, { useState } from "react";
import { AlertTriangle, Phone, Cross, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface EmergencyBannerProps {
  onCallAmbulance: () => void;
  onAdmitNow: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  onCallAmbulance,
  onAdmitNow,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl overflow-hidden shadow-xl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <AlertTriangle size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Emergency Services</h2>
            <p className="text-red-100 text-sm">24×7 · Immediate assistance available</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/80 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </button>
      </div>

      {/* Quick action buttons always visible */}
      <div className="px-6 pb-4 flex gap-3">
        <button
          onClick={onCallAmbulance}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 font-bold rounded-xl py-3 hover:bg-red-50 transition-all shadow-lg active:scale-95"
        >
          <Phone size={18} />
          Call 108
        </button>
        <button
          onClick={onAdmitNow}
          className="flex-1 flex items-center justify-center gap-2 bg-white/15 backdrop-blur border border-white/30 text-white font-semibold rounded-xl py-3 hover:bg-white/25 transition-all active:scale-95"
        >
          <Cross size={18} />
          Admit Now
        </button>
      </div>

      {/* Expanded info */}
      {expanded && (
        <div className="bg-black/15 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Clock size={18} />,
              title: "Avg Response",
              value: "< 8 min",
              sub: "Emergency triage",
            },
            {
              icon: <Phone size={18} />,
              title: "Ambulance",
              value: "108 / 102",
              sub: "Free govt service",
            },
            {
              icon: <Cross size={18} />,
              title: "ICU Beds",
              value: "19 Available",
              sub: "Nearby hospitals",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <div className="text-white/80">{item.icon}</div>
              <div>
                <p className="text-white/60 text-xs">{item.title}</p>
                <p className="text-white font-bold text-sm">{item.value}</p>
                <p className="text-white/60 text-xs">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
