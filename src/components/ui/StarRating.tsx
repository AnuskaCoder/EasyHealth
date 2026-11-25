import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, reviewCount, size = 14 }) => {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="text-amber-400 fill-amber-400" />
      <span className="font-semibold text-gray-800 text-sm">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-gray-400 text-xs">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
};
