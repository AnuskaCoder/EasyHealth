/**
 * Medical Record Repository
 * Abstracted data access for Medical Reports & Biomarkers (PostgreSQL + In-memory fallback)
 */
const { v4: uuidv4 } = require("uuid");
const { db, mem, query } = require("../config/database");

function formatRecordFromPg(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.title,
    title: row.title,
    type: row.report_type,
    date: row.report_date ? (typeof row.report_date === "string" ? row.report_date.split("T")[0] : row.report_date.toISOString().split("T")[0]) : null,
    uploadedBy: row.uploaded_by,
    fileUrl: row.file_url,
    aiSummary: row.ai_summary,
    biomarkers: row.biomarkers_json || [],
    tags: row.tags || [],
    fileName: row.file_name,
    ocrConfidence: row.ocr_confidence ? parseFloat(row.ocr_confidence) : null,
    aiAnalysed: row.is_analyzed,
    isDeleted: row.is_deleted,
    isEncrypted: true,
    createdAt: row.created_at,
  };
}

const recordRepository = {
  async findAll() {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT * FROM medical_reports WHERE is_deleted = FALSE ORDER BY report_date DESC, created_at DESC`
      );
      return res.rows.map(formatRecordFromPg);
    }
    return mem.records.filter(r => !r.isDeleted);
  },

  async findByDoctorId(doctorId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT mr.*
         FROM medical_reports mr
         JOIN consent_permissions c ON c.patient_id = mr.patient_id
         WHERE c.doctor_id = $1 AND c.status = 'granted'
           AND (c.expires_at IS NULL OR c.expires_at > CURRENT_TIMESTAMP)
           AND mr.is_deleted = FALSE
         ORDER BY mr.report_date DESC, mr.created_at DESC`,
        [doctorId]
      );
      return res.rows.map(formatRecordFromPg);
    }
    return mem.records.filter(record =>
      mem.consentPermissions.some(consent =>
        (consent.doctorId === doctorId || consent.doctorUserId === doctorId) &&
        consent.patientId === record.patientId && consent.status === "granted"
      ) && !record.isDeleted
    );
  },

  async findByPatientId(patientId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT *
         FROM medical_reports
         WHERE is_deleted = FALSE AND (patient_id::text = $1 OR patient_id IN (
           SELECT id FROM patient_profiles WHERE user_id = $1
         ))
         ORDER BY report_date DESC, created_at DESC`,
        [patientId]
      );
      return res.rows.map(formatRecordFromPg);
    }
    return mem.records.filter(r => (r.patientId === patientId || r.userId === patientId) && !r.isDeleted);
  },

  async findById(id) {
    if (db.isPostgres()) {
      const res = await query(`SELECT * FROM medical_reports WHERE id::text = $1`, [id]);
      return formatRecordFromPg(res.rows[0]);
    }
    return mem.records.find(r => r.id === id && !r.isDeleted) || null;
  },

  async create(data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    if (db.isPostgres()) {
      // Find patient profile UUID if patientId is a user UUID
      const pRes = await query(
        `SELECT id FROM patient_profiles WHERE user_id = $1 OR id::text = $1`,
        [data.patientId]
      );
      const targetPatientId = pRes.rows[0]?.id;
      if (!targetPatientId) throw new Error("Patient profile not found for medical record.");

      const res = await query(
        `INSERT INTO medical_reports (
           id, patient_id, title, report_type, report_date, uploaded_by,
           file_url, file_name, tags, ai_summary, biomarkers_json, ocr_confidence, is_analyzed, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11, $12, $13, $14
         ) RETURNING *`,
        [
          id,
          targetPatientId,
          data.name || data.title || "Medical Report",
          data.type || "General",
          data.date || now.split("T")[0],
          data.uploadedBy || "EasyHealth Diagnostics",
          data.fileUrl || null,
          data.fileName || null,
          data.tags || [],
          data.aiSummary || null,
          JSON.stringify(data.biomarkers || []),
          data.ocrConfidence || null,
          data.aiAnalysed || false,
          now
        ]
      );
      return formatRecordFromPg(res.rows[0]);
    }

    const record = {
      id,
      patientId: data.patientId,
      name: data.name || data.title || "Medical Report",
      type: data.type || "General",
      date: data.date || now.split("T")[0],
      uploadedBy: data.uploadedBy || "EasyHealth Diagnostics",
      fileName: data.fileName || null,
      fileUrl: data.fileUrl || null,
      aiSummary: data.aiSummary || null,
      aiAnalysed: data.aiAnalysed || false,
      isEncrypted: true,
      tags: data.tags || [],
      biomarkers: data.biomarkers || [],
      isDeleted: false,
      createdAt: now,
    };
    mem.records.unshift(record);
    return record;
  },

  async updateAiAnalysis(id, { aiSummary, biomarkers }) {
    if (db.isPostgres()) {
      const res = await query(
        `UPDATE medical_reports
         SET ai_summary = $1, biomarkers_json = $2, is_analyzed = TRUE
         WHERE id::text = $3 AND is_deleted = FALSE
         RETURNING *`,
        [aiSummary, JSON.stringify(biomarkers), id]
      );
      return formatRecordFromPg(res.rows[0]);
    }

    const rec = mem.records.find(r => r.id === id && !r.isDeleted);
    if (!rec) return null;
    rec.aiSummary = aiSummary;
    rec.biomarkers = biomarkers;
    rec.aiAnalysed = true;
    return rec;
  },

  async delete(id) {
    if (db.isPostgres()) {
      const res = await query(
        `UPDATE medical_reports SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
         WHERE id::text = $1 AND is_deleted = FALSE RETURNING *`,
        [id]
      );
      return formatRecordFromPg(res.rows[0]);
    }
    const record = mem.records.find(item => item.id === id && !item.isDeleted);
    if (!record) return null;
    record.isDeleted = true;
    record.deletedAt = new Date().toISOString();
    return record;
  }
};

module.exports = recordRepository;
