import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/layout/Navbar";
import { BottomNav } from "./components/layout/BottomNav";

// Onboarding & Registration (Real-Time)
import { LoginPage } from "./pages/auth/LoginPage";

// Patient Pages
import { Dashboard } from "./pages/patient/Dashboard";
import { FindDoctors } from "./pages/patient/FindDoctors";
import { PharmacyPage } from "./pages/patient/PharmacyPage";
import { LabTestsPage } from "./pages/patient/LabTestsPage";
import { MedicalRecordsPage } from "./pages/patient/MedicalRecordsPage";
import { AppointmentsPage } from "./pages/patient/AppointmentsPage";
import { ChatbotPage } from "./pages/patient/ChatbotPage";
import { MedicalProfilePage } from "./pages/patient/MedicalProfilePage";
import { EmergencyPage } from "./pages/EmergencyPage";

// Doctor Pages
import { DoctorDashboardPage } from "./pages/doctor/DoctorDashboardPage";
import { DoctorAppointmentsPage } from "./pages/doctor/DoctorAppointmentsPage";
import { DoctorPatientsPage } from "./pages/doctor/DoctorPatientsPage";
import { DoctorPrescriptionsPage } from "./pages/doctor/DoctorPrescriptionsPage";
import { DoctorAnalyticsPage } from "./pages/doctor/DoctorAnalyticsPage";

// Global Modals & Notifications
import { TeleconsultRoomModal } from "./components/teleconsult/TeleconsultRoomModal";
import { SymptomAssessmentModal } from "./components/ai/SymptomAssessmentModal";
import { OcrUploadModal } from "./components/ai/OcrUploadModal";
import { ReportSummarizerModal } from "./components/ai/ReportSummarizerModal";
import { RbacSecurityModal } from "./components/security/RbacSecurityModal";
import { NotificationToastContainer } from "./components/notifications/NotificationToastContainer";

const AppContent: React.FC = () => {
  const {
    isRegistered,
    role,
    currentPage,
    teleconsultSession,
    showSymptomAssistant,
    setShowSymptomAssistant,
    showOcrUpload,
    setShowOcrUpload,
    selectedReportForAi,
    setSelectedReportForAi,
    showSecurityModal,
    setShowSecurityModal,
  } = useApp();

  // If user has not completed onboarding, FIRST ask for details of Patient or Doctor!
  if (!isRegistered) {
    return <LoginPage />;
  }

  const renderPage = () => {
    // If role is Doctor
    if (role === "doctor") {
      switch (currentPage) {
        case "dashboard":
        case "doctor-dashboard":
        case "doctor-profile":
          return <DoctorDashboardPage />;
        case "doctor-appointments":
        case "appointments":
          return <DoctorAppointmentsPage />;
        case "doctor-patients":
          return <DoctorPatientsPage />;
        case "doctor-prescriptions":
        case "doctor-records":
          return <DoctorPrescriptionsPage />;
        case "doctor-analytics":
          return <DoctorAnalyticsPage />;
        case "emergency":
          return <EmergencyPage />;
        default:
          return <DoctorDashboardPage />;
      }
    }

    // Role is Patient or Admin
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "find-doctors":
        return <FindDoctors />;
      case "pharmacy":
        return <PharmacyPage />;
      case "labs":
        return <LabTestsPage />;
      case "records":
        return <MedicalRecordsPage />;
      case "appointments":
        return <AppointmentsPage />;
      case "chatbot":
        return <ChatbotPage />;
      case "profile":
        return <MedicalProfilePage />;
      case "emergency":
        return <EmergencyPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar with role switcher & notifications */}
      <Navbar />

      {/* Floating real-time toast alerts */}
      <NotificationToastContainer />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 pb-24">
        {renderPage()}
      </main>

      {/* Bottom Navigation for mobile/desktop quick switches */}
      <BottomNav />

      {/* Modals & Overlays */}
      {teleconsultSession?.isActive && <TeleconsultRoomModal />}
      {showSymptomAssistant && (
        <SymptomAssessmentModal onClose={() => setShowSymptomAssistant(false)} />
      )}
      {showOcrUpload && <OcrUploadModal onClose={() => setShowOcrUpload(false)} />}
      {selectedReportForAi && (
        <ReportSummarizerModal
          report={selectedReportForAi}
          onClose={() => setSelectedReportForAi(null)}
        />
      )}
      {showSecurityModal && (
        <RbacSecurityModal onClose={() => setShowSecurityModal(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
