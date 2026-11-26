/**
 * HIPAA Consent Lifecycle Management Route
 * Controls patient consent granting, requesting, and revocation
 */
const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { mem: db, query } = require("../config/database");
const doctorRepository = require("../repositories/doctorRepository");

const router = express.Router();

// GET /api/consent/my-consents (patient views who has consent)
router.get("/my-consents", authenticate, requireRole("patient"), (req, res) => {
  const consents = db.consentPermissions.filter(c => c.patientId === req.user.id);
  res.json({ success: true, consents });
});

// POST /api/consent/request (doctor requests consent to view patient records)
router.post("/request", authenticate, requireRole("doctor"), async (req, res, next) => {
  try {
    const { patientId, reason } = req.body;
    if (!patientId) {
      return res.status(422).json({ success: false, error: "patientId is required" });
    }

    const doctor = await doctorRepository.findByUserId(req.user.id) || { id: req.user.id, name: req.user.name };
    const consentId = `CON-${Date.now()}`;

    const newConsent = {
      id: consentId,
      doctorId: doctor.id,
      doctorName: req.user.name,
      patientId,
      status: "requested",
      reason: reason || "Clinical consultation and medical history review",
      requestedAt: new Date().toISOString(),
      grantedAt: null,
      expiresAt: null,
    };

    db.consentPermissions.push(newConsent);
    return res.status(201).json({ success: true, message: "Consent requested from patient", consent: newConsent });
  } catch (err) {
    next(err);
  }
});

// POST /api/consent/grant (patient grants consent)
router.post("/grant", authenticate, requireRole("patient"), (req, res) => {
  const { doctorId, daysValid = 30 } = req.body;
  if (!doctorId) {
    return res.status(422).json({ success: false, error: "doctorId is required" });
  }

  const existingIdx = db.consentPermissions.findIndex(
    c => c.patientId === req.user.id && (c.doctorId === doctorId || c.id === doctorId)
  );

  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  let consentRecord;
  if (existingIdx !== -1) {
    db.consentPermissions[existingIdx].status = "granted";
    db.consentPermissions[existingIdx].grantedAt = now;
    db.consentPermissions[existingIdx].expiresAt = expiresAt;
    consentRecord = db.consentPermissions[existingIdx];
  } else {
    consentRecord = {
      id: `CON-${Date.now()}`,
      doctorId,
      patientId: req.user.id,
      status: "granted",
      requestedAt: now,
      grantedAt: now,
      expiresAt,
    };
    db.consentPermissions.push(consentRecord);
  }

  return res.json({ success: true, message: "Medical record consent granted", consent: consentRecord });
});

// POST /api/consent/revoke (patient revokes consent)
router.post("/revoke", authenticate, requireRole("patient"), (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) {
    return res.status(422).json({ success: false, error: "doctorId is required" });
  }

  const matches = db.consentPermissions.filter(
    c => c.patientId === req.user.id && (c.doctorId === doctorId || c.id === doctorId)
  );

  matches.forEach(c => {
    c.status = "revoked";
    c.revokedAt = new Date().toISOString();
  });

  return res.json({ success: true, message: "Consent revoked successfully" });
});

// GET /api/consent/check (check status between patient and doctor)
router.get("/check", authenticate, async (req, res) => {
  const { patientId, doctorId } = req.query;
  const pId = patientId || (req.user.role === "patient" ? req.user.id : null);
  const dId = doctorId || (req.user.role === "doctor" ? req.user.id : null);

  const active = db.consentPermissions.some(
    c => c.patientId === pId &&
         c.doctorId === dId &&
         c.status === "granted" &&
         (!c.expiresAt || new Date(c.expiresAt) > new Date())
  );

  return res.json({ success: true, hasConsent: active });
});

module.exports = router;
