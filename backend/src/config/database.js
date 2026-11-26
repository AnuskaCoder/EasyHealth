/**
 * In-memory database simulation
 * Pre-seeded with demo data matching the frontend
 * In production this would be replaced by PostgreSQL via pg/Prisma
 */
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const db = {
  users: [],
  patients: [],
  doctors: [],
  appointments: [],
  records: [],
  medications: [],
  orders: [],
  labBookings: [],
  consentPermissions: [],
};

function seedDatabase() {
  if (db.users.length > 0) return; // already seeded

  const patientId = "p1-demo-uuid-0000-000000000001";
  const doctorUserId = "d1-demo-uuid-0000-000000000001";

  // ── Demo Users ────────────────────────────────────────────────────────────
  db.users.push(
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

  // ── Demo Patient Profile ──────────────────────────────────────────────────
  db.patients.push({
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
    address: "Flat 402, Green Glen Layout, Bellandur, Bangalore 560103",
    pastSurgeries: ["Appendectomy (2019)"],
    vaccinations: ["COVID-19 (3 doses)", "Hepatitis B"],
  });

  // ── Demo Doctor Profiles ──────────────────────────────────────────────────
  db.doctors.push(
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
      about: "Senior interventional cardiologist with 18 years of expertise in cardiac catheterization and heart failure management.",
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
      qualifications: ["MBBS", "MD (Neurology)", "DM"],
      experience: 14,
      hospital: "Apollo Hospitals",
      hospitalId: "h1",
      consultFee: 1000,
      emergencyFee: 2200,
      languages: ["English", "Hindi"],
      about: "Expert neurologist specializing in stroke, epilepsy, and movement disorders.",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80",
      rating: 4.7,
      reviewCount: 892,
      patientsCount: 3200,
      successRate: 96,
      isVerified: true,
      isOnline: false,
      availableToday: true,
      nextSlot: "2:00 PM",
    },
    {
      id: "d3",
      userId: null,
      name: "Dr. Sunita Rao",
      specialty: "Orthopedic Surgeon",
      qualifications: ["MBBS", "MS (Orthopaedics)", "DNB"],
      experience: 22,
      hospital: "Fortis Healthcare",
      hospitalId: "h2",
      consultFee: 1500,
      emergencyFee: 3000,
      languages: ["English", "Kannada"],
      about: "Renowned orthopedic surgeon with expertise in joint replacement and sports injuries.",
      imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&q=80",
      rating: 4.8,
      reviewCount: 1560,
      patientsCount: 5100,
      successRate: 97,
      isVerified: true,
      isOnline: false,
      availableToday: false,
      nextSlot: "Tomorrow 10:00 AM",
    },
    {
      id: "d4",
      userId: null,
      name: "Dr. Rahul Kapoor",
      specialty: "Emergency Medicine",
      qualifications: ["MBBS", "MD (Emergency Medicine)"],
      experience: 10,
      hospital: "Max Super Specialty",
      hospitalId: "h3",
      consultFee: 800,
      emergencyFee: 1800,
      languages: ["English", "Hindi"],
      about: "Emergency medicine specialist with expertise in critical care and trauma.",
      imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&q=80",
      rating: 4.6,
      reviewCount: 643,
      patientsCount: 2800,
      successRate: 95,
      isVerified: true,
      isOnline: true,
      availableToday: true,
      nextSlot: "Now",
    },
    {
      id: "d5",
      userId: null,
      name: "Dr. Meera Nair",
      specialty: "Pediatrician",
      qualifications: ["MBBS", "MD (Pediatrics)", "DNB"],
      experience: 16,
      hospital: "Narayana Health City",
      hospitalId: "h4",
      consultFee: 900,
      emergencyFee: 2000,
      languages: ["English", "Malayalam", "Hindi"],
      about: "Compassionate pediatrician specializing in neonatology and childhood development.",
      imageUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&q=80",
      rating: 4.9,
      reviewCount: 2100,
      patientsCount: 6200,
      successRate: 99,
      isVerified: true,
      isOnline: true,
      availableToday: true,
      nextSlot: "3:30 PM",
    },
    {
      id: "d7",
      userId: null,
      name: "Dr. Kavitha Reddy",
      specialty: "Dermatologist",
      qualifications: ["MBBS", "MD (Dermatology)"],
      experience: 12,
      hospital: "Apollo Hospitals",
      hospitalId: "h1",
      consultFee: 800,
      emergencyFee: 1500,
      languages: ["English", "Telugu"],
      about: "Expert dermatologist specializing in cosmetic dermatology and skin disorders.",
      imageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&q=80",
      rating: 4.8,
      reviewCount: 1420,
      patientsCount: 4100,
      successRate: 97,
      isVerified: true,
      isOnline: true,
      availableToday: true,
      nextSlot: "4:00 PM",
    }
  );

  // ── Demo Appointments ──────────────────────────────────────────────────────
  db.appointments.push(
    {
      id: "APT-849102",
      patientId: patientId,
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
      symptoms: "Occasional palpitation during workout, mild fatigue",
      createdAt: new Date("2026-11-20").toISOString(),
    },
    {
      id: "APT-619283",
      patientId: patientId,
      doctorId: "d5",
      doctorName: "Dr. Meera Nair",
      doctorSpecialty: "Pediatrician",
      doctorImage: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&q=80",
      patientName: "Ananya Krishnan",
      patientAge: 28,
      date: "2026-11-20",
      time: "3:30 PM",
      mode: "video",
      status: "completed",
      hospital: "Narayana Health City",
      fee: 900,
      notes: "Follow-up in 2 weeks. Continue Montelukast at bedtime.",
      createdAt: new Date("2026-11-10").toISOString(),
    }
  );

  // ── Demo Medical Records ────────────────────────────────────────────────────
  db.records.push(
    {
      id: "REC-001-CBC",
      patientId: patientId,
      name: "Complete Blood Count",
      type: "Lab Report",
      date: "2026-11-15",
      uploadedBy: "Dr. Priya Sharma",
      fileName: "CBC_Nov2026.pdf",
      fileUrl: null,
      fileSizeKb: 234,
      aiSummary: "CBC shows mild iron deficiency anemia (Hb 11.4 g/dL). WBC and platelets normal. Recommend iron supplementation and Vitamin C.",
      aiAnalysed: true,
      isEncrypted: true,
      tags: ["Blood Test", "Anemia", "CBC"],
      isDeleted: false,
      biomarkers: [
        { parameter: "Hemoglobin", value: "11.4", unit: "g/dL", referenceRange: "12.0–15.5", status: "Low", explanation: "Mild iron deficiency anemia. Take iron supplements with Vitamin C." },
        { parameter: "WBC Count", value: "7200", unit: "/μL", referenceRange: "4000–11000", status: "Normal", explanation: "White blood cell count is normal. No signs of infection." },
        { parameter: "Platelet Count", value: "245000", unit: "/μL", referenceRange: "150000–450000", status: "Normal", explanation: "Platelet count is within the normal range." },
        { parameter: "MCV", value: "78", unit: "fL", referenceRange: "80–100", status: "Low", explanation: "Low MCV confirms microcytic anemia, consistent with iron deficiency." },
      ],
      createdAt: new Date("2026-11-15").toISOString(),
    },
    {
      id: "REC-002-LIPID",
      patientId: patientId,
      name: "Lipid Profile",
      type: "Lab Report",
      date: "2026-10-05",
      uploadedBy: "Apollo Diagnostics",
      fileName: "LipidProfile_Oct2026.pdf",
      fileUrl: null,
      fileSizeKb: 189,
      aiSummary: "Lipid profile is excellent. Total cholesterol 185 mg/dL (normal). LDL at 95 mg/dL is well within target. HDL 62 mg/dL is optimal.",
      aiAnalysed: true,
      isEncrypted: true,
      tags: ["Lipid Profile", "Cholesterol", "Heart Health"],
      isDeleted: false,
      biomarkers: [
        { parameter: "Total Cholesterol", value: "185", unit: "mg/dL", referenceRange: "< 200", status: "Normal", explanation: "Total cholesterol is at a healthy level. Continue current diet." },
        { parameter: "LDL Cholesterol", value: "95", unit: "mg/dL", referenceRange: "< 100", status: "Normal", explanation: "LDL is within optimal range, reducing cardiovascular risk." },
        { parameter: "HDL Cholesterol", value: "62", unit: "mg/dL", referenceRange: "> 50", status: "Normal", explanation: "Good HDL level provides cardiovascular protection." },
        { parameter: "Triglycerides", value: "128", unit: "mg/dL", referenceRange: "< 150", status: "Normal", explanation: "Triglycerides are within normal range." },
      ],
      createdAt: new Date("2026-10-05").toISOString(),
    }
  );

  // ── Demo Medications ───────────────────────────────────────────────────────
  db.medications.push(
    {
      id: "MED-001",
      patientId: patientId,
      name: "Ferrous Sulphate",
      dosage: "200mg",
      frequency: "Once daily after dinner",
      startDate: "2026-11-16",
      endDate: "2027-02-16",
      prescribedBy: "Dr. Priya Sharma",
      times: ["8:00 PM"],
      stock: 45,
      instructions: "Take with Vitamin C (lemon juice or orange) for better absorption. Avoid tea/coffee within 1 hour.",
      isActive: true,
    },
    {
      id: "MED-002",
      patientId: patientId,
      name: "Montelukast",
      dosage: "10mg",
      frequency: "Once daily at bedtime",
      startDate: "2026-10-01",
      endDate: null,
      prescribedBy: "Dr. Meera Nair",
      times: ["10:00 PM"],
      stock: 8,
      instructions: "Take at bedtime. Do not stop without consulting your doctor.",
      isActive: true,
    },
    {
      id: "MED-003",
      patientId: patientId,
      name: "Vitamin D3",
      dosage: "60000 IU",
      frequency: "Once weekly",
      startDate: "2026-11-01",
      endDate: "2027-02-01",
      prescribedBy: "Dr. Priya Sharma",
      times: ["Sunday 9:00 AM"],
      stock: 10,
      instructions: "Take with a fatty meal for better absorption.",
      isActive: true,
    }
  );

  // ── Demo Lab Orders ────────────────────────────────────────────────────────
  db.labBookings.push({
    id: "LAB-001",
    patientId: patientId,
    packageId: "pkg-cbc",
    packageName: "Complete Blood Count (CBC)",
    sampleType: "Blood",
    date: "2026-11-15",
    timeSlot: "7:00 AM - 9:00 AM",
    address: "Flat 402, Green Glen Layout, Bellandur, Bangalore 560103",
    fee: 299,
    status: "Report Ready",
    phlebotomistName: "Ramesh Kumar",
    phlebotomistPhone: "+91 98700 11234",
    createdAt: new Date("2026-11-13").toISOString(),
  });

  console.log("✅ Database seeded with demo data (patient@demo.com / doctor@demo.com, password: demo1234)");
}

// Seed on module load
seedDatabase();

module.exports = { db };
