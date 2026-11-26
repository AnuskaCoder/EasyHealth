/**
 * Medical Records Controller
 * Uses RecordRepository
 */
const recordRepository = require("../repositories/recordRepository");
const { mem: db } = require("../config/database");

/**
 * POST /api/records
 */
async function upload(req, res, next) {
  try {
    const { name, type, date, uploadedBy, fileName, fileUrl, fileSizeKb, tags, biomarkers, aiSummary, aiAnalysed } = req.body;

    if (!name || !type) {
      return res.status(422).json({ success: false, error: "Record name and type are required", code: 422 });
    }

    const record = await recordRepository.create({
      patientId: req.user.id,
      name,
      type,
      date: date || new Date().toISOString().split("T")[0],
      uploadedBy: uploadedBy || req.user.name || "Patient Upload",
      fileName: fileName || null,
      fileUrl: fileUrl || null,
      fileSizeKb: fileSizeKb || null,
      tags: tags || [],
      biomarkers: biomarkers || [],
      aiSummary: aiSummary || null,
      aiAnalysed: aiAnalysed || false,
    });

    return res.status(201).json({ success: true, message: "Record uploaded", record });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/records
 */
async function getAll(req, res, next) {
  try {
    let targetPatientId = req.user.id;

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

    const records = await recordRepository.findByPatientId(targetPatientId);
    return res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/records/:id
 */
async function getById(req, res, next) {
  try {
    const record = await recordRepository.findById(req.params.id);
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
async function addAiSummary(req, res, next) {
  try {
    const { summary, biomarkers } = req.body;
    const updated = await recordRepository.updateAiAnalysis(req.params.id, {
      aiSummary: summary,
      biomarkers: biomarkers || []
    });
    if (!updated) {
      return res.status(404).json({ success: false, error: "Record not found", code: 404 });
    }
    return res.json({ success: true, message: "AI summary saved", record: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/records/:id
 */
async function deleteRecord(req, res, next) {
  try {
    const record = await recordRepository.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found", code: 404 });
    }
    if (record.patientId !== req.user.id) {
      return res.status(403).json({ success: false, error: "Forbidden: not your record", code: 403 });
    }
    // Set deleted flag in memory
    const memRec = db.records.find(r => r.id === req.params.id);
    if (memRec) memRec.isDeleted = true;
    return res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, getAll, getById, addAiSummary, deleteRecord };
