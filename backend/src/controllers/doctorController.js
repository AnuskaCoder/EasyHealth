/**
 * Doctor Controller
 * Uses DoctorRepository
 */
const doctorRepository = require("../repositories/doctorRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const { mem: db } = require("../config/database");

/**
 * GET /api/doctors
 */
async function getAll(req, res, next) {
  try {
    const { specialty, available } = req.query;
    const filterSpec = (specialty && specialty !== "All") ? specialty : undefined;
    const filterAvail = available === "true" ? true : undefined;

    const doctors = await doctorRepository.getAll({
      specialty: filterSpec,
      availableToday: filterAvail,
    });

    return res.json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/:id
 */
async function getById(req, res, next) {
  try {
    const doctor = await doctorRepository.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found", code: 404 });
    }
    return res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/profile (auth required — doctor only)
 */
async function getProfile(req, res, next) {
  try {
    const doctor = await doctorRepository.findByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found", code: 404 });
    }
    return res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/doctors/availability (auth required)
 */
async function updateAvailability(req, res, next) {
  try {
    const doctor = await doctorRepository.findByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found", code: 404 });
    }
    const { availableToday, nextSlot } = req.body;
    if (availableToday !== undefined) doctor.availableToday = Boolean(availableToday);
    if (nextSlot) doctor.nextSlot = nextSlot;

    return res.json({ success: true, message: "Availability updated", doctor });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/patients (doctor only)
 */
async function getMyPatients(req, res, next) {
  try {
    const doctor = await doctorRepository.findByUserId(req.user.id);
    const doctorId = doctor ? doctor.id : req.user.id;

    const appointments = await appointmentRepository.findByDoctorId(doctorId);
    const patientIds = [...new Set(appointments.map(a => a.patientId))];

    const patients = patientIds.map(pid => {
      const p = db.patients.find(x => x.userId === pid || x.id === pid);
      const lastAppt = appointments.find(a => a.patientId === pid);
      return {
        id: pid,
        name: p?.name || lastAppt?.patientName || "Patient",
        age: p?.age || lastAppt?.patientAge || 28,
        gender: p?.gender || "Female",
        bloodGroup: p?.bloodGroup || "B+",
        lastVisit: lastAppt?.date || null,
        conditions: p?.chronicConditions || [],
      };
    });

    return res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/stats (doctor dashboard metrics)
 */
async function getStats(req, res, next) {
  try {
    const doctor = await doctorRepository.findByUserId(req.user.id);
    const doctorId = doctor ? doctor.id : req.user.id;

    const appointments = await appointmentRepository.findByDoctorId(doctorId);
    const today = new Date().toISOString().split("T")[0];

    const todayAppts = appointments.filter(a => a.date === today);
    const completed = appointments.filter(a => a.status === "completed");
    const uniquePatients = new Set(appointments.map(a => a.patientId)).size;
    const totalEarnings = completed.reduce((sum, a) => sum + (a.fee || 1000), 0);

    return res.json({
      success: true,
      stats: {
        todayAppointments: todayAppts.length,
        totalAppointments: appointments.length,
        completedAppointments: completed.length,
        totalPatients: uniquePatients,
        totalEarnings,
        rating: doctor?.rating || 4.9,
        reviewsCount: doctor?.reviewCount || 120,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, getProfile, updateAvailability, getMyPatients, getStats };
