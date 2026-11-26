const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { mem } = require("../config/database");
const router = express.Router();

// ── Consent check helper ──────────────────────────────────────────────────────
function checkConsent(doctorId, patientId) {
  return mem.consentPermissions.some(c =>
    (c.doctorId === doctorId || c.doctorUserId === doctorId) &&
    c.patientId === patientId &&
    c.status === "granted"
  );
}

function canReadRecord(user, record) {
  if (user.role === "admin") return true;
  if (user.role === "patient") return record.patientId === user.id;
  if (user.role === "doctor") {
    // Doctor needs explicit patient consent
    return checkConsent(user.id, record.patientId);
  }
  return false;
}

// GET /api/records
router.get("/", authenticate, (req, res) => {
  let records;
  if (req.user.role === "patient") {
    records = mem.records.filter(r => r.patientId === req.user.id && !r.isDeleted);
  } else if (req.user.role === "doctor") {
    // Only return records for patients who have granted consent
    const grantedPatientIds = mem.consentPermissions
      .filter(c => (c.doctorId === req.user.id || c.doctorUserId === req.user.id) && c.status === "granted")
      .map(c => c.patientId);
    records = mem.records.filter(r => grantedPatientIds.includes(r.patientId) && !r.isDeleted);
  } else {
    records = mem.records.filter(r => !r.isDeleted);
  }
  res.json({ success: true, data: records, count: records.length });
});

// GET /api/records/:id — consent enforced for doctors
router.get("/:id", authenticate, (req, res) => {
  const record = mem.records.find(r => r.id === req.params.id && !r.isDeleted);
  if (!record) return res.status(404).json({ success: false, error: "Record not found" });
  if (!canReadRecord(req.user, record)) {
    return res.status(403).json({ success: false, error: req.user.role === "doctor" ? "Patient has not granted you access to their records" : "Access denied" });
  }
  mem.auditLogs.push({ id: `al-${Date.now()}`, userId: req.user.id, action: "VIEW_RECORD", resourceType: "medical_record", resourceId: record.id, timestamp: new Date().toISOString() });
  res.json({ success: true, data: record });
});

// POST /api/records — patient uploads their own record
router.post("/", authenticate, requireRole("patient"), (req, res) => {
  const { name, type, date, uploadedBy, fileName, aiSummary, tags, biomarkers } = req.body;
  if (!name || !type || !date) {
    return res.status(422).json({ success: false, error: "name, type, and date are required" });
  }
  const newRecord = {
    id: `REC-${Date.now()}`,
    patientId: req.user.id,  // Always set to authenticated user — no spoofing
    name, type, date,
    uploadedBy: uploadedBy || "Patient",
    fileName: fileName || null,
    fileUrl: null,
    aiSummary: aiSummary || null,
    aiAnalysed: !!aiSummary,
    isEncrypted: true,
    tags: tags || [type],
    biomarkers: biomarkers || [],
    isDeleted: false,
    createdAt: new Date().toISOString(),
  };
  mem.records.push(newRecord);
  mem.auditLogs.push({ id: `al-${Date.now()}`, userId: req.user.id, action: "UPLOAD_RECORD", resourceType: "medical_record", resourceId: newRecord.id, timestamp: new Date().toISOString() });
  res.status(201).json({ success: true, data: newRecord, message: "Medical record uploaded successfully" });
});

// PATCH /api/records/:id/ai-summary — ownership check
router.patch("/:id/ai-summary", authenticate, (req, res) => {
  const idx = mem.records.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Record not found" });

  // Only the record owner or a doctor with consent can add AI summary
  const record = mem.records[idx];
  if (!canReadRecord(req.user, record)) {
    return res.status(403).json({ success: false, error: "You do not have permission to update this record" });
  }

  mem.records[idx].aiSummary = req.body.aiSummary;
  mem.records[idx].aiAnalysed = true;
  if (req.body.biomarkers) mem.records[idx].biomarkers = req.body.biomarkers;
  mem.records[idx].updatedAt = new Date().toISOString();
  res.json({ success: true, data: mem.records[idx], message: "AI summary updated" });
});

// DELETE /api/records/:id — only record owner
router.delete("/:id", authenticate, requireRole("patient"), (req, res) => {
  const idx = mem.records.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Record not found" });
  if (mem.records[idx].patientId !== req.user.id) {
    return res.status(403).json({ success: false, error: "You can only delete your own records" });
  }
  mem.records[idx].isDeleted = true;
  mem.records[idx].deletedAt = new Date().toISOString();
  mem.auditLogs.push({ id: `al-${Date.now()}`, userId: req.user.id, action: "DELETE_RECORD", resourceType: "medical_record", resourceId: req.params.id, timestamp: new Date().toISOString() });
  res.json({ success: true, message: "Record deleted" });
});

// GET /api/records/consent/list — patient sees who has access
router.get("/consent/list", authenticate, requireRole("patient"), (req, res) => {
  const perms = mem.consentPermissions.filter(c => c.patientId === req.user.id);
  res.json({ success: true, data: perms });
});

// POST /api/records/consent/grant — patient grants access to a doctor
router.post("/consent/grant", authenticate, requireRole("patient"), (req, res) => {
  const { doctorId, doctorName, specialty } = req.body;
  if (!doctorId) return res.status(422).json({ success: false, error: "doctorId is required" });
  const existing = mem.consentPermissions.find(c => c.doctorId === doctorId && c.patientId === req.user.id);
  if (existing) {
    existing.status = "granted";
    existing.grantedDate = new Date().toISOString().split("T")[0];
    return res.json({ success: true, data: existing, message: "Access granted" });
  }
  const consent = { id: `CON-${Date.now()}`, patientId: req.user.id, doctorId, doctorName: doctorName || "", specialty: specialty || "", status: "granted", requestedDate: new Date().toISOString().split("T")[0], grantedDate: new Date().toISOString().split("T")[0] };
  mem.consentPermissions.push(consent);
  res.status(201).json({ success: true, data: consent, message: "Doctor granted access to your records" });
});

// DELETE /api/records/consent/revoke/:doctorId — patient revokes access
router.delete("/consent/revoke/:doctorId", authenticate, requireRole("patient"), (req, res) => {
  const idx = mem.consentPermissions.findIndex(c => c.doctorId === req.params.doctorId && c.patientId === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Consent not found" });
  mem.consentPermissions[idx].status = "revoked";
  res.json({ success: true, message: "Access revoked" });
});

module.exports = router;
