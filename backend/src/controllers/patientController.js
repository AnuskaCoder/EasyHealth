/**
 * Patient Controller
 * Uses PatientRepository, RecordRepository, and AppointmentRepository
 */
const patientRepository = require("../repositories/patientRepository");
const recordRepository = require("../repositories/recordRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const { db: databaseDb, mem, query } = require("../config/database");

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
    let meds;
    if (databaseDb.isPostgres()) {
      const { rows } = await query(
        `SELECT * FROM medications WHERE patient_id = $1 AND is_active = TRUE`,
        [pid]
      );
      meds = rows.map(row => ({
        id: row.id,
        patientId: row.user_id || row.patient_id,
        name: row.name,
        dosage: row.dosage,
        frequency: row.frequency,
        startDate: row.start_date,
        prescribedBy: row.prescribed_by,
        times: row.times || [],
        stock: row.stock,
        instructions: row.instructions,
        isActive: row.is_active,
      }));
    } else {
      meds = mem.medications.filter(m => (m.patientId === pid || m.patientId === req.user.id) && m.isActive);
    }

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
    let medications;
    let orders;
    if (databaseDb.isPostgres()) {
      const medResult = await query(
        `SELECT * FROM medications WHERE patient_id = $1 AND is_active = TRUE ORDER BY start_date DESC LIMIT 5`,
        [pid]
      );
      medications = medResult.rows.map(row => ({
        id: row.id,
        patientId: row.user_id || row.patient_id,
        name: row.name,
        dosage: row.dosage,
        frequency: row.frequency,
        startDate: row.start_date,
        prescribedBy: row.prescribed_by,
        times: row.times || [],
        stock: row.stock,
        instructions: row.instructions,
        isActive: row.is_active,
      }));
      const orderResult = await query(
        `SELECT o.*, p.user_id AS patient_user_id
         FROM pharmacy_orders o
         JOIN patient_profiles p ON p.id = o.patient_id
         WHERE p.user_id = $1
         ORDER BY o.created_at DESC LIMIT 3`,
        [req.user.id]
      );
      orders = orderResult.rows.map(row => ({
        id: row.id,
        patientId: row.patient_user_id,
        items: row.items_json,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        total: Number(row.total),
        address: row.delivery_address,
        couponApplied: row.coupon_applied,
        status: row.status,
        createdAt: row.created_at,
      }));
    } else {
      medications = mem.medications
        .filter(m => (m.patientId === pid || m.patientId === req.user.id) && m.isActive)
        .slice(0, 5);
      orders = mem.orders
        .filter(o => o.patientId === pid || o.patientId === req.user.id)
        .slice(0, 3);
    }

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
