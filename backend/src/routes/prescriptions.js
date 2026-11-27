/**
 * Prescriptions Route
 * Uses PrescriptionRepository with persistence
 */
const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const { db, mem } = require("../config/database");

const router = express.Router();

// GET /api/prescriptions
router.get("/", authenticate, async (req, res, next) => {
  try {
    let rxs = [];
    if (req.user.role === "patient") {
      rxs = await prescriptionRepository.findByPatientId(req.user.id);
    } else if (req.user.role === "doctor") {
      const doc = await doctorRepository.findByUserId(req.user.id);
      rxs = doc ? await prescriptionRepository.findByDoctorId(doc.id) : await prescriptionRepository.findByDoctorId(req.user.id);
    } else {
      rxs = await prescriptionRepository.findAll();
    }
    return res.json({ success: true, data: rxs, count: rxs.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/prescriptions/:id
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const rx = await prescriptionRepository.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({ success: false, error: "Prescription not found" });
    }
    if (req.user.role === "patient") {
      const patient = await patientRepository.findByUserId(req.user.id);
      if (!patient || (rx.patientId !== patient.id && rx.patientId !== req.user.id)) {
        return res.status(403).json({ success: false, error: "You do not have permission to view this prescription" });
      }
    } else if (req.user.role === "doctor") {
      const doctor = await doctorRepository.findByUserId(req.user.id);
      if (!doctor || (rx.doctorId !== doctor.id && rx.doctorId !== req.user.id)) {
        return res.status(403).json({ success: false, error: "You do not have permission to view this prescription" });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You do not have permission to view this prescription" });
    }
    return res.json({ success: true, data: rx });
  } catch (err) {
    next(err);
  }
});

// POST /api/prescriptions (doctor creates/uploads prescription)
router.post("/", authenticate, requireRole("doctor"), async (req, res, next) => {
  try {
    const { patientId, patientName, appointmentId, diagnosis, medications, notes, vitals, followUpDate } = req.body;
    if (!patientId || !diagnosis || !Array.isArray(medications) || medications.length === 0 ||
      medications.some(med => !med || typeof med.name !== "string" || !med.name.trim())) {
      return res.status(422).json({ success: false, error: "patientId, diagnosis, and medications are required" });
    }

    const doctor = await doctorRepository.findByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, error: "Doctor profile not found" });
    const patient = db.isPostgres() ? await patientRepository.findByUserId(patientId) : null;
    if (db.isPostgres() && !patient) {
      return res.status(404).json({ success: false, error: "Patient profile not found" });
    }

    const prescriptionData = {
      appointmentId: appointmentId || null,
      patientId,
      patientName: patientName || "Patient",
      doctorId: doctor.id,
      doctorName: req.user.name,
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      medications,
      notes: notes || null,
      vitals: vitals || {},
      followUpDate: followUpDate || null,
    };

    // Also track in patient active medications
    if (db.isPostgres()) {
      const rx = await db.withTransaction(async client => {
        const createdPrescription = await prescriptionRepository.create(prescriptionData, client);
        for (const med of medications) {
          await client.query(
            `INSERT INTO medications
              (id, patient_id, name, dosage, frequency, start_date, prescribed_by,
               times, stock, instructions, is_active)
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, 30, $8, TRUE)`,
            [
              `MED-RX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              patient.id,
              med.name,
              med.dosage || "",
              med.frequency || "",
              req.user.name,
              ["9:00 AM"],
              med.instructions || "Take as directed",
            ]
          );
        }
        return createdPrescription;
      });
      return res.status(201).json({ success: true, message: "Prescription issued successfully", data: rx });
    }

    medications.forEach(med => {
      mem.medications.push({
        id: `MED-RX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patientId,
        name: med.name,
        dosage: med.dosage || "",
        frequency: med.frequency || "",
        startDate: new Date().toISOString().split("T")[0],
        prescribedBy: req.user.name,
        times: ["9:00 AM"],
        stock: 30,
        instructions: med.instructions || "Take as directed",
        isActive: true,
      });
    });

    const rx = await prescriptionRepository.create(prescriptionData);
    return res.status(201).json({ success: true, message: "Prescription issued successfully", data: rx });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
