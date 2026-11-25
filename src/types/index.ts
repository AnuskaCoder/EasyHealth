// ─── Auth & Roles ────────────────────────────────────────────────────────────
export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// ─── Patient ─────────────────────────────────────────────────────────────────
export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  dob: string;
  phone: string;
  email: string;
  bloodGroup: string;
  height: number;
  weight: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: string;
  address?: string;
  avatar?: string;
  pastSurgeries?: string[];
  vaccinations?: string[];
}

// ─── Doctor ──────────────────────────────────────────────────────────────────
export type DoctorCategory =
  | "Cardiologist" | "Neurologist" | "Orthopedic Surgeon" | "Dermatologist"
  | "Pediatrician" | "Gynecologist" | "Psychiatrist" | "Ophthalmologist"
  | "ENT Specialist" | "Oncologist" | "Urologist" | "Endocrinologist"
  | "Gastroenterologist" | "Pulmonologist" | "Emergency Medicine"
  | "General Physician" | "Cardiac Surgeon" | "Nephologist";

export interface Doctor {
  id: string;
  name: string;
  specialty: DoctorCategory;
  qualifications: string[];
  experience: number;
  hospital: string;
  hospitalId: string;
  rating: number;
  reviewCount: number;
  consultFee: number;
  emergencyFee: number;
  availableToday: boolean;
  nextSlot: string;
  languages: string[];
  about: string;
  image: string;
  verified: boolean;
  online: boolean;
  patientsCount: number;
  successRate: number;
}

// ─── Appointment ─────────────────────────────────────────────────────────────
export type AppointmentStatus = "upcoming" | "completed" | "cancelled" | "ongoing";
export type AppointmentMode = "in-person" | "video" | "emergency";

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage: string;
  patientId: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  date: string;
  time: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  hospital: string;
  fee: number;
  symptoms?: string;
  notes?: string;
}

// ─── Medical Records & OCR ──────────────────────────────────────────────────
export type ReportType = "Blood Test" | "Urine Test" | "X-Ray" | "MRI" | "CT Scan" | "ECG" | "Prescription" | "Full Body Panel" | "Other";

export interface BiomarkerResult {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "Normal" | "Low" | "High" | "Critical";
  explanation?: string;
}

export interface MedicalReport {
  id: string;
  name: string;
  type: ReportType;
  date: string;
  uploadedBy: string;
  fileUrl: string;
  aiSummary?: string;
  aiAnalysed: boolean;
  tags: string[];
  biomarkers?: BiomarkerResult[];
  fileName?: string;
  isEncrypted?: boolean;
}

// ─── Medication ──────────────────────────────────────────────────────────────
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  times: string[];
  taken: boolean[];
  stock: number;
  instructions?: string;
}

// ─── Pharmacy ────────────────────────────────────────────────────────────────
export interface Medicine {
  id: string;
  name: string;
  generic: string;
  brand: string;
  category: string;
  price: number;
  discountPct: number;
  finalPrice: number;
  stock: boolean;
  rxRequired: boolean;
  image: string;
  rating: number;
  description: string;
  packSize: string;
  savings?: number;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface PharmacyOrder {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "Processing" | "Packed" | "Out for Delivery" | "Delivered";
  address: string;
  couponApplied?: string;
}

// ─── Lab Tests & Home Collection ─────────────────────────────────────────────
export interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPct: number;
  finalPrice: number;
  homeCollection: boolean;
  reportTime: string;
  description: string;
  includes?: string[];
  popular: boolean;
  sampleType?: "Blood" | "Urine" | "Blood & Urine" | "Swab" | "Imaging";
  fastingRequired?: boolean;
}

export interface HomeCollectionBooking {
  id: string;
  packageId: string;
  packageName: string;
  patientName: string;
  sampleType: string;
  date: string;
  timeSlot: string;
  address: string;
  fee: number;
  status: "Confirmed" | "Phlebotomist Assigned" | "Sample Collected" | "Processing in Lab" | "Report Ready";
  phlebotomistName?: string;
  phlebotomistPhone?: string;
}

// ─── Health Stats ─────────────────────────────────────────────────────────────
export interface HealthStat {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  date: string;
}

// ─── Hospital ────────────────────────────────────────────────────────────────
export type BedType = "ICU" | "General" | "Private" | "Emergency";
export interface BedAvailability { type: BedType; total: number; available: number; }
export interface Hospital {
  id: string; name: string; address: string; distance: number;
  rating: number; reviewCount: number; phone: string;
  emergency24x7: boolean; ambulance: boolean; specialities: string[];
  beds: BedAvailability[]; waitTime: number; image: string;
}

// ─── Chat & RAG ──────────────────────────────────────────────────────────────
export interface RAGSource {
  title: string;
  authority: string;
  quote: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  type?: "text" | "suggestion" | "report";
  sources?: RAGSource[];
  suggestedActions?: { label: string; action: string; page?: string }[];
}

// ─── Teleconsultation ─────────────────────────────────────────────────────────
export interface TeleconsultSession {
  isActive: boolean;
  appointment?: Appointment;
  doctor?: Doctor;
  videoEnabled: boolean;
  audioEnabled: boolean;
  notes: string;
  messages: { sender: string; text: string; time: string }[];
}

// ─── Consent & Records Access ────────────────────────────────────────────────
export interface ConsentPermission {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  status: "granted" | "requested" | "revoked";
  requestedDate: string;
  grantedDate?: string;
}

export interface DoctorPrescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  diagnosis: string;
  vitals?: { bp: string; pulse: string; temp: string; weight: string };
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    timing: "Before Food" | "After Food" | "With Food";
  }[];
  notes: string;
  nextFollowUp?: string;
}

// ─── Real-time Notifications ─────────────────────────────────────────────────
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "appointment" | "medicine" | "report" | "emergency" | "order";
  read: boolean;
  actionPage?: string;
}

// ─── Doctor Dashboard ────────────────────────────────────────────────────────
export interface DoctorStats {
  totalPatients: number;
  todayAppointments: number;
  pendingReports: number;
  monthlyRevenue: number;
  rating: number;
  completedThisMonth: number;
  avgWaitTimeMins: number;
}
