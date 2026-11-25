import React, { useState } from "react";
import {
  Bell,
  ShoppingCart,
  User,
  Zap,
  Shield,
  Lock,
  Stethoscope,
  Heart,
  FileText,
  Calendar,
  MessageCircle,
  FlaskConical,
  Pill,
  Menu,
  X,
  ChevronDown,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";

export const Navbar: React.FC = () => {
  const {
    role,
    currentPage,
    setCurrentPage,
    unreadCount,
    cartCount,
    patientProfile,
    activeDoctor,
    openRegistration,
    setShowSecurityModal,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    logout,
  } = useApp();

  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const patientNavLinks = [
    { id: "dashboard", label: "Home" },
    { id: "find-doctors", label: "Find Doctors" },
    { id: "pharmacy", label: "Pharmacy" },
    { id: "labs", label: "Lab Checkups" },
    { id: "records", label: "Medical Records" },
    { id: "appointments", label: "Appointments" },
    { id: "chatbot", label: "AI Assistant" },
    { id: "emergency", label: "Emergency" },
  ];

  const doctorNavLinks = [
    { id: "dashboard", label: "Doctor Dashboard" },
    { id: "doctor-appointments", label: "Appointments" },
    { id: "doctor-patients", label: "Patients EHR" },
    { id: "doctor-prescriptions", label: "Prescription Pad" },
    { id: "doctor-analytics", label: "Analytics" },
  ];

  const navLinks = role === "patient" ? patientNavLinks : doctorNavLinks;

  const currentDisplayName =
    role === "patient" ? patientProfile.name.split(" ")[0] : activeDoctor.name;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className="flex items-center gap-2 group"
          >
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Zap size={18} />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-gray-900 text-lg tracking-tight">EasyHealth</span>
              <span className="block text-[9px] text-blue-600 font-bold -mt-1 tracking-wider uppercase">
                Care Platform
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentPage === link.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Role Toggle Switch & Security Button */}
        <div className="flex items-center gap-3">
          {/* Role Badge — locked to login role, not switchable */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            role === "patient"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-indigo-50 text-indigo-700 border-indigo-200"
          }`}>
            {role === "patient" ? "👤 Patient" : "🩺 Doctor"}
          </div>

          {/* Re-Register / Onboarding Button */}
          <button
            onClick={openRegistration}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all shadow-xs"
            title="Register a new Patient or Doctor in Real-Time"
          >
            <UserPlus size={13} />
            <span>New Profile</span>
          </button>

          {/* Security Vault Inspector Button */}
          <button
            onClick={() => setShowSecurityModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
            title="Inspect AES-256 Vault & RBAC Matrix"
          >
            <Shield size={13} className="text-emerald-400" />
            <span className="hidden md:inline">Vault</span>
          </button>

          {/* Cart Icon (Patient) */}
          {role === "patient" && (
            <button
              onClick={() => setCurrentPage("pharmacy")}
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
              title="Pharmacy Cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
              title="Real-time Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDrawer && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-xs text-gray-900">
                    Notifications ({notifications.length})
                  </h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] text-gray-400 hover:text-red-600"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">No new notifications.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.actionPage) {
                            setCurrentPage(n.actionPage);
                            setShowNotificationsDrawer(false);
                          }
                        }}
                        className={`p-2.5 rounded-2xl cursor-pointer text-xs transition-colors border ${
                          n.read
                            ? "bg-gray-50 border-gray-100 text-gray-500"
                            : "bg-blue-50/70 border-blue-200 text-blue-900 font-medium"
                        }`}
                      >
                        <div className="flex justify-between font-bold">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-gray-400 font-normal">{n.time}</span>
                        </div>
                        <p className="text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <button
            onClick={() => setCurrentPage(role === "patient" ? "profile" : "doctor-dashboard")}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {role === "patient" ? (patientProfile.name ? patientProfile.name.charAt(0) : "P") : "DR"}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-gray-900 leading-tight">
                {currentDisplayName}
              </span>
              <span className="block text-[10px] text-gray-400 capitalize">{role}</span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
            title="Sign out"
          >
            <LogOut size={13} />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 space-y-2 animate-in slide-in-from-top-2">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                openRegistration();
                setMobileMenuOpen(false);
              }}
              className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-blue-200"
            >
              <UserPlus size={13} /> New Profile Setup
            </button>
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-red-200"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentPage(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                currentPage === link.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
