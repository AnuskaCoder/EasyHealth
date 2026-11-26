const { db } = require("../config/database");

function generateApptId() {
  return `APT-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * POST /api/appointments
 */
function create(req, res, next) {
  try {
    const { doctorId, doctorName, doctorSpecialty, doctorImage, date, time, mode, fee, symptoms, hospital, patientAge } = req.body;

    // Check for double-booking
    const conflict = db.appointments.find(
      a => a.patientId === req.user.id && a.date === date && a.time === time && a.status === "upcoming"
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `You already have an appointment scheduled on ${date} at ${time}`,
        code: 409,
      });
    }

    const doctor = db.doctors.find(d => d.id === doctorId);
    const user = db.users ? db.users.find(u => u.id === req.user.id) : null;

    const newAppt = {
      id: generateApptId(),
      patientId: req.user.id,
      doctorId: doctorId || "d1",
      doctorName: doctorName || (doctor && doctor.name) || "Unknown Doctor",
      doctorSpecialty: doctorSpecialty || (doctor && doctor.specialty) || "General Physician",
      doctorImage: doctorImage || (doctor && doctor.imageUrl) || null,
      patientName: req.user.name,
      patientAge: patientAge || null,
      date: date || new Date().toISOString().split("T")[0],
      time: time || "10:00 AM",
      mode: mode || "video",
      status: "upcoming",
      hospital: hospital || (doctor && doctor.hospital) || "Apollo Hospitals",
      fee: fee || (doctor && doctor.consultFee) || 1000,
      symptoms: symptoms || "",
      createdAt: new Date().toISOString(),
    };

    db.appointments.unshift(newAppt);
    return res.status(201).json({ success: true, message: "Appointment confirmed", appointment: newAppt });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/appointments
 */
function getAll(req, res, next) {
  try {
    const { status } = req.query;
    let list = db.appointments.filter(a => {
      if (req.user.role === "doctor") {
        const doc = db.doctors.find(d => d.userId === req.user.id);
        return doc ? a.doctorId === doc.id : false;
      }
      return a.patientId === req.user.id;
    });

    if (status) list = list.filter(a => a.status === status);
    list = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, count: list.length, appointments: list });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/appointments/:id
 */
function getById(req, res, next) {
  try {
    const appt = db.appointments.find(a => a.id === req.params.id);
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
function updateStatus(req, res, next) {
  try {
    const idx = db.appointments.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }
    const { status } = req.body;
    const validStatuses = ["upcoming", "ongoing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`, code: 422 });
    }
    db.appointments[idx].status = status;
    db.appointments[idx].updatedAt = new Date().toISOString();
    return res.json({ success: true, message: `Appointment updated to ${status}`, appointment: db.appointments[idx] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/appointments/:id  (cancel)
 */
function cancel(req, res, next) {
  try {
    const idx = db.appointments.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }
    db.appointments[idx].status = "cancelled";
    db.appointments[idx].cancellationReason = req.body.reason || "Cancelled by user";
    db.appointments[idx].updatedAt = new Date().toISOString();
    return res.json({ success: true, message: "Appointment cancelled", appointment: db.appointments[idx] });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/appointments/:id/reschedule
 */
function reschedule(req, res, next) {
  try {
    const idx = db.appointments.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(422).json({ success: false, error: "Date and time are required for rescheduling", code: 422 });
    }
    db.appointments[idx].date = date;
    db.appointments[idx].time = time;
    db.appointments[idx].status = "upcoming";
    db.appointments[idx].updatedAt = new Date().toISOString();
    return res.json({ success: true, message: "Appointment rescheduled", appointment: db.appointments[idx] });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getById, updateStatus, cancel, reschedule };
