/**
 * EasyHealth Database Layer
 * - Uses PostgreSQL by default; in-memory storage must be explicitly enabled
 */
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const env = require("./env");

let pool = null;
let usingPostgres = false;

async function initialize() {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required.");
  }

  if (env.DATABASE_MODE === "memory") {
    seedMemory();
    console.warn("⚠️  Explicit in-memory mode enabled; backend data will not persist.");
    return;
  }
  if (env.DATABASE_MODE !== "postgres") {
    throw new Error(`Unsupported DATABASE_MODE: ${env.DATABASE_MODE}`);
  }
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when DATABASE_MODE=postgres.");
  }

  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on("error", (err) => {
    console.error("[PostgreSQL Pool Error]:", err.message);
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    await pool.end();
    pool = null;
    throw new Error(
      `Unable to connect to PostgreSQL: ${err.message || err.code || err.name}`
    );
  } finally {
    if (client) client.release();
  }
  usingPostgres = true;
  console.log("✅ Connected to PostgreSQL successfully");
}

// ─── Query Helper ─────────────────────────────────────────────────────────────
async function query(text, params = []) {
  if (!pool || !usingPostgres) {
    throw new Error("PostgreSQL not active");
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === "development") {
    console.log(`[SQL] (${duration}ms) ${text.trim().substring(0, 80)}`);
  }
  return res;
}

// ─── Transaction Helper ───────────────────────────────────────────────────────
async function withTransaction(callback) {
  if (!pool || !usingPostgres) {
    throw new Error("PostgreSQL not active");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getClient() {
  if (!pool || !usingPostgres) {
    throw new Error("PostgreSQL not active");
  }
  return pool.connect();
}

// ─── In-Memory Store (Thread-safe fallback) ──────────────────────────────────
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
    {
      id: patientId,
      email: "patient@demo.com",
      passwordHash: bcrypt.hashSync("demo1234", 10),
      role: "patient",
      name: "Ananya Krishnan",
      phone: "+91 98765 43210",
      createdAt: new Date("2024-01-01").toISOString(),
      isActive: true,
    },
    {
      id: doctorUserId,
      email: "doctor@demo.com",
      passwordHash: bcrypt.hashSync("demo1234", 10),
      role: "doctor",
      name: "Dr. Priya Sharma",
      phone: "+91 98765 11111",
      createdAt: new Date("2024-01-01").toISOString(),
      isActive: true,
    }
  );

  mem.patients.push({
    id: patientId,
    userId: patientId,
    name: "Ananya Krishnan",
    age: 28,
    gender: "Female",
    dob: "1996-03-15",
    phone: "+91 98765 43210",
    email: "patient@demo.com",
    bloodGroup: "B+",
    height: 164,
    weight: 58,
    allergies: ["Penicillin", "Dust Mites"],
    chronicConditions: ["Mild Bronchial Asthma"],
    emergencyContact: "+91 98765 00000 (Rohan Krishnan - Brother)",
    address: "Flat 402, Green Glen Layout, Bangalore 560103",
    pastSurgeries: ["Appendectomy (2019)"],
    vaccinations: ["COVID-19 (3 doses)", "Hepatitis B"],
  });

  mem.doctors.push(
    {
      id: "d1",
      userId: doctorUserId,
      name: "Dr. Priya Sharma",
      specialty: "Cardiologist",
      qualifications: ["MBBS", "MD", "DM (Cardiology)", "FACC"],
      experience: 18,
      hospital: "Apollo Hospitals",
      hospitalId: "h1",
      consultFee: 1200,
      emergencyFee: 2500,
      languages: ["English", "Hindi", "Tamil"],
      about: "Senior interventional cardiologist with 18+ years of expertise in preventive cardiology and heart rhythm management.",
      imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
      rating: 4.9,
      reviewCount: 1240,
      patientsCount: 4800,
      successRate: 98,
      isVerified: true,
      isOnline: true,
      availableToday: true,
      nextSlot: "11:30 AM",
    },
    {
      id: "d2",
      userId: null,
      name: "Dr. Arjun Mehta",
      specialty: "Neurologist",
      qualifications: ["MBBS", "MD", "DM (Neurology)"],
      experience: 14,
      hospital: "Apollo Hospitals",
      hospitalId: "h1",
      consultFee: 1000,
      emergencyFee: 2200,
      languages: ["English", "Hindi"],
      about: "Expert in neuro-diagnostics and migraine therapy.",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80",
      rating: 4.7,
      reviewCount: 892,
      patientsCount: 3200,
      successRate: 96,
      isVerified: true,
      isOnline: false,
      availableToday: true,
      nextSlot: "2:00 PM",
    }
  );

  mem.appointments.push(
    {
      id: "APT-849102",
      patientId,
      doctorId: "d1",
      doctorName: "Dr. Priya Sharma",
      doctorSpecialty: "Cardiologist",
      doctorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
      patientName: "Ananya Krishnan",
      patientAge: 28,
      date: "2026-11-28",
      time: "11:30 AM",
      mode: "video",
      status: "upcoming",
      hospital: "Apollo Hospitals",
      fee: 1200,
      symptoms: "Palpitation and fatigue",
      createdAt: new Date("2026-11-20").toISOString(),
    }
  );

  mem.records.push(
    {
      id: "REC-001",
      patientId,
      name: "Complete Blood Count",
      type: "Blood Test",
      date: "2026-11-15",
      uploadedBy: "Apollo Diagnostics",
      fileName: "CBC_Nov2026.pdf",
      fileUrl: null,
      aiSummary: "CBC shows mild iron deficiency anemia (Hb 11.4 g/dL). WBC and platelets normal.",
      aiAnalysed: true,
      isEncrypted: true,
      tags: ["Blood Test", "Anemia"],
      isDeleted: false,
      biomarkers: [
        { parameter: "Hemoglobin", value: "11.4", unit: "g/dL", referenceRange: "12.0–15.5", status: "Low", explanation: "Mild iron deficiency anemia." },
        { parameter: "WBC Count", value: "7200", unit: "/μL", referenceRange: "4000–11000", status: "Normal", explanation: "No signs of infection." },
        { parameter: "Platelet Count", value: "245000", unit: "/μL", referenceRange: "150000–450000", status: "Normal", explanation: "Normal clotting capacity." }
      ],
      createdAt: new Date("2026-11-15").toISOString(),
    }
  );

  mem.medications.push(
    {
      id: "MED-001",
      patientId,
      name: "Ferrous Sulphate 200mg",
      dosage: "200mg",
      frequency: "Once daily after dinner",
      startDate: "2026-11-16",
      prescribedBy: "Dr. Priya Sharma",
      times: ["8:00 PM"],
      stock: 45,
      instructions: "Take with Vitamin C for optimal absorption. Avoid tea or coffee within 1 hour.",
      isActive: true,
    },
    {
      id: "MED-002",
      patientId,
      name: "Montelukast 10mg",
      dosage: "10mg",
      frequency: "Once daily at bedtime",
      startDate: "2026-10-01",
      prescribedBy: "Dr. Meera Nair",
      times: ["10:00 PM"],
      stock: 8,
      instructions: "Take at bedtime. Controls nighttime asthma symptoms.",
      isActive: true,
    }
  );
}

const db = {
  _mem: mem,
  _pool: () => pool,
  isPostgres: () => usingPostgres && pool !== null,
  initialize,
  query,
  withTransaction,
  getClient,
  collection(name) {
    return mem[name] || [];
  },
};

module.exports = { db, mem, query, withTransaction, getClient, initialize };
