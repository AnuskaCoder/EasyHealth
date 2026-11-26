/**
 * Patient Controller
 * Uses PatientRepository, RecordRepository, and AppointmentRepository
 */
const patientRepository = require("../repositories/patientRepository");
const recordRepository = require("../repositories/recordRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const { mem: db } = require("../config/database");

/**
 * GET /api/patients/profile
 */
async function getProfile(req, res, next) {
  try {
    const patient = await patientRepository.findByUserId(req.user.id);
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
async function updateProfile(req, res, next) {
  try {
    const allowed = [
      "name", "age", "gender", "dob", "phone", "bloodGroup", "height", "weight",
      "allergies", "chronicConditions", "emergencyContact", "address", "pastSurgeries", "vaccinations"
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await patientRepository.update(req.user.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Patient profile not found", code: 404 });
    }
    return res.json({ success: true, message: "Profile updated", patient: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/health-stats
 */
async function getHealthStats(req, res, next) {
  try {
    const patient = await patientRepository.findByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found", code: 404 });
    }
    const pid = patient.userId || patient.id;
    const records = await recordRepository.findByPatientId(pid);
    const meds = db.medications.filter(m => (m.patientId === pid || m.patientId === req.user.id) && m.isActive);

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
async function getDashboard(req, res, next) {
  try {
    const patient = await patientRepository.findByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found", code: 404 });
    }
    const pid = patient.userId || patient.id;

    const appointments = await appointmentRepository.findByPatientId(pid);
    const records = await recordRepository.findByPatientId(pid);
    const medications = db.medications
      .filter(m => (m.patientId === pid || m.patientId === req.user.id) && m.isActive)
      .slice(0, 5);
    const orders = db.orders
      .filter(o => o.patientId === pid || o.patientId === req.user.id)
      .slice(0, 3);

    return res.json({
      success: true,
      dashboard: {
        patient: { name: patient.name, bloodGroup: patient.bloodGroup, age: patient.age },
        upcomingAppointments: appointments.filter(a => a.status === "upcoming").slice(0, 5),
        recentRecords: records.slice(0, 5),
        activeMedications: medications,
        recentOrders: orders,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getHealthStats, getDashboard };
