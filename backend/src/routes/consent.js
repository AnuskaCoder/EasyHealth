/**
 * Patient consent management for medical-record access.
 */
const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { db, mem, query } = require("../config/database");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");

const router = express.Router();

async function findPatientId(id) {
  const patient = await patientRepository.findByUserId(id);
  return patient?.id || null;
}

async function findDoctorId(id) {
  const doctor = await doctorRepository.findById(id);
  return doctor?.id || null;
}

router.get("/my-consents", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    if (db.isPostgres()) {
      const patientId = await findPatientId(req.user.id);
      const result = await query(
        `SELECT c.id, c.doctor_id AS "doctorId", d.name AS "doctorName",
                d.specialty, c.status, c.reason, c.requested_date AS "requestedAt",
                c.granted_date AS "grantedAt", c.expires_at AS "expiresAt",
                c.revoked_at AS "revokedAt"
         FROM consent_permissions c
         JOIN doctors d ON d.id = c.doctor_id
         WHERE c.patient_id = $1
         ORDER BY c.requested_date DESC`,
        [patientId]
      );
      return res.json({ success: true, consents: result.rows });
    }
    return res.json({
      success: true,
      consents: mem.consentPermissions.filter(item => item.patientId === req.user.id),
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/request", authenticate, requireRole("doctor"), async (req, res, next) => {
  try {
    const { patientId, reason } = req.body;
    if (!patientId) return res.status(422).json({ success: false, error: "patientId is required" });
    const doctor = await doctorRepository.findByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, error: "Doctor profile not found" });

    if (db.isPostgres()) {
      const targetPatientId = await findPatientId(patientId);
      if (!targetPatientId) return res.status(404).json({ success: false, error: "Patient profile not found" });
      const result = await query(
        `INSERT INTO consent_permissions (doctor_id, patient_id, status, reason)
         VALUES ($1, $2, 'requested', $3)
         ON CONFLICT (doctor_id, patient_id) DO UPDATE
         SET status = 'requested', reason = EXCLUDED.reason,
             requested_date = CURRENT_TIMESTAMP, granted_date = NULL,
             expires_at = NULL, revoked_at = NULL
         WHERE consent_permissions.status <> 'granted'
            OR (consent_permissions.expires_at IS NOT NULL
                AND consent_permissions.expires_at <= CURRENT_TIMESTAMP)
         RETURNING id, doctor_id AS "doctorId", patient_id AS "patientId",
                   status, reason, requested_date AS "requestedAt"`,
        [doctor.id, targetPatientId, reason || "Clinical consultation and medical history review"]
      );
      if (!result.rows[0]) {
        return res.status(409).json({ success: false, error: "Consent is already active for this patient" });
      }
      return res.status(201).json({
        success: true,
        message: "Consent requested from patient",
        consent: result.rows[0],
      });
    }

    const consent = {
      id: `CON-${Date.now()}`,
      doctorId: doctor.id,
      doctorName: req.user.name,
      patientId,
      status: "requested",
      reason: reason || "Clinical consultation and medical history review",
      requestedAt: new Date().toISOString(),
      grantedAt: null,
      expiresAt: null,
    };
    mem.consentPermissions.push(consent);
    return res.status(201).json({ success: true, message: "Consent requested from patient", consent });
  } catch (err) {
    return next(err);
  }
});

router.post("/grant", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const { doctorId, daysValid = 30 } = req.body;
    if (!doctorId) return res.status(422).json({ success: false, error: "doctorId is required" });
    if (!Number.isInteger(daysValid) || daysValid < 1 || daysValid > 365) {
      return res.status(422).json({ success: false, error: "daysValid must be between 1 and 365" });
    }

    if (db.isPostgres()) {
      const patientId = await findPatientId(req.user.id);
      const targetDoctorId = await findDoctorId(doctorId);
      if (!patientId || !targetDoctorId) {
        return res.status(404).json({ success: false, error: "Patient or doctor profile not found" });
      }
      const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
      const existing = await query(
        `SELECT id FROM consent_permissions WHERE doctor_id = $1 AND patient_id = $2 LIMIT 1`,
        [targetDoctorId, patientId]
      );
      const result = existing.rows[0]
        ? await query(
          `UPDATE consent_permissions
           SET status = 'granted', granted_date = CURRENT_TIMESTAMP,
               expires_at = $1, revoked_at = NULL
           WHERE id = $2 RETURNING *`,
          [expiresAt, existing.rows[0].id]
        )
        : await query(
          `INSERT INTO consent_permissions (doctor_id, patient_id, status, granted_date, expires_at)
           VALUES ($1, $2, 'granted', CURRENT_TIMESTAMP, $3) RETURNING *`,
          [targetDoctorId, patientId, expiresAt]
        );
      return res.json({ success: true, message: "Medical record consent granted", consent: result.rows[0] });
    }

    const existing = mem.consentPermissions.find(
      item => item.patientId === req.user.id && (item.doctorId === doctorId || item.id === doctorId)
    );
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
    if (existing) {
      existing.status = "granted";
      existing.grantedAt = now;
      existing.expiresAt = expiresAt;
      return res.json({ success: true, message: "Medical record consent granted", consent: existing });
    }
    const consent = {
      id: `CON-${Date.now()}`,
      doctorId,
      patientId: req.user.id,
      status: "granted",
      requestedAt: now,
      grantedAt: now,
      expiresAt,
    };
    mem.consentPermissions.push(consent);
    return res.json({ success: true, message: "Medical record consent granted", consent });
  } catch (err) {
    return next(err);
  }
});

router.post("/revoke", authenticate, requireRole("patient"), async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) return res.status(422).json({ success: false, error: "doctorId is required" });

    if (db.isPostgres()) {
      const patientId = await findPatientId(req.user.id);
      const targetDoctorId = await findDoctorId(doctorId);
      if (!patientId || !targetDoctorId) return res.status(404).json({ success: false, error: "Consent not found" });
      const result = await query(
        `UPDATE consent_permissions SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
         WHERE patient_id = $1 AND doctor_id = $2 AND status = 'granted'`,
        [patientId, targetDoctorId]
      );
      if (!result.rowCount) return res.status(404).json({ success: false, error: "Consent not found" });
      return res.json({ success: true, message: "Consent revoked successfully" });
    }

    const matches = mem.consentPermissions.filter(
      item => item.patientId === req.user.id && (item.doctorId === doctorId || item.id === doctorId)
    );
    matches.forEach(item => {
      item.status = "revoked";
      item.revokedAt = new Date().toISOString();
    });
    return res.json({ success: true, message: "Consent revoked successfully" });
  } catch (err) {
    return next(err);
  }
});

router.get("/check", authenticate, async (req, res, next) => {
  try {
    const patientRef = req.query.patientId || (req.user.role === "patient" ? req.user.id : null);
    const doctorRef = req.query.doctorId || (req.user.role === "doctor" ? req.user.id : null);
    if (!patientRef || !doctorRef) {
      return res.status(422).json({ success: false, error: "patientId and doctorId are required" });
    }

    if (db.isPostgres()) {
      const patientId = await findPatientId(patientRef);
      const doctorId = await findDoctorId(doctorRef);
      const result = await query(
        `SELECT 1 FROM consent_permissions
         WHERE patient_id = $1 AND doctor_id = $2 AND status = 'granted'
           AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         LIMIT 1`,
        [patientId, doctorId]
      );
      return res.json({ success: true, hasConsent: result.rowCount > 0 });
    }

    const active = mem.consentPermissions.some(item =>
      item.patientId === patientRef &&
      item.doctorId === doctorRef &&
      item.status === "granted" &&
      (!item.expiresAt || new Date(item.expiresAt) > new Date())
    );
    return res.json({ success: true, hasConsent: active });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
