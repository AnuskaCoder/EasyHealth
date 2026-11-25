import React, { useState } from "react";
import {
  MapPin, Phone, Clock, Bed, ChevronDown, ChevronUp, Star, Zap,
} from "lucide-react";
import { Hospital, BedAvailability } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface HospitalCardProps {
  hospital: Hospital;
  onBookBed: (hospital: Hospital, bedType: string) => void;
  onViewDoctors: (hospitalId: string) => void;
}

const bedColors: Record<string, { bg: string; text: string; bar: string }> = {
  ICU: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500" },
  Emergency: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
  Private: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500" },
  General: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500" },
};

const BedBar: React.FC<{ bed: BedAvailability }> = ({ bed }) => {
  const pct = Math.round((bed.available / bed.total) * 100);
  const colors = bedColors[bed.type] || bedColors.General;
  return (
    <div className={`rounded-xl p-3 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold ${colors.text}`}>{bed.type}</span>
        <span className={`text-xs font-bold ${colors.text}`}>{bed.available}/{bed.total}</span>
      </div>
      <div className="bg-white/70 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {bed.available === 0 ? "No beds available" : `${bed.available} available`}
      </p>
    </div>
  );
};

export const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onBookBed, onViewDoctors }) => {
  const [expanded, setExpanded] = useState(false);
  const totalAvailable = hospital.beds.reduce((sum, b) => sum + b.available, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image header */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={hospital.image}
          alt={hospital.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="text-white font-bold text-base leading-tight">{hospital.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-white text-xs font-medium">{hospital.rating}</span>
              <span className="text-white/70 text-xs">({hospital.reviewCount.toLocaleString()})</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {hospital.emergency24x7 && (
              <Badge variant="red" size="sm">
                <Zap size={10} className="mr-0.5" /> 24×7 Emergency
              </Badge>
            )}
            {hospital.ambulance && (
              <Badge variant="blue" size="sm">Ambulance</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-gray-400" />
            {hospital.distance} km away
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            ~{hospital.waitTime} min wait
          </span>
          <span className="flex items-center gap-1">
            <Bed size={12} className="text-green-500" />
            <span className="text-green-600 font-semibold">{totalAvailable} beds free</span>
          </span>
          <span className="flex items-center gap-1">
            <Phone size={12} className="text-gray-400" />
            {hospital.phone}
          </span>
        </div>
      </div>

      {/* Specialities */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {hospital.specialities.slice(0, 4).map((s) => (
            <Badge key={s} variant="blue" size="sm">{s}</Badge>
          ))}
          {hospital.specialities.length > 4 && (
            <Badge variant="gray" size="sm">+{hospital.specialities.length - 4} more</Badge>
          )}
        </div>
      </div>

      {/* Bed toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        <span>Bed Availability</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-4 py-3 grid grid-cols-2 gap-2">
          {hospital.beds.map((bed) => (
            <BedBar key={bed.type} bed={bed} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 pt-3 flex gap-2">
        <Button variant="outline" size="sm" fullWidth onClick={() => onViewDoctors(hospital.id)}>
          View Doctors
        </Button>
        <Button variant="primary" size="sm" fullWidth onClick={() => onBookBed(hospital, "General")}>
          Book Bed
        </Button>
      </div>
    </div>
  );
};
