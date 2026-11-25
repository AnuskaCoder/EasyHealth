import React from "react";
import {
  Home,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  MessageCircle,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart2,
  Stethoscope,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const patientTabs = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "find-doctors", icon: Stethoscope, label: "Doctors" },
  { id: "appointments", icon: Calendar, label: "Schedule" },
  { id: "pharmacy", icon: Pill, label: "Pharmacy" },
  { id: "labs", icon: FlaskConical, label: "Labs" },
  { id: "records", icon: FileText, label: "Records" },
  { id: "chatbot", icon: MessageCircle, label: "AI Chat" },
];

const doctorTabs = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "doctor-appointments", icon: Calendar, label: "Appointments" },
  { id: "doctor-patients", icon: Users, label: "Patients EHR" },
  { id: "doctor-prescriptions", icon: ClipboardList, label: "Prescriptions" },
  { id: "doctor-analytics", icon: BarChart2, label: "Analytics" },
];

export const BottomNav: React.FC = () => {
  const { currentPage, setCurrentPage, role } = useApp();
  const tabs = role === "patient" ? patientTabs : doctorTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentPage(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                active ? "text-blue-600 font-bold" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              {active && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
