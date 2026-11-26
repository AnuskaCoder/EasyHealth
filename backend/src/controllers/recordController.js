const { db } = require("../config/database");

function generateRecordId() {
  return `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * POST /api/records
 */
function upload(req, res, next) {
  try {
    const { name, type, date, uploadedBy, fileName, fileUrl, fileSizeKb, tags } = req.body;

    if (!name || !type) {
      return res.status(422).json({ success: false, error: "Record name and type are required", code: 422 });
    }

    const record = {
      id: generateRecordId(),
      patientId: req.user.id,
      name,
      type,
      date: date || new Date().toISOString().split("T")[0],
      uploadedBy: uploadedBy || req.user.name,
      fileName: fileName || null,
      fileUrl: fileUrl || null,
      fileSizeKb: fileSizeKb || null,
      aiSummary: null,
      aiAnalysed: false,
      isEncrypted: true,
      tags: tags || [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    db.records.unshift(record);
    return res.status(201).json({ success: true, message: "Record uploaded", record });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/records
 */
function getAll(req, res, next) {
  try {
    let targetPatientId = req.user.id;

    // Doctor can view records for a specific patient (with consent)
    if (req.user.role === "doctor" && req.query.patientId) {
      const hasConsent = db.consentPermissions.some(
        c => c.patientId === req.query.patientId &&
          db.doctors.find(d => d.userId === req.user.id && d.id === c.doctorId) &&
          c.status === "granted"
      );
      if (!hasConsent) {
        return res.status(403).json({ success: false, error: "Patient has not granted access to their records", code: 403 });
      }
      targetPatientId = req.query.patientId;
    }

    const records = db.records
      .filter(r => r.patientId === targetPatientId && !r.isDeleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/records/:id
 */
function getById(req, res, next) {
  try {
    const record = db.records.find(r => r.id === req.params.id && !r.isDeleted);
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found", code: 404 });
    }
    return res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/records/:id/ai-summary
 */
function addAiSummary(req, res, next) {
  try {
    const idx = db.records.findIndex(r => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Record not found", code: 404 });
    }
    const { summary, biomarkers } = req.body;
    db.records[idx].aiSummary = summary;
    db.records[idx].aiAnalysed = true;
    if (biomarkers) db.records[idx].biomarkers = biomarkers;
    return res.json({ success: true, message: "AI summary saved", record: db.records[idx] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/records/:id  (soft delete)
 */
function deleteRecord(req, res, next) {
  try {
    const idx = db.records.findIndex(r => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Record not found", code: 404 });
    }
    if (db.records[idx].patientId !== req.user.id) {
      return res.status(403).json({ success: false, error: "Forbidden: not your record", code: 403 });
    }
    db.records[idx].isDeleted = true;
    return res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, getAll, getById, addAiSummary, deleteRecord };
