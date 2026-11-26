const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { db } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// GET /api/records - get all records for authenticated patient
router.get("/", authenticate, (req, res) => {
  const records = db.records.filter(r => r.patientId === req.user.id && !r.isDeleted);
  res.json({ success: true, data: records, count: records.length });
});

// GET /api/records/:id
router.get("/:id", authenticate, (req, res) => {
  const record = db.records.find(r => r.id === req.params.id && !r.isDeleted);
  if (!record) return res.status(404).json({ success: false, error: "Record not found" });
  if (record.patientId !== req.user.id && req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Access denied" });
  }
  res.json({ success: true, data: record });
});

// POST /api/records - upload new record
router.post("/", authenticate, (req, res) => {
  const { name, type, date, uploadedBy, fileName, aiSummary, tags, biomarkers } = req.body;
  if (!name || !type || !date) {
    return res.status(422).json({ success: false, error: "name, type, and date are required" });
  }
  const newRecord = {
    id: `REC-${Date.now()}`,
    patientId: req.user.id,
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
  db.records.push(newRecord);
  res.status(201).json({ success: true, data: newRecord, message: "Medical record uploaded successfully" });
});

// PATCH /api/records/:id/ai-summary
router.patch("/:id/ai-summary", authenticate, (req, res) => {
  const idx = db.records.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Record not found" });
  db.records[idx].aiSummary = req.body.aiSummary;
  db.records[idx].aiAnalysed = true;
  if (req.body.biomarkers) db.records[idx].biomarkers = req.body.biomarkers;
  res.json({ success: true, data: db.records[idx], message: "AI summary updated" });
});

// DELETE /api/records/:id - soft delete
router.delete("/:id", authenticate, (req, res) => {
  const idx = db.records.findIndex(r => r.id === req.params.id && r.patientId === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Record not found" });
  db.records[idx].isDeleted = true;
  res.json({ success: true, message: "Record deleted" });
});

module.exports = router;
