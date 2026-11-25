const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

let prescriptionsDb = [
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

/**
 * GET /api/prescriptions
 */
router.get("/", (req, res) => {
  const { patientId, doctorId } = req.query;
  let list = [...prescriptionsDb];
  if (patientId) list = list.filter((p) => p.patientId === patientId);
  if (doctorId) list = list.filter((p) => p.doctorId === doctorId);
  res.json({ count: list.length, prescriptions: list });
});

/**
 * POST /api/prescriptions
 * Doctor issues & signs digital prescription
 */
router.post("/", (req, res) => {
  const { appointmentId, patientName, diagnosis, vitals, medications, notes, nextFollowUp } = req.body;

  const newRx = {
    id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
    appointmentId: appointmentId || "APT-GEN",
    patientId: "p1",
    patientName: patientName || "Ananya Krishnan",
    doctorId: "d1",
    doctorName: "Dr. Priya Sharma",
    doctorSpecialty: "Cardiologist",
    date: new Date().toISOString().split("T")[0],
    diagnosis: diagnosis || "Clinical consultation",
    vitals: vitals || { bp: "120/80", pulse: "72 bpm" },
    medications: medications || [],
    notes: notes || "Take medications as advised.",
    nextFollowUp: nextFollowUp || "In 4 weeks",
    signedAt: new Date().toISOString(),
  };

  prescriptionsDb.unshift(newRx);
  res.status(201).json({ message: "Prescription successfully issued and signed", prescription: newRx });
});

module.exports = router;
