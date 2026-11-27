const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db, mem, query } = require("../config/database");
const appointmentRepository = require("../repositories/appointmentRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");

const router = express.Router();

async function canAccessAppointment(user, appointment) {
  if (!appointment) return false;
  if (user.role === "admin") return true;
  if (user.role === "patient") return appointment.patientId === user.id;
  if (user.role === "doctor") {
    const doctor = await doctorRepository.findByUserId(user.id);
    return appointment.doctorId === user.id || (doctor && appointment.doctorId === doctor.id);
  }
  return false;
}

async function writeAudit(userId, action, resourceId, transactionClient = null) {
  if (db.isPostgres()) {
    const runQuery = transactionClient
      ? transactionClient.query.bind(transactionClient)
      : query;
    await runQuery(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id)
       VALUES ($1, $2, $3, 'appointment', $4)`,
      [`al-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId, action, resourceId]
    );
    return;
  }
  mem.auditLogs.push({
    id: `al-${Date.now()}`,
    userId,
    action,
    resourceType: "appointment",
    resourceId,
    timestamp: new Date().toISOString(),
  });
}

router.get("/", authenticate, async (req, res, next) => {
  try {
    let appointments;
    if (req.user.role === "patient") {
      appointments = await appointmentRepository.findByPatientId(req.user.id);
    } else if (req.user.role === "doctor") {
      const doctor = await doctorRepository.findByUserId(req.user.id);
      appointments = await appointmentRepository.findByDoctorId(doctor?.id || req.user.id);
    } else {
      appointments = await appointmentRepository.findAll();
    }

    if (req.query.status) {
      appointments = appointments.filter(item => item.status === req.query.status);
    }
    return res.json({ success: true, data: appointments, count: appointments.length });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const appointment = await appointmentRepository.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });
    if (!await canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ success: false, error: "You do not have permission to view this appointment" });
    }
    return res.json({ success: true, data: appointment });
  } catch (err) {
    return next(err);
  }
});

router.post("/", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const { doctorId, doctorName, doctorSpecialty, doctorImage, date, time, mode, hospital, fee, symptoms } = req.body;
    if (!doctorId || !date || !time || !mode) {
      return res.status(422).json({ success: false, error: "doctorId, date, time, and mode are required" });
    }

    const existing = await appointmentRepository.findByDoctorId(doctorId);
    const conflict = existing.find(item =>
      item.date === date && item.time === time && item.status !== "cancelled"
    );
    if (conflict) {
      return res.status(409).json({ success: false, error: "This time slot is already booked. Please choose another slot." });
    }

    const patient = await patientRepository.findByUserId(req.user.id);
    const appointmentData = {
      patientId: req.user.id,
      doctorId,
      doctorName: doctorName || "Doctor",
      doctorSpecialty: doctorSpecialty || "",
      doctorImage: doctorImage || "",
      patientName: patient?.name || req.user.name,
      patientAge: patient?.age || null,
      date,
      time,
      mode,
      status: mode === "emergency" ? "ongoing" : "upcoming",
      hospital: hospital || "",
      fee: fee || 0,
      symptoms: symptoms || null,
    };
    const newAppointment = db.isPostgres()
      ? await db.withTransaction(async client => {
        const appointment = await appointmentRepository.create(appointmentData, client);
        await writeAudit(req.user.id, "CREATE_APPOINTMENT", appointment.id, client);
        return appointment;
      })
      : await appointmentRepository.create(appointmentData);
    if (!db.isPostgres()) {
      await writeAudit(req.user.id, "CREATE_APPOINTMENT", newAppointment.id);
    }
    return res.status(201).json({ success: true, data: newAppointment, message: "Appointment booked successfully" });
  } catch (err) {
    if (err.code === "23505" && err.constraint === "idx_appointments_active_slot") {
      return res.status(409).json({ success: false, error: "This time slot is already booked. Please choose another slot." });
    }
    return next(err);
  }
});

router.patch("/:id/status", authenticate, async (req, res, next) => {
  try {
    const appointment = await appointmentRepository.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });
    if (!await canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ success: false, error: "You do not have permission to modify this appointment" });
    }

    const { status, notes, cancellationReason } = req.body;
    const allowedStatuses = ["upcoming", "ongoing", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(422).json({ success: false, error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
    }

    const updated = await appointmentRepository.updateStatus(
      req.params.id,
      status,
      notes || cancellationReason || null
    );
    if (!updated) return res.status(404).json({ success: false, error: "Appointment not found" });
    await writeAudit(req.user.id, `UPDATE_APPOINTMENT_STATUS_${status.toUpperCase()}`, req.params.id);
    return res.json({ success: true, data: updated, message: `Appointment updated to ${status}` });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const appointment = await appointmentRepository.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });
    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ success: false, error: "You can only cancel your own appointments" });
    }
    if (appointment.status === "completed") {
      return res.status(409).json({ success: false, error: "Cannot cancel a completed appointment" });
    }

    const updated = await appointmentRepository.updateStatus(
      req.params.id,
      "cancelled",
      req.body.reason || "Cancelled by patient"
    );
    await writeAudit(req.user.id, "CANCEL_APPOINTMENT", req.params.id);
    return res.json({ success: true, data: updated, message: "Appointment cancelled" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
