const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db, mem, query } = require("../config/database");
const recordRepository = require("../repositories/recordRepository");
const patientRepository = require("../repositories/patientRepository");
const doctorRepository = require("../repositories/doctorRepository");

const router = express.Router();

async function canReadRecord(user, record) {
  if (user.role === "admin") return true;
  if (!db.isPostgres()) {
    if (user.role === "patient") return record.patientId === user.id;
    return user.role === "doctor" && mem.consentPermissions.some(consent =>
      (consent.doctorId === user.id || consent.doctorUserId === user.id) &&
      consent.patientId === record.patientId &&
      consent.status === "granted"
    );
  }
  if (user.role === "patient") {
    const patient = await patientRepository.findByUserId(user.id);
    return patient?.id === record.patientId;
  }
  if (user.role === "doctor") {
    const doctor = await doctorRepository.findByUserId(user.id);
    if (!doctor) return false;
    const result = await query(
      `SELECT 1 FROM consent_permissions
       WHERE doctor_id = $1 AND patient_id = $2 AND status = 'granted'
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       LIMIT 1`,
      [doctor.id, record.patientId]
    );
    return result.rowCount > 0;
  }
  return false;
}

async function writeAudit(userId, action, resourceId) {
  if (db.isPostgres()) {
    await query(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id)
       VALUES ($1, $2, $3, 'medical_record', $4)`,
      [`al-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId, action, resourceId]
    );
    return;
  }
  mem.auditLogs.push({
    id: `al-${Date.now()}`,
    userId,
    action,
    resourceType: "medical_record",
    resourceId,
    timestamp: new Date().toISOString(),
  });
}

async function resolveDoctorId(id) {
  if (!db.isPostgres()) return id;
  const doctor = await doctorRepository.findById(id);
  return doctor?.id || null;
}

async function resolvePatientId(id) {
  if (!db.isPostgres()) return id;
  const patient = await patientRepository.findByUserId(id);
  return patient?.id || null;
}

router.get("/consent/list", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    if (db.isPostgres()) {
      const patientId = await resolvePatientId(req.user.id);
      const result = await query(
        `SELECT c.id, c.doctor_id AS "doctorId", d.name AS "doctorName",
                d.specialty, c.status, c.requested_date AS "requestedDate",
                c.granted_date AS "grantedDate", c.expires_at AS "expiresAt"
         FROM consent_permissions c
         JOIN doctors d ON d.id = c.doctor_id
         WHERE c.patient_id = $1
         ORDER BY c.requested_date DESC`,
        [patientId]
      );
      return res.json({ success: true, data: result.rows });
    }
    return res.json({
      success: true,
      data: mem.consentPermissions.filter(item => item.patientId === req.user.id),
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/consent/grant", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const { doctorId, doctorName, specialty } = req.body;
    if (!doctorId) return res.status(422).json({ success: false, error: "doctorId is required" });
    const now = new Date();
    const patientId = await resolvePatientId(req.user.id);
    const resolvedDoctorId = await resolveDoctorId(doctorId);
    if (db.isPostgres() && (!patientId || !resolvedDoctorId)) {
      return res.status(404).json({ success: false, error: "Patient or doctor profile not found" });
    }

    if (db.isPostgres()) {
      const existing = await query(
        `SELECT id FROM consent_permissions WHERE doctor_id = $1 AND patient_id = $2 LIMIT 1`,
        [resolvedDoctorId, patientId]
      );
      let result;
      if (existing.rows[0]) {
        result = await query(
          `UPDATE consent_permissions
           SET status = 'granted', granted_date = $1, expires_at = NULL, revoked_at = NULL
           WHERE id = $2 RETURNING *`,
          [now, existing.rows[0].id]
        );
      } else {
        result = await query(
          `INSERT INTO consent_permissions (doctor_id, patient_id, status, granted_date)
           VALUES ($1, $2, 'granted', $3) RETURNING *`,
          [resolvedDoctorId, patientId, now]
        );
      }
      return res.status(existing.rows[0] ? 200 : 201).json({
        success: true,
        data: { ...result.rows[0], doctorName: doctorName || "", specialty: specialty || "" },
        message: "Doctor granted access to your records",
      });
    }

    const existing = mem.consentPermissions.find(item =>
      item.doctorId === doctorId && item.patientId === req.user.id
    );
    if (existing) {
      existing.status = "granted";
      existing.grantedDate = now.toISOString().split("T")[0];
      return res.json({ success: true, data: existing, message: "Access granted" });
    }
    const consent = {
      id: `CON-${Date.now()}`,
      patientId: req.user.id,
      doctorId,
      doctorName: doctorName || "",
      specialty: specialty || "",
      status: "granted",
      requestedDate: now.toISOString().split("T")[0],
      grantedDate: now.toISOString().split("T")[0],
    };
    mem.consentPermissions.push(consent);
    return res.status(201).json({ success: true, data: consent, message: "Doctor granted access to your records" });
  } catch (err) {
    return next(err);
  }
});

router.delete("/consent/revoke/:doctorId", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    if (db.isPostgres()) {
      const patientId = await resolvePatientId(req.user.id);
      const doctorId = await resolveDoctorId(req.params.doctorId);
      const result = await query(
        `UPDATE consent_permissions SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
         WHERE doctor_id = $1 AND patient_id = $2 AND status <> 'revoked'`,
        [doctorId, patientId]
      );
      if (!result.rowCount) return res.status(404).json({ success: false, error: "Consent not found" });
      return res.json({ success: true, message: "Access revoked" });
    }
    const index = mem.consentPermissions.findIndex(item =>
      item.doctorId === req.params.doctorId && item.patientId === req.user.id
    );
    if (index === -1) return res.status(404).json({ success: false, error: "Consent not found" });
    mem.consentPermissions[index].status = "revoked";
    return res.json({ success: true, message: "Access revoked" });
  } catch (err) {
    return next(err);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    let records;
    if (req.user.role === "patient") {
      records = await recordRepository.findByPatientId(req.user.id);
    } else if (req.user.role === "doctor") {
      const doctor = await doctorRepository.findByUserId(req.user.id);
      if (!doctor) return res.json({ success: true, data: [], count: 0 });
      records = await recordRepository.findByDoctorId(doctor.id);
    } else {
      records = await recordRepository.findAll();
    }
    return res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const record = await recordRepository.findById(req.params.id);
    if (!record || record.isDeleted) return res.status(404).json({ success: false, error: "Record not found" });
    if (!await canReadRecord(req.user, record)) {
      return res.status(403).json({
        success: false,
        error: req.user.role === "doctor" ? "Patient has not granted you access to their records" : "Access denied",
      });
    }
    await writeAudit(req.user.id, "VIEW_RECORD", record.id);
    return res.json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
});

router.post("/", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const { name, type, date, uploadedBy, fileName, aiSummary, tags, biomarkers } = req.body;
    if (!name || !type || !date) {
      return res.status(422).json({ success: false, error: "name, type, and date are required" });
    }
    const record = await recordRepository.create({
      patientId: req.user.id,
      name,
      type,
      date,
      uploadedBy: uploadedBy || "Patient",
      fileName: fileName || null,
      aiSummary: aiSummary || null,
      aiAnalysed: !!aiSummary,
      tags: tags || [type],
      biomarkers: biomarkers || [],
    });
    await writeAudit(req.user.id, "UPLOAD_RECORD", record.id);
    return res.status(201).json({ success: true, data: record, message: "Medical record uploaded successfully" });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/ai-summary", authenticate, async (req, res, next) => {
  try {
    const record = await recordRepository.findById(req.params.id);
    if (!record || record.isDeleted) return res.status(404).json({ success: false, error: "Record not found" });
    if (!await canReadRecord(req.user, record)) {
      return res.status(403).json({ success: false, error: "You do not have permission to update this record" });
    }
    const updated = await recordRepository.updateAiAnalysis(req.params.id, {
      aiSummary: req.body.aiSummary,
      biomarkers: req.body.biomarkers || record.biomarkers,
    });
    return res.json({ success: true, data: updated, message: "AI summary updated" });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const record = await recordRepository.findById(req.params.id);
    if (!record || record.isDeleted) return res.status(404).json({ success: false, error: "Record not found" });
    if (!await canReadRecord(req.user, record)) {
      return res.status(403).json({ success: false, error: "You can only delete your own records" });
    }
    await recordRepository.delete(req.params.id);
    await writeAudit(req.user.id, "DELETE_RECORD", req.params.id);
    return res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
