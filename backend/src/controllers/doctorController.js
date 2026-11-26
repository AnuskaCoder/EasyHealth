const { db } = require("../config/database");

/**
 * GET /api/doctors
 */
function getAll(req, res, next) {
  try {
    const { specialty, available } = req.query;
    let results = [...db.doctors];

    if (specialty && specialty !== "All") {
      results = results.filter(d => d.specialty && d.specialty.toLowerCase() === specialty.toLowerCase());
    }
    if (available === "true") {
      results = results.filter(d => d.availableToday);
    }

    return res.json({ success: true, count: results.length, doctors: results });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/:id
 */
function getById(req, res, next) {
  try {
    const doctor = db.doctors.find(d => d.id === req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found", code: 404 });
    }
    return res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/profile  (auth required — doctor only)
 */
function getProfile(req, res, next) {
  try {
    const doctor = db.doctors.find(d => d.userId === req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found", code: 404 });
    }
    return res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/doctors/availability  (auth required)
 */
function updateAvailability(req, res, next) {
  try {
    const idx = db.doctors.findIndex(d => d.userId === req.user.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Doctor not found", code: 404 });
    }
    const { availableToday, isOnline, nextSlot } = req.body;
    if (availableToday !== undefined) db.doctors[idx].availableToday = availableToday;
    if (isOnline !== undefined) db.doctors[idx].isOnline = isOnline;
    if (nextSlot !== undefined) db.doctors[idx].nextSlot = nextSlot;
    return res.json({ success: true, message: "Availability updated", doctor: db.doctors[idx] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/patients  (auth required — doctor only)
 */
function getPatients(req, res, next) {
  try {
    const doctor = db.doctors.find(d => d.userId === req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found", code: 404 });
    }
    // Get unique patients from appointments with this doctor
    const appts = db.appointments.filter(a => a.doctorId === doctor.id);
    const patientIds = [...new Set(appts.map(a => a.patientId))];
    const patients = db.patients.filter(p => patientIds.includes(p.userId || p.id));
    return res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctors/analytics  (auth required — doctor only)
 */
function getAnalytics(req, res, next) {
  try {
    const doctor = db.doctors.find(d => d.userId === req.user.id);
    const doctorId = doctor ? doctor.id : "d1";

    const allAppts = db.appointments.filter(a => a.doctorId === doctorId);
    const completed = allAppts.filter(a => a.status === "completed");
    const upcoming = allAppts.filter(a => a.status === "upcoming");
    const revenue = completed.reduce((sum, a) => sum + (a.fee || 0), 0);

    return res.json({
      success: true,
      analytics: {
        totalAppointments: allAppts.length,
        completedAppointments: completed.length,
        upcomingAppointments: upcoming.length,
        monthlyConsultations: 148,
        netRevenue: revenue || 184000,
        satisfactionRating: doctor ? doctor.rating : 4.9,
        avgWaitTimeMinutes: 6.5,
        diseasePrevalence: [
          { disease: "Essential Hypertension", percentage: 32 },
          { disease: "Coronary Artery Disease", percentage: 26 },
          { disease: "Arrhythmia & Palpitations", percentage: 18 },
          { disease: "Nutritional Anemia & Fatigue", percentage: 14 },
          { disease: "Congestive Heart Failure", percentage: 10 },
        ],
        modalitySplit: { telehealthVideo: 46, hospitalInPerson: 38, emergencyTriage: 16 },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, getProfile, updateAvailability, getPatients, getAnalytics };
