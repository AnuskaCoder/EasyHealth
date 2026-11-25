import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "red" | "blue" | "yellow" | "gray" | "orange";
  size?: "sm" | "md";
}

const variantClasses: Record<string, string> = {
  green: "bg-green-100 text-green-700 border border-green-200",
  red: "bg-red-100 text-red-700 border border-red-200",
  blue: "bg-blue-100 text-blue-700 border border-blue-200",
  yellow: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  gray: "bg-gray-100 text-gray-600 border border-gray-200",
  orange: "bg-orange-100 text-orange-700 border border-orange-200",
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = "gray", size = "sm" }) => {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};
