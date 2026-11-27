/**
 * Prescription Repository
 * Abstracted data access for Doctor Prescriptions (PostgreSQL + In-memory fallback)
 */
const { db, mem, query } = require("../config/database");

function formatPrescriptionFromPg(row) {
  if (!row) return null;
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    doctorName: row.doctor_name,
    patientName: row.patient_name,
    date: row.date ? (typeof row.date === "string" ? row.date.split("T")[0] : row.date.toISOString().split("T")[0]) : null,
    diagnosis: row.diagnosis,
    vitals: row.vitals_json,
    medications: row.medications_json || [],
    notes: row.notes,
    followUpDate: row.follow_up_date ? (typeof row.follow_up_date === "string" ? row.follow_up_date.split("T")[0] : row.follow_up_date.toISOString().split("T")[0]) : null,
    createdAt: row.created_at,
  };
}

const prescriptionRepository = {
  async findAll() {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT * FROM doctor_prescriptions ORDER BY date DESC, created_at DESC`
      );
      return res.rows.map(formatPrescriptionFromPg);
    }
    return mem.prescriptions;
  },

  async findByPatientId(patientId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT *
         FROM doctor_prescriptions
         WHERE patient_id::text = $1 OR patient_id IN (
           SELECT id FROM patient_profiles WHERE user_id = $1
         )
         ORDER BY date DESC, created_at DESC`,
        [patientId]
      );
      return res.rows.map(formatPrescriptionFromPg);
    }
    return mem.prescriptions.filter(p => p.patientId === patientId);
  },

  async findByDoctorId(doctorId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT *
         FROM doctor_prescriptions
         WHERE doctor_id::text = $1 OR doctor_id IN (
           SELECT id FROM doctors WHERE user_id = $1
         )
         ORDER BY date DESC, created_at DESC`,
        [doctorId]
      );
      return res.rows.map(formatPrescriptionFromPg);
    }
    return mem.prescriptions.filter(p => p.doctorId === doctorId);
  },

  async findById(id) {
    if (db.isPostgres()) {
      const res = await query(`SELECT * FROM doctor_prescriptions WHERE id = $1`, [id]);
      return formatPrescriptionFromPg(res.rows[0]);
    }
    return mem.prescriptions.find(p => p.id === id) || null;
  },

  async create(data, transactionClient = null) {
    const id = data.id || `RX-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    if (db.isPostgres()) {
      const runQuery = transactionClient
        ? transactionClient.query.bind(transactionClient)
        : query;
      const patientResult = await runQuery(
        `SELECT id FROM patient_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
        [data.patientId]
      );
      const doctorResult = await runQuery(
        `SELECT id FROM doctors WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [data.doctorId]
      );
      if (!patientResult.rows[0] || !doctorResult.rows[0]) {
        throw new Error("Patient or doctor profile not found for prescription.");
      }

      const res = await runQuery(
        `INSERT INTO doctor_prescriptions (
           id, appointment_id, doctor_id, patient_id, doctor_name,
           patient_name, date, diagnosis, vitals_json, medications_json,
           notes, follow_up_date, created_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10,
           $11, $12, $13
         ) RETURNING *`,
        [
          id,
          data.appointmentId || null,
          doctorResult.rows[0].id,
          patientResult.rows[0].id,
          data.doctorName || "Specialist",
          data.patientName || "Patient",
          data.date || now.split("T")[0],
          data.diagnosis || "Clinical assessment",
          JSON.stringify(data.vitals || {}),
          JSON.stringify(data.medications || []),
          data.notes || null,
          data.followUpDate || null,
          now
        ]
      );
      return formatPrescriptionFromPg(res.rows[0]);
    }

    const rx = {
      id,
      appointmentId: data.appointmentId || null,
      doctorId: data.doctorId,
      patientId: data.patientId,
      doctorName: data.doctorName || "Specialist",
      patientName: data.patientName || "Patient",
      date: data.date || now.split("T")[0],
      diagnosis: data.diagnosis || "Clinical assessment",
      vitals: data.vitals || {},
      medications: data.medications || [],
      notes: data.notes || null,
      followUpDate: data.followUpDate || null,
      createdAt: now,
    };
    mem.prescriptions.unshift(rx);
    return rx;
  }
};

module.exports = prescriptionRepository;
