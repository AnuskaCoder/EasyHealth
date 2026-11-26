import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  UserRole,
  Appointment,
  MedicalReport,
  Medication,
  PatientProfile,
  CartItem,
  Medicine,
  PharmacyOrder,
  HomeCollectionBooking,
  TeleconsultSession,
  Doctor,
  ConsentPermission,
  DoctorPrescription,
  NotificationItem,
} from "../types";
import { doctors } from "../data/doctors";
import { loadSession, clearSession, seedDemoAccounts, getAccounts } from "../services/authStorage";

interface AppContextType {
  role: UserRole;
  setRole: (r: UserRole) => void; // internal use only — locked to login role
  currentPage: string;
  setCurrentPage: (p: string) => void;
  // Real-time onboarding & registration
  isRegistered: boolean;
  setIsRegistered: (v: boolean) => void;
  openRegistration: () => void;
  registerPatient: (p: PatientProfile) => void;
  registerDoctor: (d: Doctor) => void;
  logout: () => void;
  activeDoctor: Doctor;
  setActiveDoctor: (d: Doctor) => void;

  patientProfile: PatientProfile;
  setPatientProfile: (p: PatientProfile) => void;
  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  reports: MedicalReport[];
  addReport: (r: MedicalReport) => void;
  updateReport: (id: string, r: Partial<MedicalReport>) => void;
  medications: Medication[];
  toggleMedicationTaken: (id: string, index: number) => void;
  addMedication: (m: Medication) => void;
  // Pharmacy Cart & Orders
  cart: CartItem[];
  addToCart: (med: Medicine) => boolean;
  removeFromCart: (medId: string) => void;
  updateCartQuantity: (medId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  orders: PharmacyOrder[];
  placeOrder: (order: Omit<PharmacyOrder, "id" | "date" | "status"> & Partial<Pick<PharmacyOrder, "id" | "date" | "status">>) => string;
  // Home Collection
  homeBookings: HomeCollectionBooking[];
  addHomeBooking: (booking: Omit<HomeCollectionBooking, "id" | "status">) => void;
  // Teleconsultation
  teleconsultSession: TeleconsultSession | null;
  startTeleconsult: (appointment: Appointment, doctor: Doctor) => void;
  endTeleconsult: () => void;
  toggleTeleconsultVideo: () => void;
  toggleTeleconsultAudio: () => void;
  sendTeleconsultMessage: (text: string) => void;
  // Doctor & Consent
  consentPermissions: ConsentPermission[];
  grantConsent: (doctorId: string) => void;
  revokeConsent: (doctorId: string) => void;
  doctorPrescriptions: DoctorPrescription[];
  addDoctorPrescription: (p: DoctorPrescription) => void;
  // Notifications
  notifications: NotificationItem[];
  addNotification: (n: Omit<NotificationItem, "id" | "time" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  // Security & Vault
  isVaultLocked: boolean;
  toggleVaultLock: () => void;
  // Global Modals
  showSymptomAssistant: boolean;
  setShowSymptomAssistant: (open: boolean) => void;
  showOcrUpload: boolean;
  setShowOcrUpload: (open: boolean) => void;
  selectedReportForAi: MedicalReport | null;
  setSelectedReportForAi: (r: MedicalReport | null) => void;
  showSecurityModal: boolean;
  setShowSecurityModal: (open: boolean) => void;
}

const defaultPatient: PatientProfile = {
  id: "p1",
  name: "Ananya Krishnan",
  age: 28,
  gender: "Female",
  dob: "1996-03-15",
  phone: "+91 98765 43210",
  email: "ananya.k@example.com",
  bloodGroup: "B+",
  height: 164,
  weight: 58,
  allergies: ["Penicillin", "Dust Mites"],
  chronicConditions: ["Mild Bronchial Asthma"],
  emergencyContact: "+91 98765 00000 (Rohan Krishnan - Brother)",
  address: "Flat 402, Green Glen Layout, Bellandur, Bangalore 560103",
  pastSurgeries: ["Appendectomy (2019)"],
  vaccinations: ["COVID-19 (3 doses)", "Hepatitis B", "Tetanus (2024)"],
};

const defaultAppointments: Appointment[] = [
  {
    id: "APT-849102",
    doctorId: "d1",
    doctorName: "Dr. Priya Sharma",
    doctorSpecialty: "Cardiologist",
    doctorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80",
    patientId: "p1",
    patientName: "Ananya Krishnan",
    patientAge: 28,
    patientGender: "Female",
    date: "2026-11-28",
    time: "11:30 AM",
    mode: "video",
    status: "upcoming",
    hospital: "Apollo Hospitals",
    fee: 1200,
    symptoms: "Occasional palpitation during workout, mild fatigue",
  },
  {
    id: "APT-619283",
    doctorId: "d5",
    doctorName: "Dr. Meera Nair",
    doctorSpecialty: "Pediatrician",
    doctorImage: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200&q=80",
    patientId: "p1",
    patientName: "Ananya Krishnan",
    patientAge: 28,
    patientGender: "Female",
    date: "2026-11-20",
    time: "3:30 PM",
    mode: "video",
    status: "completed",
    hospital: "Narayana Health City",
    fee: 900,
    notes: "Follow-up in 2 weeks. Continue Montelukast at bedtime.",
  },
  {
    id: "APT-391048",
    doctorId: "d4",
    doctorName: "Dr. Rahul Kapoor",
    doctorSpecialty: "Emergency Medicine",
    doctorImage: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&q=80",
    patientId: "p1",
    patientName: "Ananya Krishnan",
    patientAge: 28,
    patientGender: "Female",
    date: "2026-11-15",
    time: "Now",
    mode: "emergency",
    status: "completed",
    hospital: "Max Super Specialty Hospital",
    fee: 1800,
    notes: "Treated for acute bronchospasm. Nebulized and discharged.",
  },
];

const defaultReports: MedicalReport[] = [
  {
    id: "r1",
    name: "Complete Blood Count (CBC) with Differential",
    type: "Blood Test",
    date: "2026-11-18",
    uploadedBy: "Apollo Diagnostics",
    fileName: "CBC_Apollo_Nov2026.pdf",
    fileUrl: "#",
    aiAnalysed: true,
    aiSummary: "Hemoglobin is slightly lower than normal range (11.4 g/dL vs ref 12.0-15.5 g/dL), indicating mild nutritional iron-deficiency anemia. Total WBC and platelet counts are within healthy ranges. No acute leukocytosis or signs of bacterial infection. Recommend dietary iron boost (spinach, beetroot, lentils) and Ferritin evaluation.",
    tags: ["Anemia", "Routine", "Hemoglobin"],
    biomarkers: [
      { parameter: "Hemoglobin", value: "11.4", unit: "g/dL", referenceRange: "12.0 - 15.5", status: "Low", explanation: "Slightly low, can cause mild fatigue and exercise intolerance." },
      { parameter: "WBC Count", value: "7,200", unit: "/μL", referenceRange: "4,000 - 11,000", status: "Normal", explanation: "Optimal immune cell count; no infection evident." },
      { parameter: "RBC Count", value: "4.1", unit: "million/μL", referenceRange: "3.8 - 5.2", status: "Normal", explanation: "Healthy red blood cell volume." },
      { parameter: "Platelet Count", value: "245,000", unit: "/μL", referenceRange: "150,000 - 450,000", status: "Normal", explanation: "Normal clotting capability." },
      { parameter: "Hematocrit (PCV)", value: "35.2", unit: "%", referenceRange: "36.0 - 46.0", status: "Low", explanation: "Borderline low red cell percentage." },
    ],
  },
  {
    id: "r2",
    name: "Lipid Profile & Cardiac Risk Panel",
    type: "Blood Test",
    date: "2026-11-12",
    uploadedBy: "Dr. Lal PathLabs",
    fileName: "Lipid_Profile_Nov2026.pdf",
    fileUrl: "#",
    aiAnalysed: true,
    aiSummary: "Lipid panel shows optimal cardiovascular markers. Total Cholesterol (168 mg/dL) and Triglycerides (110 mg/dL) are well within the desirable limits. HDL ('good') cholesterol is protective at 52 mg/dL. Minimal atherosclerosis risk at present.",
    tags: ["Heart", "Lipids", "Cholesterol"],
    biomarkers: [
      { parameter: "Total Cholesterol", value: "168", unit: "mg/dL", referenceRange: "< 200", status: "Normal", explanation: "Excellent cardiovascular benchmark." },
      { parameter: "HDL Cholesterol", value: "52", unit: "mg/dL", referenceRange: "> 50", status: "Normal", explanation: "Protective high-density lipoprotein level." },
      { parameter: "LDL Cholesterol", value: "94", unit: "mg/dL", referenceRange: "< 100", status: "Normal", explanation: "Optimal low-density lipoprotein level." },
      { parameter: "Triglycerides", value: "110", unit: "mg/dL", referenceRange: "< 150", status: "Normal", explanation: "Healthy blood fat level." },
    ],
  },
  {
    id: "r3",
    name: "Chest X-Ray (PA View)",
    type: "X-Ray",
    date: "2026-11-10",
    uploadedBy: "Apollo Radiology",
    fileName: "Chest_XRay_PA.dcm",
    fileUrl: "#",
    aiAnalysed: true,
    aiSummary: "Chest X-Ray shows clear lung fields with no consolidation, infiltrates or pleural effusion. Cardiothoracic ratio is normal (<0.5). Mild bilateral hyperinflation consistent with patient's known mild asthma history.",
    tags: ["Asthma", "Chest", "Radiology"],
  },
  {
    id: "r4",
    name: "Urine Routine & Microscopic Examination",
    type: "Urine Test",
    date: "2026-11-05",
    uploadedBy: "Metropolis Healthcare",
    fileName: "Urine_Routine_Nov2026.pdf",
    fileUrl: "#",
    aiAnalysed: true,
    aiSummary: "Urine examination is clear. Specific gravity 1.018 (normal hydration). pH 6.0. Negative for albumin/protein, glucose, ketone bodies and nitrite. Pus cells 1-2/HPF (normal). No urinary tract infection detected.",
    tags: ["Renal", "Routine", "Urine"],
    biomarkers: [
      { parameter: "Color", value: "Pale Yellow", unit: "", referenceRange: "Pale Yellow", status: "Normal" },
      { parameter: "Protein/Albumin", value: "Nil", unit: "", referenceRange: "Nil", status: "Normal" },
      { parameter: "Glucose", value: "Nil", unit: "", referenceRange: "Nil", status: "Normal" },
      { parameter: "Pus Cells", value: "1-2", unit: "/HPF", referenceRange: "0 - 5", status: "Normal" },
      { parameter: "RBCs in Urine", value: "Nil", unit: "/HPF", referenceRange: "Nil", status: "Normal" },
    ],
  },
];

const defaultMedications: Medication[] = [
  {
    id: "m1",
    name: "Montelukast 10mg",
    dosage: "10mg",
    frequency: "Once daily at night",
    startDate: "2026-11-01",
    prescribedBy: "Dr. Meera Nair",
    times: ["9:00 PM"],
    taken: [true, true, true, true, false, false, false],
    stock: 16,
    instructions: "Take 1 tablet with water 1 hour before bedtime for asthma prevention.",
  },
  {
    id: "m2",
    name: "Ferrous Sulphate 200mg",
    dosage: "200mg",
    frequency: "Twice daily after food",
    startDate: "2026-11-18",
    prescribedBy: "Dr. Priya Sharma",
    times: ["9:00 AM", "8:30 PM"],
    taken: [true, false, true, true, false, false, false],
    stock: 38,
    instructions: "Take after food with vitamin C/orange juice for maximum iron absorption.",
  },
  {
    id: "m3",
    name: "Cetirizine 10mg",
    dosage: "10mg",
    frequency: "Once daily SOS (if allergic symptoms)",
    startDate: "2026-10-15",
    prescribedBy: "Dr. Meera Nair",
    times: ["10:00 PM"],
    taken: [false, true, false, false, false, false, false],
    stock: 6,
    instructions: "Take 1 tablet if dust allergy or sneezing occurs. Low stock alert!",
  },
];

const defaultConsentPermissions: ConsentPermission[] = [
  {
    id: "c1",
    doctorId: "d1",
    doctorName: "Dr. Priya Sharma",
    specialty: "Cardiologist",
    status: "granted",
    requestedDate: "2026-11-18",
    grantedDate: "2026-11-18",
  },
  {
    id: "c2",
    doctorId: "d5",
    doctorName: "Dr. Meera Nair",
    specialty: "Pediatrician",
    status: "granted",
    requestedDate: "2026-11-10",
    grantedDate: "2026-11-10",
  },
  {
    id: "c3",
    doctorId: "d2",
    doctorName: "Dr. Arjun Mehta",
    specialty: "Neurologist",
    status: "requested",
    requestedDate: "2026-11-24",
  },
];

const defaultDoctorPrescriptions: DoctorPrescription[] = [
  {
    id: "RX-9082",
    appointmentId: "APT-849102",
    patientId: "p1",
    patientName: "Ananya Krishnan",
    doctorId: "d1",
    doctorName: "Dr. Priya Sharma",
    doctorSpecialty: "Cardiologist",
    date: "2026-11-18",
    diagnosis: "Borderline Microcytic Anemia & Sinus Tachycardia on exertion",
    vitals: { bp: "118/76", pulse: "78 bpm", temp: "98.4 F", weight: "58 kg" },
    medications: [
      { name: "Ferrous Sulphate 200mg", dosage: "200mg", frequency: "Twice daily", duration: "30 days", timing: "After Food" },
      { name: "Vitamin C 500mg (Limcee)", dosage: "500mg", frequency: "Once daily", duration: "30 days", timing: "After Food" },
    ],
    notes: "Patient advised to maintain hydration and avoid high-intensity cardio until hemoglobin normalizes. Follow-up in 4 weeks with fresh CBC.",
    nextFollowUp: "2026-12-18",
  },
];

const defaultNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Appointment Reminder",
    message: "Your video consult is scheduled for Nov 28 at 11:30 AM.",
    time: "10 mins ago",
    type: "appointment",
    read: false,
    actionPage: "appointments",
  },
  {
    id: "notif-2",
    title: "Low Medication Stock",
    message: "Cetirizine 10mg has only 6 tablets remaining. Tap to reorder at 20% discount.",
    time: "1 hour ago",
    type: "medicine",
    read: false,
    actionPage: "pharmacy",
  },
  {
    id: "notif-3",
    title: "New AI Report Insight",
    message: "AI has highlighted nutritional recommendations for your recent Blood Test.",
    time: "3 hours ago",
    type: "report",
    read: false,
    actionPage: "records",
  },
];

const defaultHomeBookings: HomeCollectionBooking[] = [
  {
    id: "HC-7712",
    packageId: "l11",
    packageName: "Full Body Checkup - Basic (Blood & Urine)",
    patientName: "Ananya Krishnan",
    sampleType: "Blood & Urine",
    date: "2026-11-29",
    timeSlot: "7:00 AM - 8:00 AM",
    address: "Flat 402, Green Glen Layout, Bellandur, Bangalore",
    fee: 1499,
    status: "Phlebotomist Assigned",
    phlebotomistName: "Ramesh Patil (Phlebotomy Specialist)",
    phlebotomistPhone: "+91 98451 22334",
  },
];

const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Real-time onboarding status — restored from localStorage if "remember me" was set
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    seedDemoAccounts();
    const session = loadSession();
    return !!session;
  });
  const [role, setRole] = useState<UserRole>(() => {
    const session = loadSession();
    return (session?.role as UserRole) || "patient";
  });
  const [currentPage, setCurrentPage] = useState<string>("dashboard");

  const [patientProfile, setPatientProfile] = useState<PatientProfile>(() => {
    const session = loadSession();
    if (session) {
      const accounts = getAccounts();
      const acc = accounts.find(a => a.id === session.userId);
      if (acc && acc.role === "patient") return acc.profileData as PatientProfile;
    }
    return defaultPatient;
  });

  const [activeDoctor, setActiveDoctor] = useState<Doctor>(() => {
    const session = loadSession();
    if (session) {
      const accounts = getAccounts();
      const acc = accounts.find(a => a.id === session.userId);
      if (acc && acc.role === "doctor") return acc.profileData as Doctor;
    }
    return doctors[0];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const session = loadSession();
    if (session) {
      const saved = localStorage.getItem(`eh_appointments_${session.userId}`);
      if (saved) try { return JSON.parse(saved); } catch {}
      // Demo user gets sample data; new user gets empty
      if (session.userId === "p1" || session.email === "patient@demo.com") return defaultAppointments;
      return [];
    }
    return defaultAppointments;
  });

  const [reports, setReports] = useState<MedicalReport[]>(() => {
    const session = loadSession();
    if (session) {
      const saved = localStorage.getItem(`eh_reports_${session.userId}`);
      if (saved) try { return JSON.parse(saved); } catch {}
      if (session.userId === "p1" || session.email === "patient@demo.com") return defaultReports;
      return [];
    }
    return defaultReports;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const session = loadSession();
    if (session) {
      const saved = localStorage.getItem(`eh_medications_${session.userId}`);
      if (saved) try { return JSON.parse(saved); } catch {}
      if (session.userId === "p1" || session.email === "patient@demo.com") return defaultMedications;
      return [];
    }
    return defaultMedications;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const userId = loadSession()?.userId || "guest";
    try { return JSON.parse(localStorage.getItem(`eh_cart_${userId}`) || "[]") as CartItem[]; }
    catch { return []; }
  });
  const [orders, setOrders] = useState<PharmacyOrder[]>(() => {
    const userId = loadSession()?.userId || "guest";
    try { return JSON.parse(localStorage.getItem(`eh_orders_${userId}`) || "[]") as PharmacyOrder[]; }
    catch { return []; }
  });
  const [homeBookings, setHomeBookings] = useState<HomeCollectionBooking[]>(defaultHomeBookings);
  const [consentPermissions, setConsentPermissions] = useState<ConsentPermission[]>(defaultConsentPermissions);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState<DoctorPrescription[]>(defaultDoctorPrescriptions);
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);

  // Modals state
  const [showSymptomAssistant, setShowSymptomAssistant] = useState(false);
  const [showOcrUpload, setShowOcrUpload] = useState(false);
  const [selectedReportForAi, setSelectedReportForAi] = useState<MedicalReport | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Active Teleconsult
  const [teleconsultSession, setTeleconsultSession] = useState<TeleconsultSession | null>(null);

  // ── Persist user data to localStorage whenever it changes ──────────────────
  useEffect(() => {
    const session = loadSession();
    if (session) localStorage.setItem(`eh_reports_${session.userId}`, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    const session = loadSession();
    if (session) localStorage.setItem(`eh_appointments_${session.userId}`, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    const session = loadSession();
    if (session) localStorage.setItem(`eh_medications_${session.userId}`, JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    const userId = loadSession()?.userId || "guest";
    localStorage.setItem(`eh_cart_${userId}`, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const userId = loadSession()?.userId || "guest";
    localStorage.setItem(`eh_orders_${userId}`, JSON.stringify(orders));
  }, [orders]);

  // Real-time Registration Methods
  const registerPatient = (newProfile: PatientProfile) => {
    setPatientProfile(newProfile);
    setRole("patient");
    setIsRegistered(true);
    setCurrentPage("dashboard");
    addNotification({
      title: `Welcome, ${newProfile.name.split(" ")[0]}!`,
      message: `Your medical profile has been initialized with Blood Group ${newProfile.bloodGroup}.`,
      type: "report",
      actionPage: "profile",
    });
  };

  const registerDoctor = (newDoc: Doctor) => {
    setActiveDoctor(newDoc);
    setRole("doctor");
    setIsRegistered(true);
    setCurrentPage("dashboard");
    addNotification({
      title: `Welcome, ${newDoc.name}!`,
      message: `Your practice as ${newDoc.specialty} at ${newDoc.hospital} is active.`,
      type: "appointment",
      actionPage: "doctor-dashboard",
    });
  };

  const openRegistration = () => {
    setIsRegistered(false);
  };

  const logout = () => {
    const session = loadSession();
    clearSession();
    setIsRegistered(false);
    setCurrentPage("dashboard");
    // Reset state to empty so next login starts clean
    setReports([]);
    setAppointments([]);
    setMedications([]);
    setCart([]);
    setOrders([]);
  };

  // Helper actions
  const addAppointment = (a: Appointment) => {
    setAppointments((prev) => [a, ...prev]);
    addNotification({
      title: "Appointment Booked!",
      message: `Your appointment with ${a.doctorName} is confirmed for ${a.date} at ${a.time}.`,
      type: "appointment",
      actionPage: "appointments",
    });
  };

  const updateAppointmentStatus = (id: string, status: Appointment["status"]) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const addReport = (r: MedicalReport) => {
    setReports((prev) => [r, ...prev]);
    addNotification({
      title: "New Report Uploaded",
      message: `${r.name} has been securely uploaded and parsed.`,
      type: "report",
      actionPage: "records",
    });
  };

  const updateReport = (id: string, updated: Partial<MedicalReport>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  const toggleMedicationTaken = (id: string, index: number) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newTaken = [...m.taken];
        newTaken[index] = !newTaken[index];
        return { ...m, taken: newTaken };
      })
    );
  };

  const addMedication = (m: Medication) => {
    setMedications((prev) => [m, ...prev]);
  };

  // Cart operations
  const addToCart = (med: Medicine) => {
    if (!med.stock) return false;
    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === med.id);
      if (existing) {
        return prev.map((item) =>
          item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine: med, quantity: 1 }];
    });
    return true;
  };

  const removeFromCart = (medId: string) => {
    setCart((prev) => prev.filter((item) => item.medicine.id !== medId));
  };

  const updateCartQuantity = (medId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const placeOrder = (orderData: Omit<PharmacyOrder, "id" | "date" | "status"> & Partial<Pick<PharmacyOrder, "id" | "date" | "status">>) => {
    const newOrder: PharmacyOrder = {
      ...orderData,
      id: orderData.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: orderData.date || new Date().toISOString().split("T")[0],
      status: orderData.status || "Processing",
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    addNotification({
      title: "Order Placed Successfully",
      message: `Your medicine order #${newOrder.id} of ₹${newOrder.total} is placed and will arrive today.`,
      type: "order",
      actionPage: "pharmacy",
    });
    return newOrder.id;
  };

  // Home Collection
  const addHomeBooking = (bookingData: Omit<HomeCollectionBooking, "id" | "status">) => {
    const newBooking: HomeCollectionBooking = {
      ...bookingData,
      id: `HC-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Confirmed",
      phlebotomistName: "Sanjay Verma (Certified Phlebotomist)",
      phlebotomistPhone: "+91 97120 44556",
    };
    setHomeBookings((prev) => [newBooking, ...prev]);
    addNotification({
      title: "Home Sample Collection Booked",
      message: `Doorstep sample pickup booked for ${newBooking.packageName} on ${newBooking.date} (${newBooking.timeSlot}).`,
      type: "report",
      actionPage: "labs",
    });
  };

  // Teleconsultation
  const startTeleconsult = (appointment: Appointment, doctor: Doctor) => {
    setTeleconsultSession({
      isActive: true,
      appointment,
      doctor,
      videoEnabled: true,
      audioEnabled: true,
      notes: "",
      messages: [
        {
          sender: doctor.name,
          text: `Hello ${patientProfile.name.split(" ")[0]}! I have reviewed your latest vitals and CBC report. How are you feeling today?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    });
    updateAppointmentStatus(appointment.id, "ongoing");
  };

  const endTeleconsult = () => {
    if (teleconsultSession?.appointment) {
      updateAppointmentStatus(teleconsultSession.appointment.id, "completed");
    }
    setTeleconsultSession(null);
  };

  const toggleTeleconsultVideo = () => {
    setTeleconsultSession((prev) => (prev ? { ...prev, videoEnabled: !prev.videoEnabled } : null));
  };

  const toggleTeleconsultAudio = () => {
    setTeleconsultSession((prev) => (prev ? { ...prev, audioEnabled: !prev.audioEnabled } : null));
  };

  const sendTeleconsultMessage = (text: string) => {
    if (!text.trim()) return;
    setTeleconsultSession((prev) => {
      if (!prev) return null;
      const userMsg = {
        sender: patientProfile.name.split(" ")[0],
        text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return { ...prev, messages: [...prev.messages, userMsg] };
    });
  };

  // Doctor & Consent
  const grantConsent = (doctorId: string) => {
    setConsentPermissions((prev) =>
      prev.map((c) =>
        c.doctorId === doctorId
          ? { ...c, status: "granted", grantedDate: new Date().toISOString().split("T")[0] }
          : c
      )
    );
  };

  const revokeConsent = (doctorId: string) => {
    setConsentPermissions((prev) =>
      prev.map((c) => (c.doctorId === doctorId ? { ...c, status: "revoked" } : c))
    );
  };

  const addDoctorPrescription = (p: DoctorPrescription) => {
    setDoctorPrescriptions((prev) => [p, ...prev]);
    p.medications.forEach((med) => {
      addMedication({
        id: `med-rx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        startDate: p.date,
        prescribedBy: p.doctorName,
        times: ["9:00 AM", "9:00 PM"],
        taken: [false, false, false, false, false, false, false],
        stock: 30,
        instructions: `${med.timing} - ${med.duration}`,
      });
    });
    addNotification({
      title: "New Prescription Received",
      message: `${p.doctorName} uploaded a digital prescription for you.`,
      type: "medicine",
      actionPage: "appointments",
    });
  };

  // Notifications
  const addNotification = (n: Omit<NotificationItem, "id" | "time" | "read">) => {
    const newNotif: NotificationItem = {
      ...n,
      id: `notif-${Date.now()}`,
      time: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleVaultLock = () => {
    setIsVaultLocked((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentPage,
        setCurrentPage,
        isRegistered,
        setIsRegistered,
        openRegistration,
        registerPatient,
        registerDoctor,
        logout,
        activeDoctor,
        setActiveDoctor,
        patientProfile,
        setPatientProfile,
        appointments,
        addAppointment,
        updateAppointmentStatus,
        reports,
        addReport,
        updateReport,
        medications,
        toggleMedicationTaken,
        addMedication,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        orders,
        placeOrder,
        homeBookings,
        addHomeBooking,
        teleconsultSession,
        startTeleconsult,
        endTeleconsult,
        toggleTeleconsultVideo,
        toggleTeleconsultAudio,
        sendTeleconsultMessage,
        consentPermissions,
        grantConsent,
        revokeConsent,
        doctorPrescriptions,
        addDoctorPrescription,
        notifications,
        addNotification,
        markNotificationRead,
        clearAllNotifications,
        unreadCount,
        isVaultLocked,
        toggleVaultLock,
        showSymptomAssistant,
        setShowSymptomAssistant,
        showOcrUpload,
        setShowOcrUpload,
        selectedReportForAi,
        setSelectedReportForAi,
        showSecurityModal,
        setShowSecurityModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
