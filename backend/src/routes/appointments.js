const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db } = require("../config/database");
const router = express.Router();

// GET /api/appointments
router.get("/", authenticate, (req, res) => {
  let appts;
  if (req.user.role === "patient") {
    appts = db.appointments.filter(a => a.patientId === req.user.id);
  } else if (req.user.role === "doctor") {
    appts = db.appointments.filter(a => a.doctorId === req.user.id || a.doctorId === "d1");
  } else {
    appts = db.appointments;
  }
  const { status } = req.query;
  if (status) appts = appts.filter(a => a.status === status);
  res.json({ success: true, data: appts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), count: appts.length });
});

// GET /api/appointments/:id
router.get("/:id", authenticate, (req, res) => {
  const appt = db.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ success: false, error: "Appointment not found" });
  res.json({ success: true, data: appt });
});

// POST /api/appointments
router.post("/", authenticate, (req, res) => {
  const { doctorId, doctorName, doctorSpecialty, doctorImage, date, time, mode, hospital, fee, symptoms } = req.body;
  if (!doctorId || !date || !time || !mode) {
    return res.status(422).json({ success: false, error: "doctorId, date, time, and mode are required" });
  }
  // Double-booking check
  const conflict = db.appointments.find(a =>
    a.doctorId === doctorId && a.date === date && a.time === time && a.status !== "cancelled"
  );
  if (conflict) {
    return res.status(409).json({ success: false, error: "This time slot is already booked. Please choose another slot." });
  }
  const patient = db.patients.find(p => p.userId === req.user.id || p.id === req.user.id);
  const newAppt = {
    id: `APT-${Math.floor(100000 + Math.random() * 900000)}`,
    patientId: req.user.id,
    doctorId,
    doctorName: doctorName || "Doctor",
    doctorSpecialty: doctorSpecialty || "",
    doctorImage: doctorImage || "",
    patientName: patient?.name || req.user.name,
    patientAge: patient?.age || null,
    date, time, mode,
    status: mode === "emergency" ? "ongoing" : "upcoming",
    hospital: hospital || "",
    fee: fee || 0,
    symptoms: symptoms || null,
    notes: null,
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(newAppt);
  res.status(201).json({ success: true, data: newAppt, message: "Appointment booked successfully" });
});

// PATCH /api/appointments/:id/status
router.patch("/:id/status", authenticate, (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Appointment not found" });
  const { status, notes, cancellationReason } = req.body;
  db.appointments[idx].status = status;
  if (notes) db.appointments[idx].notes = notes;
  if (cancellationReason) db.appointments[idx].cancellationReason = cancellationReason;
  db.appointments[idx].updatedAt = new Date().toISOString();
  res.json({ success: true, data: db.appointments[idx], message: `Appointment ${status}` });
});

// DELETE /api/appointments/:id  (cancel)
router.delete("/:id", authenticate, (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Appointment not found" });
  db.appointments[idx].status = "cancelled";
  db.appointments[idx].cancellationReason = req.body.reason || "Cancelled by user";
  res.json({ success: true, message: "Appointment cancelled" });
});

module.exports = router;
