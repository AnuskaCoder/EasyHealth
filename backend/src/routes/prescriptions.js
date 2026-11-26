const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db } = require("../config/database");
const router = express.Router();

const prescriptions = [];

// GET /api/prescriptions
router.get("/", authenticate, (req, res) => {
  let rxs = prescriptions;
  if (req.user.role === "patient") rxs = prescriptions.filter(p => p.patientId === req.user.id);
  else if (req.user.role === "doctor") rxs = prescriptions.filter(p => p.doctorId === req.user.id);
  res.json({ success: true, data: rxs, count: rxs.length });
});

// POST /api/prescriptions  (doctor uploads prescription)
router.post("/", authenticate, requireRole("doctor"), (req, res) => {
  const { patientId, appointmentId, diagnosis, medications, notes, vitals, nextFollowUp } = req.body;
  if (!patientId || !diagnosis || !medications?.length) {
    return res.status(422).json({ success: false, error: "patientId, diagnosis, and medications are required" });
  }
  const doctor = db.doctors.find(d => d.userId === req.user.id) || db.doctors[0];
  const rx = {
    id: `RX-${Math.floor(10000 + Math.random() * 90000)}`,
    appointmentId: appointmentId || null,
    patientId,
    doctorId: req.user.id,
    doctorName: req.user.name,
    doctorSpecialty: doctor?.specialty || "",
    date: new Date().toISOString().split("T")[0],
    diagnosis,
    medications,
    notes: notes || null,
    vitals: vitals || null,
    nextFollowUp: nextFollowUp || null,
    createdAt: new Date().toISOString(),
  };
  prescriptions.push(rx);

  // Auto-add medications to patient's medication list
  medications.forEach(med => {
    db.medications.push({
      id: `MED-RX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      patientId,
      name: med.name,
      dosage: med.dosage || "",
      frequency: med.frequency || "",
      startDate: new Date().toISOString().split("T")[0],
      prescribedBy: req.user.name,
      times: ["9:00 AM"],
      stock: 30,
      instructions: `${med.timing || "With food"} — ${med.duration || "As directed"}`,
      isActive: true,
    });
  });

  res.status(201).json({ success: true, data: rx, message: "Prescription created and synced to patient" });
});

// GET /api/prescriptions/:id
router.get("/:id", authenticate, (req, res) => {
  const rx = prescriptions.find(p => p.id === req.params.id);
  if (!rx) return res.status(404).json({ success: false, error: "Prescription not found" });
  res.json({ success: true, data: rx });
});

module.exports = router;
