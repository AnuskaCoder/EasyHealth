/**
 * EasyHealth Database Layer
 * - Uses PostgreSQL when DATABASE_URL is set (production/staging)
 * - Falls back to in-memory store for local development without PostgreSQL
 */
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// ─── PostgreSQL Connection Pool ───────────────────────────────────────────────
let pool = null;
let usingPostgres = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err.message);
    });

    // Test connection
    pool.connect().then(client => {
      client.release();
      usingPostgres = true;
      console.log("✅ Connected to PostgreSQL");
    }).catch(err => {
      console.warn("⚠️  PostgreSQL connection failed, falling back to in-memory:", err.message);
      pool = null;
    });
  } catch (err) {
    console.warn("⚠️  pg module error, falling back to in-memory:", err.message);
  }
} else {
  console.log("ℹ️  No DATABASE_URL set — using in-memory store (set DATABASE_URL for PostgreSQL)");
}

// ─── Database Query Helper ────────────────────────────────��───────────────────
async function query(text, params) {
  if (!pool || !usingPostgres) {
    throw new Error("PostgreSQL not available");
  }
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    console.log(`[DB] ${duration}ms — ${text.substring(0, 60)}`);
  }
  return result;
}

async function getClient() {
  if (!pool) throw new Error("PostgreSQL not available");
  return pool.connect();
}

// ─── In-Memory Store (fallback / development) ─────────────────────────────────
const mem = {
  users: [],
  patients: [],
  doctors: [],
  appointments: [],
  records: [],
  medications: [],
  orders: [],
  labBookings: [],
  consentPermissions: [],
  prescriptions: [],
  auditLogs: [],
};

function seedMemory() {
  if (mem.users.length > 0) return;

  const patientId = "p1-demo-0000-0000-000000000001";
  const doctorUserId = "d1-demo-0000-0000-000000000001";

  mem.users.push(
    { id: patientId, email: "patient@demo.com", passwordHash: bcrypt.hashSync("demo1234", 10), role: "patient", name: "Ananya Krishnan", phone: "+91 98765 43210", createdAt: new Date("2024-01-01").toISOString(), isActive: true },
    { id: doctorUserId, email: "doctor@demo.com", passwordHash: bcrypt.hashSync("demo1234", 10), role: "doctor", name: "Dr. Priya Sharma", phone: "+91 98765 11111", createdAt: new Date("2024-01-01").toISOString(), isActive: true }
  );

  mem.patients.push({
    id: patientId, userId: patientId, name: "Ananya Krishnan", age: 28, gender: "Female",
    dob: "1996-03-15", phone: "+91 98765 43210", email: "patient@demo.com",
    bloodGroup: "B+", height: 164, weight: 58,
    allergies: ["Penicillin", "Dust Mites"],
    chronicConditions: ["Mild Bronchial Asthma"],
    emergencyContact: "+91 98765 00000 (Rohan)",
    address: "Flat 402, Green Glen Layout, Bangalore 560103",
    pastSurgeries: ["Appendectomy (2019)"],
    vaccinations: ["COVID-19 (3 doses)", "Hepatitis B"],
  });

  mem.doctors.push(
    { id: "d1", userId: doctorUserId, name: "Dr. Priya Sharma", specialty: "Cardiologist", qualifications: ["MBBS","MD","DM (Cardiology)","FACC"], experience: 18, hospital: "Apollo Hospitals", hospitalId: "h1", consultFee: 1200, emergencyFee: 2500, languages: ["English","Hindi","Tamil"], about: "Senior interventional cardiologist.", imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80", rating: 4.9, reviewCount: 1240, patientsCount: 4800, successRate: 98, isVerified: true, isOnline: true, availableToday: true, nextSlot: "11:30 AM" },
    { id: "d2", userId: null, name: "Dr. Arjun Mehta", specialty: "Neurologist", qualifications: ["MBBS","MD","DM (Neurology)"], experience: 14, hospital: "Apollo Hospitals", hospitalId: "h1", consultFee: 1000, emergencyFee: 2200, languages: ["English","Hindi"], about: "Expert neurologist.", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80", rating: 4.7, reviewCount: 892, patientsCount: 3200, successRate: 96, isVerified: true, isOnline: false, availableToday: true, nextSlot: "2:00 PM" },
    { id: "d3", userId: null, name: "Dr. Sunita Rao", specialty: "Orthopedic Surgeon", qualifications: ["MBBS","MS (Ortho)","DNB"], experience: 22, hospital: "Fortis Healthcare", hospitalId: "h2", consultFee: 1500, emergencyFee: 3000, languages: ["English","Kannada"], about: "Leading orthopedic surgeon.", imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&q=80", rating: 4.8, reviewCount: 1560, patientsCount: 5100, successRate: 97, isVerified: true, isOnline: false, availableToday: false, nextSlot: "Tomorrow 10:00 AM" },
    { id: "d4", userId: null, name: "Dr. Rahul Kapoor", specialty: "Emergency Medicine", qualifications: ["MBBS","MD (Emergency Medicine)"], experience: 10, hospital: "Max Super Specialty", hospitalId: "h3", consultFee: 800, emergencyFee: 1800, languages: ["English","Hindi"], about: "Emergency medicine specialist.", imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&q=80", rating: 4.6, reviewCount: 643, patientsCount: 2800, successRate: 95, isVerified: true, isOnline: true, availableToday: true, nextSlot: "Now" },
    { id: "d5", userId: null, name: "Dr. Meera Nair", specialty: "Pediatrician", qualifications: ["MBBS","MD (Pediatrics)"], experience: 16, hospital: "Narayana Health City", hospitalId: "h4", consultFee: 900, emergencyFee: 2000, languages: ["English","Malayalam","Hindi"], about: "Compassionate pediatrician.", imageUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&q=80", rating: 4.9, reviewCount: 2100, patientsCount: 6200, successRate: 99, isVerified: true, isOnline: true, availableToday: true, nextSlot: "3:30 PM" },
    { id: "d7", userId: null, name: "Dr. Kavitha Reddy", specialty: "Dermatologist", qualifications: ["MBBS","MD (Dermatology)"], experience: 12, hospital: "Apollo Hospitals", hospitalId: "h1", consultFee: 800, emergencyFee: 1500, languages: ["English","Telugu"], about: "Expert dermatologist.", imageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&q=80", rating: 4.8, reviewCount: 1420, patientsCount: 4100, successRate: 97, isVerified: true, isOnline: true, availableToday: true, nextSlot: "4:00 PM" }
  );

  mem.appointments.push(
    { id: "APT-849102", patientId, doctorId: "d1", doctorName: "Dr. Priya Sharma", doctorSpecialty: "Cardiologist", doctorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80", patientName: "Ananya Krishnan", patientAge: 28, date: "2026-11-28", time: "11:30 AM", mode: "video", status: "upcoming", hospital: "Apollo Hospitals", fee: 1200, symptoms: "Palpitation and fatigue", createdAt: new Date("2026-11-20").toISOString() },
    { id: "APT-619283", patientId, doctorId: "d5", doctorName: "Dr. Meera Nair", doctorSpecialty: "Pediatrician", doctorImage: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&q=80", patientName: "Ananya Krishnan", patientAge: 28, date: "2026-11-20", time: "3:30 PM", mode: "video", status: "completed", hospital: "Narayana Health City", fee: 900, notes: "Continue Montelukast at bedtime.", createdAt: new Date("2026-11-10").toISOString() }
  );

  mem.records.push(
    { id: "REC-001", patientId, name: "Complete Blood Count", type: "Blood Test", date: "2026-11-15", uploadedBy: "Apollo Diagnostics", fileName: "CBC_Nov2026.pdf", fileUrl: null, aiSummary: "CBC shows mild iron deficiency anemia (Hb 11.4 g/dL). WBC and platelets normal.", aiAnalysed: true, isEncrypted: true, tags: ["Blood Test","Anemia"], isDeleted: false, biomarkers: [{ parameter: "Hemoglobin", value: "11.4", unit: "g/dL", referenceRange: "12.0–15.5", status: "Low", explanation: "Mild iron deficiency anemia." },{ parameter: "WBC Count", value: "7200", unit: "/μL", referenceRange: "4000–11000", status: "Normal", explanation: "No signs of infection." },{ parameter: "Platelet Count", value: "245000", unit: "/μL", referenceRange: "150000–450000", status: "Normal", explanation: "Normal clotting." }], createdAt: new Date("2026-11-15").toISOString() },
    { id: "REC-002", patientId, name: "Lipid Profile", type: "Blood Test", date: "2026-10-05", uploadedBy: "Dr. Lal PathLabs", fileName: "Lipid_Oct2026.pdf", fileUrl: null, aiSummary: "Excellent lipid panel. Total cholesterol 185 mg/dL, LDL 95 mg/dL optimal.", aiAnalysed: true, isEncrypted: true, tags: ["Blood Test","Cholesterol"], isDeleted: false, biomarkers: [{ parameter: "Total Cholesterol", value: "185", unit: "mg/dL", referenceRange: "< 200", status: "Normal", explanation: "Healthy." },{ parameter: "LDL Cholesterol", value: "95", unit: "mg/dL", referenceRange: "< 100", status: "Normal", explanation: "Optimal LDL." },{ parameter: "HDL Cholesterol", value: "62", unit: "mg/dL", referenceRange: "> 50", status: "Normal", explanation: "Protective HDL level." }], createdAt: new Date("2026-10-05").toISOString() }
  );

  mem.medications.push(
    { id: "MED-001", patientId, name: "Ferrous Sulphate 200mg", dosage: "200mg", frequency: "Once daily after dinner", startDate: "2026-11-16", prescribedBy: "Dr. Priya Sharma", times: ["8:00 PM"], stock: 45, instructions: "Take with Vitamin C for better absorption. Avoid tea/coffee within 1 hour.", isActive: true },
    { id: "MED-002", patientId, name: "Montelukast 10mg", dosage: "10mg", frequency: "Once daily at bedtime", startDate: "2026-10-01", prescribedBy: "Dr. Meera Nair", times: ["10:00 PM"], stock: 8, instructions: "Take at bedtime. Do not stop without consulting your doctor.", isActive: true }
  );

  mem.labBookings.push({ id: "LAB-001", patientId, packageId: "l1", packageName: "Complete Blood Count", sampleType: "Blood", date: "2026-11-15", timeSlot: "7:00 AM - 9:00 AM", address: "Flat 402, Bangalore 560103", fee: 299, status: "Report Ready", phlebotomistName: "Ramesh Kumar", phlebotomistPhone: "+91 98700 11234", createdAt: new Date("2026-11-13").toISOString() });

  console.log("✅ In-memory store seeded (patient@demo.com / doctor@demo.com / demo1234)");
}

seedMemory();

// ─── Repository helpers — unified API for both PG and in-memory ───────────────
const db = {
  // Raw access for in-memory mode
  _mem: mem,
  _pool: () => pool,
  isPostgres: () => usingPostgres && pool !== null,

  // Generic query (PostgreSQL only)
  query,
  getClient,

  // Convenience: returns in-memory collection by name
  collection(name) {
    return mem[name] || [];
  },
};

module.exports = { db, mem, query, getClient };
