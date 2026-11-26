/**
 * Appointment Controller
 * Uses AppointmentRepository and DoctorRepository
 */
const appointmentRepository = require("../repositories/appointmentRepository");
const doctorRepository = require("../repositories/doctorRepository");

function generateApptId() {
  return `APT-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * POST /api/appointments
 */
async function create(req, res, next) {
  try {
    const { doctorId, doctorName, doctorSpecialty, doctorImage, date, time, mode, fee, symptoms, hospital, patientAge } = req.body;

    const patientAppts = await appointmentRepository.findByPatientId(req.user.id);
    const conflict = patientAppts.find(
      a => a.date === date && a.time === time && a.status === "upcoming"
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `You already have an appointment scheduled on ${date} at ${time}`,
        code: 409,
      });
    }

    const doctor = doctorId ? await doctorRepository.findById(doctorId) : null;

    const newAppt = await appointmentRepository.create({
      id: generateApptId(),
      patientId: req.user.id,
      doctorId: doctorId || "d1",
      doctorName: doctorName || doctor?.name || "Specialist Doctor",
      doctorSpecialty: doctorSpecialty || doctor?.specialty || "General Medicine",
      doctorImage: doctorImage || doctor?.image || null,
      patientName: req.user.name || "Patient",
      patientAge: patientAge || 28,
      date: date || new Date().toISOString().split("T")[0],
      time: time || "10:00 AM",
      mode: mode || "video",
      status: "upcoming",
      fee: fee || doctor?.consultFee || 1000,
      symptoms: symptoms || "",
    });

    return res.status(201).json({ success: true, message: "Appointment confirmed", appointment: newAppt });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/appointments
 */
async function getAll(req, res, next) {
  try {
    const { status } = req.query;
    let list = [];

    if (req.user.role === "doctor") {
      const doc = await doctorRepository.findByUserId(req.user.id);
      list = doc ? await appointmentRepository.findByDoctorId(doc.id) : [];
    } else {
      list = await appointmentRepository.findByPatientId(req.user.id);
    }

    if (status) list = list.filter(a => a.status === status);

    return res.json({ success: true, count: list.length, appointments: list });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/appointments/:id
 */
async function getById(req, res, next) {
  try {
    const appt = await appointmentRepository.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }
    return res.json({ success: true, appointment: appt });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/appointments/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const { status, notes } = req.body;
    const validStatuses = ["upcoming", "ongoing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        code: 422
      });
    }

    const updated = await appointmentRepository.updateStatus(req.params.id, status, notes);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }
    return res.json({ success: true, message: `Appointment updated to ${status}`, appointment: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/appointments/:id  (cancel)
 */
async function cancel(req, res, next) {
  try {
    const updated = await appointmentRepository.updateStatus(req.params.id, "cancelled", req.body.reason || "Cancelled by user");
    if (!updated) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }
    return res.json({ success: true, message: "Appointment cancelled", appointment: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/appointments/:id/reschedule
 */
async function reschedule(req, res, next) {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(422).json({ success: false, error: "Date and time are required for rescheduling", code: 422 });
    }

    const appt = await appointmentRepository.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }

    appt.date = date;
    appt.time = time;
    appt.status = "upcoming";
    return res.json({ success: true, message: "Appointment rescheduled", appointment: appt });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getById, updateStatus, cancel, reschedule };
