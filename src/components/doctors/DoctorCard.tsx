import React, { useState } from "react";
import {
  Star, Clock, MapPin, Video, CheckCircle,
  Globe, Stethoscope, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { Doctor } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface DoctorCardProps {
  doctor: Doctor;
  onBook: (doctor: Doctor, mode: "regular" | "emergency") => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Top row: photo + name */}
        <div className="flex gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80";
              }}
            />
            {doctor.online && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900 text-sm">{doctor.name}</h3>
                  {doctor.verified && (
                    <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-blue-600 font-semibold">{doctor.specialty}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-gray-800">{doctor.rating}</span>
                <span className="text-xs text-gray-400">({doctor.reviewCount.toLocaleString()})</span>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <MapPin size={11} />
              <span className="truncate">{doctor.hospital}</span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="flex items-center gap-1 text-gray-500">
                <Stethoscope size={11} />
                {doctor.experience} yrs exp
              </span>
              <span className={`flex items-center gap-1 font-semibold ${
                doctor.availableToday ? "text-green-600" : "text-orange-500"
              }`}>
                <Clock size={11} />
                {doctor.nextSlot}
              </span>
            </div>
          </div>
        </div>

        {/* Qualifications */}
        <div className="flex flex-wrap gap-1 mt-3">
          {doctor.qualifications.slice(0, 3).map((q) => (
            <Badge key={q} variant="gray" size="sm">{q}</Badge>
          ))}
          {doctor.qualifications.length > 3 && (
            <Badge variant="gray" size="sm">+{doctor.qualifications.length - 3} more</Badge>
          )}
        </div>

        {/* Fee cards */}
        <div className="flex gap-3 mt-3">
          <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-500">Consult Fee</p>
            <p className="text-sm font-bold text-blue-700">&#8377;{doctor.consultFee.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-500">Emergency</p>
            <p className="text-sm font-bold text-red-600">&#8377;{doctor.emergencyFee.toLocaleString()}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          {expanded ? (
            <>Less info <ChevronUp size={13} /></>
          ) : (
            <>More info <ChevronDown size={13} /></>
          )}
        </button>

        {/* Expanded bio */}
        {expanded && (
          <div className="mt-2 pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-600 leading-relaxed">{doctor.about}</p>
            <div className="flex items-start gap-1.5">
              <Globe size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Languages: </span>
                {doctor.languages.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            icon={<Video size={14} />}
            onClick={() => onBook(doctor, "regular")}
          >
            Consult
          </Button>
          <Button
            variant="emergency"
            size="sm"
            fullWidth
            icon={<Zap size={14} />}
            onClick={() => onBook(doctor, "emergency")}
          >
            Emergency
          </Button>
        </div>
      </div>
    </div>
  );
};
