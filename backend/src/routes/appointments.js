const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { mem } = require("../config/database");
const router = express.Router();

// ── Ownership check helper ────────────────────────────────────────────────────
function canAccessAppointment(user, appt) {
  if (!appt) return false;
  if (user.role === "admin") return true;
  if (user.role === "patient") return appt.patientId === user.id;
  if (user.role === "doctor") {
    // Doctor can see their own appointments (match by userId or doctor catalog id)
    const doctorRecord = mem.doctors.find(d => d.userId === user.id);
    return appt.doctorId === user.id || (doctorRecord && appt.doctorId === doctorRecord.id);
  }
  return false;
}

// GET /api/appointments
router.get("/", authenticate, (req, res) => {
  let appts;
  if (req.user.role === "patient") {
    appts = mem.appointments.filter(a => a.patientId === req.user.id);
  } else if (req.user.role === "doctor") {
    const doctorRecord = mem.doctors.find(d => d.userId === req.user.id);
    const doctorId = doctorRecord?.id || req.user.id;
    appts = mem.appointments.filter(a => a.doctorId === doctorId);
  } else {
    appts = mem.appointments; // admin
  }
  if (req.query.status) appts = appts.filter(a => a.status === req.query.status);
  res.json({ success: true, data: appts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), count: appts.length });
});

// GET /api/appointments/:id — ownership enforced
router.get("/:id", authenticate, (req, res) => {
  const appt = mem.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ success: false, error: "Appointment not found" });
  if (!canAccessAppointment(req.user, appt)) {
    return res.status(403).json({ success: false, error: "You do not have permission to view this appointment" });
  }
  res.json({ success: true, data: appt });
});

// POST /api/appointments — patient only
router.post("/", authenticate, requireRole("patient"), (req, res) => {
  const { doctorId, doctorName, doctorSpecialty, doctorImage, date, time, mode, hospital, fee, symptoms } = req.body;
  if (!doctorId || !date || !time || !mode) {
    return res.status(422).json({ success: false, error: "doctorId, date, time, and mode are required" });
  }
  // Double-booking check
  const conflict = mem.appointments.find(a =>
    a.doctorId === doctorId && a.date === date && a.time === time && a.status !== "cancelled"
  );
  if (conflict) {
    return res.status(409).json({ success: false, error: "This time slot is already booked. Please choose another slot." });
  }
  const patient = mem.patients.find(p => p.userId === req.user.id || p.id === req.user.id);
  const newAppt = {
    id: `APT-${Math.floor(100000 + Math.random() * 900000)}`,
    patientId: req.user.id,
    doctorId, doctorName: doctorName || "Doctor",
    doctorSpecialty: doctorSpecialty || "",
    doctorImage: doctorImage || "",
    patientName: patient?.name || req.user.name,
    patientAge: patient?.age || null,
    date, time, mode,
    status: mode === "emergency" ? "ongoing" : "upcoming",
    hospital: hospital || "", fee: fee || 0,
    symptoms: symptoms || null, notes: null,
    createdAt: new Date().toISOString(),
  };
  mem.appointments.push(newAppt);

  // Audit log
  mem.auditLogs.push({ id: `al-${Date.now()}`, userId: req.user.id, action: "CREATE_APPOINTMENT", resourceType: "appointment", resourceId: newAppt.id, timestamp: new Date().toISOString() });

  res.status(201).json({ success: true, data: newAppt, message: "Appointment booked successfully" });
});

// PATCH /api/appointments/:id/status — ownership enforced
router.patch("/:id/status", authenticate, (req, res) => {
  const idx = mem.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Appointment not found" });
  if (!canAccessAppointment(req.user, mem.appointments[idx])) {
    return res.status(403).json({ success: false, error: "You do not have permission to modify this appointment" });
  }
  const { status, notes, cancellationReason } = req.body;
  const allowedStatuses = ["upcoming", "ongoing", "completed", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(422).json({ success: false, error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
  }
  mem.appointments[idx] = { ...mem.appointments[idx], status, notes: notes || mem.appointments[idx].notes, cancellationReason: cancellationReason || null, updatedAt: new Date().toISOString() };

  mem.auditLogs.push({ id: `al-${Date.now()}`, userId: req.user.id, action: `UPDATE_APPOINTMENT_STATUS_${status.toUpperCase()}`, resourceType: "appointment", resourceId: req.params.id, timestamp: new Date().toISOString() });

  res.json({ success: true, data: mem.appointments[idx], message: `Appointment updated to ${status}` });
});

// DELETE /api/appointments/:id — only appointment owner can cancel
router.delete("/:id", authenticate, requireRole("patient"), (req, res) => {
  const idx = mem.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Appointment not found" });
  if (mem.appointments[idx].patientId !== req.user.id) {
    return res.status(403).json({ success: false, error: "You can only cancel your own appointments" });
  }
  if (mem.appointments[idx].status === "completed") {
    return res.status(409).json({ success: false, error: "Cannot cancel a completed appointment" });
  }
  mem.appointments[idx].status = "cancelled";
  mem.appointments[idx].cancellationReason = req.body.reason || "Cancelled by patient";
  mem.appointments[idx].updatedAt = new Date().toISOString();
  res.json({ success: true, message: "Appointment cancelled" });
});

module.exports = router;
