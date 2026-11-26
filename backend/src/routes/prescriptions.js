/**
 * Prescriptions Route
 * Uses PrescriptionRepository with persistence
 */
const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const doctorRepository = require("../repositories/doctorRepository");
const { mem } = require("../config/database");

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
      rxs = mem.prescriptions;
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
    return res.json({ success: true, data: rx });
  } catch (err) {
    next(err);
  }
});

// POST /api/prescriptions (doctor creates/uploads prescription)
router.post("/", authenticate, requireRole("doctor"), async (req, res, next) => {
  try {
    const { patientId, patientName, appointmentId, diagnosis, medications, notes, vitals, followUpDate } = req.body;
    if (!patientId || !diagnosis || !medications?.length) {
      return res.status(422).json({ success: false, error: "patientId, diagnosis, and medications are required" });
    }

    const doctor = await doctorRepository.findByUserId(req.user.id) || await doctorRepository.findById("d1");
    const rx = await prescriptionRepository.create({
      appointmentId: appointmentId || null,
      patientId,
      patientName: patientName || "Patient",
      doctorId: doctor?.id || req.user.id,
      doctorName: req.user.name,
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      medications,
      notes: notes || null,
      vitals: vitals || {},
      followUpDate: followUpDate || null,
    });

    // Also track in patient active medications
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

    return res.status(201).json({ success: true, message: "Prescription issued successfully", data: rx });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
