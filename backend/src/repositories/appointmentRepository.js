/**
 * Appointment Repository
 * Abstracted data access for Appointments (PostgreSQL + In-memory fallback)
 */
const { db, mem, query } = require("../config/database");

function formatAppointmentFromPg(row) {
  if (!row) return null;
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_user_id || row.patient_id,
    doctorName: row.doctor_name,
    doctorSpecialty: row.doctor_specialty,
    doctorImage: row.doctor_image,
    patientName: row.patient_name,
    patientAge: row.patient_age,
    date: row.date ? (typeof row.date === "string" ? row.date.split("T")[0] : row.date.toISOString().split("T")[0]) : null,
    time: row.time,
    mode: row.mode,
    status: row.status,
    fee: parseFloat(row.fee || 0),
    hospital: row.hospital,
    symptoms: row.symptoms,
    clinicalNotes: row.clinical_notes,
    notes: row.clinical_notes,
    createdAt: row.created_at,
  };
}

const appointmentRepository = {
  async findAll() {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT a.*, p.user_id AS patient_user_id
         FROM appointments a
         LEFT JOIN patient_profiles p ON p.id = a.patient_id
         ORDER BY a.date DESC, a.created_at DESC`
      );
      return res.rows.map(formatAppointmentFromPg);
    }
    return mem.appointments;
  },

  async findByPatientId(patientId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT a.*, p.user_id AS patient_user_id
         FROM appointments a
         LEFT JOIN patient_profiles p ON p.id = a.patient_id
         WHERE a.patient_id::text = $1 OR a.patient_id IN (
           SELECT id FROM patient_profiles WHERE user_id = $1
         )
         ORDER BY a.date DESC, a.created_at DESC`,
        [patientId]
      );
      return res.rows.map(formatAppointmentFromPg);
    }
    return mem.appointments.filter(a => a.patientId === patientId);
  },

  async findByDoctorId(doctorId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT a.*, p.user_id AS patient_user_id
         FROM appointments a
         LEFT JOIN patient_profiles p ON p.id = a.patient_id
         WHERE a.doctor_id::text = $1 OR a.doctor_id IN (
           SELECT id FROM doctors WHERE user_id = $1
         )
         ORDER BY a.date DESC, a.created_at DESC`,
        [doctorId]
      );
      return res.rows.map(formatAppointmentFromPg);
    }
    return mem.appointments.filter(a => a.doctorId === doctorId);
  },

  async findById(id) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT a.*, p.user_id AS patient_user_id
         FROM appointments a
         LEFT JOIN patient_profiles p ON p.id = a.patient_id
         WHERE a.id = $1`,
        [id]
      );
      return formatAppointmentFromPg(res.rows[0]);
    }
    return mem.appointments.find(a => a.id === id) || null;
  },

  async create(data, transactionClient = null) {
    const id = data.id || `APT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    if (db.isPostgres()) {
      const runQuery = transactionClient
        ? transactionClient.query.bind(transactionClient)
        : query;
      const patientResult = await runQuery(
        `SELECT id FROM patient_profiles WHERE user_id = $1 OR id::text = $1 LIMIT 1`,
        [data.patientId]
      );
      if (!patientResult.rows[0]) {
        throw new Error("Patient profile not found for appointment.");
      }

      const res = await runQuery(
        `INSERT INTO appointments (
           id, doctor_id, patient_id, doctor_name, doctor_specialty, doctor_image,
           patient_name, patient_age, date, time, mode, status, fee, hospital,
           symptoms, clinical_notes, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
         ) RETURNING *`,
        [
          id,
          data.doctorId,
          patientResult.rows[0].id,
          data.doctorName || "Specialist Doctor",
          data.doctorSpecialty || "General Medicine",
          data.doctorImage || null,
          data.patientName || "Patient",
          data.patientAge || null,
          data.date,
          data.time,
          data.mode || "video",
          data.status || "upcoming",
          data.fee || 1000,
          data.hospital || null,
          data.symptoms || null,
          data.clinicalNotes || data.notes || null,
          now
        ]
      );
      return formatAppointmentFromPg({ ...res.rows[0], patient_user_id: data.patientId });
    }

    const appt = {
      id,
      patientId: data.patientId,
      doctorId: data.doctorId,
      doctorName: data.doctorName || "Specialist Doctor",
      doctorSpecialty: data.doctorSpecialty || "General Medicine",
      doctorImage: data.doctorImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
      patientName: data.patientName || "Patient",
      patientAge: data.patientAge || 28,
      date: data.date,
      time: data.time,
      mode: data.mode || "video",
      status: data.status || "upcoming",
      fee: data.fee || 1000,
      hospital: data.hospital || "",
      symptoms: data.symptoms || null,
      notes: data.clinicalNotes || data.notes || null,
      createdAt: now,
    };
    mem.appointments.unshift(appt);
    return appt;
  },

  async updateStatus(id, status, notes = null) {
    if (db.isPostgres()) {
      const res = await query(
        `UPDATE appointments
         SET status = $1, clinical_notes = COALESCE($2, clinical_notes)
         WHERE id = $3
         RETURNING *`,
        [status, notes, id]
      );
      if (!res.rows[0]) return null;
      const patient = await query("SELECT user_id FROM patient_profiles WHERE id = $1", [res.rows[0].patient_id]);
      return formatAppointmentFromPg({ ...res.rows[0], patient_user_id: patient.rows[0]?.user_id });
    }

    const appt = mem.appointments.find(a => a.id === id);
    if (!appt) return null;
    appt.status = status;
    if (notes) appt.notes = notes;
    return appt;
  }
};

module.exports = appointmentRepository;
