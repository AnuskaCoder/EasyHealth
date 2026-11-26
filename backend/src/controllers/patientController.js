const { mem: db } = require("../config/database");

/**
 * GET /api/patients/profile
 */
function getProfile(req, res, next) {
  try {
    const patient = db.patients.find(p => p.userId === req.user.id || p.id === req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient profile not found", code: 404 });
    }
    return res.json({ success: true, patient });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/patients/profile
 */
function updateProfile(req, res, next) {
  try {
    const idx = db.patients.findIndex(p => p.userId === req.user.id || p.id === req.user.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Patient profile not found", code: 404 });
    }
    const allowed = ["name", "age", "gender", "dob", "phone", "bloodGroup", "height", "weight",
      "allergies", "chronicConditions", "emergencyContact", "address", "pastSurgeries", "vaccinations"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    db.patients[idx] = { ...db.patients[idx], ...updates, updatedAt: new Date().toISOString() };
    return res.json({ success: true, message: "Profile updated", patient: db.patients[idx] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/health-stats
 */
function getHealthStats(req, res, next) {
  try {
    const patient = db.patients.find(p => p.userId === req.user.id || p.id === req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found", code: 404 });
    }
    const records = db.records.filter(r => r.patientId === (patient.userId || patient.id) && !r.isDeleted);
    const meds = db.medications.filter(m => m.patientId === (patient.userId || patient.id) && m.isActive);

    const bmi = patient.height && patient.weight
      ? parseFloat((patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1))
      : null;

    return res.json({
      success: true,
      stats: {
        bmi,
        bmiCategory: bmi ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese") : null,
        totalRecords: records.length,
        activeMedications: meds.length,
        lowStockMeds: meds.filter(m => m.stock <= 10).length,
        bloodGroup: patient.bloodGroup || "Unknown",
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/dashboard
 */
function getDashboard(req, res, next) {
  try {
    const patient = db.patients.find(p => p.userId === req.user.id || p.id === req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found", code: 404 });
    }
    const pid = patient.userId || patient.id;

    const appointments = db.appointments
      .filter(a => a.patientId === pid)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const medications = db.medications
      .filter(m => m.patientId === pid && m.isActive)
      .slice(0, 5);

    const records = db.records
      .filter(r => r.patientId === pid && !r.isDeleted)
      .slice(0, 5);

    const orders = db.orders
      .filter(o => o.patientId === pid)
      .slice(0, 3);

    return res.json({
      success: true,
      dashboard: {
        patient: { name: patient.name, bloodGroup: patient.bloodGroup, age: patient.age },
        upcomingAppointments: appointments.filter(a => a.status === "upcoming"),
        recentRecords: records,
        activeMedications: medications,
        recentOrders: orders,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getHealthStats, getDashboard };

