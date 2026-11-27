const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db, mem, query } = require("../config/database");
const patientRepository = require("../repositories/patientRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const recordRepository = require("../repositories/recordRepository");

const router = express.Router();

function formatMedication(row) {
  return {
    id: row.id,
    patientId: row.user_id || row.patient_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    startDate: row.start_date,
    prescribedBy: row.prescribed_by,
    times: row.times || [],
    stock: row.stock,
    instructions: row.instructions,
    isActive: row.is_active,
  };
}

router.get("/profile", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const patient = await patientRepository.findByUserId(req.user.id);
    if (!patient) return res.status(404).json({ success: false, error: "Patient profile not found" });
    return res.json({ success: true, data: patient });
  } catch (err) {
    return next(err);
  }
});

router.put("/profile", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const patient = await patientRepository.update(req.user.id, req.body);
    if (!patient) return res.status(404).json({ success: false, error: "Patient profile not found" });
    return res.json({ success: true, data: patient, message: "Profile updated" });
  } catch (err) {
    return next(err);
  }
});

router.get("/dashboard", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    let appointments;
    let records;
    let medications;
    if (db.isPostgres()) {
      appointments = await appointmentRepository.findByPatientId(req.user.id);
      records = await recordRepository.findByPatientId(req.user.id);
      const result = await query(
        `SELECT m.*, p.user_id
         FROM medications m
         JOIN patient_profiles p ON p.id = m.patient_id
         WHERE p.user_id = $1 AND m.is_active = TRUE`,
        [req.user.id]
      );
      medications = result.rows.map(formatMedication);
    } else {
      appointments = mem.appointments.filter(item => item.patientId === req.user.id);
      records = mem.records.filter(item => item.patientId === req.user.id && !item.isDeleted);
      medications = mem.medications.filter(item => item.patientId === req.user.id && item.isActive);
    }

    const lowStock = medications.filter(item => item.stock <= 10);
    return res.json({
      success: true,
      data: {
        upcomingAppointments: appointments.filter(item => item.status === "upcoming").length,
        totalReports: records.length,
        activeMedications: medications.length,
        lowStockAlert: lowStock.map(item => ({ name: item.name, stock: item.stock })),
        nextAppointment: appointments.find(item => item.status === "upcoming") || null,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/medications", authenticate, async (req, res, next) => {
  try {
    let medications;
    if (db.isPostgres()) {
      const result = await query(
        `SELECT m.*, p.user_id
         FROM medications m
         JOIN patient_profiles p ON p.id = m.patient_id
         WHERE p.user_id = $1
         ORDER BY m.start_date DESC`,
        [req.user.id]
      );
      medications = result.rows.map(formatMedication);
    } else {
      medications = mem.medications.filter(item => item.patientId === req.user.id);
    }
    return res.json({ success: true, data: medications, count: medications.length });
  } catch (err) {
    return next(err);
  }
});

router.get("/health-stats", authenticate, requireRole("patient"), (req, res) => {
  res.json({
    success: true,
    data: {
      bp: "118/76 mmHg",
      heartRate: "78 bpm",
      bloodSugar: "95 mg/dL",
      spo2: "98%",
      bmi: "21.6",
      status: "Demo values — not measured patient vitals",
      lastUpdated: new Date().toISOString(),
    },
  });
});

router.get("/", authenticate, requireRole("doctor", "admin"), async (req, res, next) => {
  try {
    const patients = await patientRepository.getAll();
    const data = patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
    }));
    return res.json({ success: true, data, count: data.length });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
