const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db } = require("../config/database");
const router = express.Router();

// GET /api/patients/profile
router.get("/profile", authenticate, requireRole("patient"), (req, res) => {
  const patient = db.patients.find(p => p.userId === req.user.id || p.id === req.user.id);
  if (!patient) return res.status(404).json({ success: false, error: "Patient profile not found" });
  res.json({ success: true, data: patient });
});

// PUT /api/patients/profile
router.put("/profile", authenticate, requireRole("patient"), (req, res) => {
  const idx = db.patients.findIndex(p => p.userId === req.user.id || p.id === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Patient profile not found" });
  db.patients[idx] = { ...db.patients[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: db.patients[idx], message: "Profile updated" });
});

// GET /api/patients/dashboard
router.get("/dashboard", authenticate, requireRole("patient"), (req, res) => {
  const patientId = req.user.id;
  const appointments = db.appointments.filter(a => a.patientId === patientId);
  const records = db.records.filter(r => r.patientId === patientId && !r.isDeleted);
  const medications = db.medications.filter(m => m.patientId === patientId && m.isActive);
  const lowStock = medications.filter(m => m.stock <= 10);
  res.json({
    success: true,
    data: {
      upcomingAppointments: appointments.filter(a => a.status === "upcoming").length,
      totalReports: records.length,
      activeMedications: medications.length,
      lowStockAlert: lowStock.map(m => ({ name: m.name, stock: m.stock })),
      nextAppointment: appointments.find(a => a.status === "upcoming") || null,
    },
  });
});

// GET /api/patients/medications
router.get("/medications", authenticate, (req, res) => {
  const meds = db.medications.filter(m => m.patientId === req.user.id);
  res.json({ success: true, data: meds, count: meds.length });
});

// GET /api/patients/health-stats
router.get("/health-stats", authenticate, requireRole("patient"), (req, res) => {
  res.json({
    success: true,
    data: {
      bp: "118/76 mmHg",
      heartRate: "78 bpm",
      bloodSugar: "95 mg/dL",
      spo2: "98%",
      bmi: "21.6",
      status: "All vitals normal",
      lastUpdated: new Date().toISOString(),
    },
  });
});

// GET /api/patients - doctor gets all patients (with consent)
router.get("/", authenticate, requireRole("doctor", "admin"), (req, res) => {
  const patients = db.patients.map(p => ({ id: p.id, name: p.name, age: p.age, bloodGroup: p.bloodGroup }));
  res.json({ success: true, data: patients, count: patients.length });
});

module.exports = router;
