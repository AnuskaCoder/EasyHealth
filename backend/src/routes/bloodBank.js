const express = require("express");
const { authenticate } = require("../middleware/auth");
const { db, mem } = require("../config/database");

const router = express.Router();
const bloodGroups = new Set(["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]);
const components = new Set(["Whole Blood", "PRBC (Red Cells)", "Platelets (SDP)", "Plasma (FFP)"]);
const urgencies = new Set(["CRITICAL", "HIGH", "SCHEDULED"]);

mem.bloodRequests ||= [];
router.use(authenticate);

// Authenticated feed for user-created requests; listings are not clinically verified.
router.get("/requests", async (req, res, next) => {
  try {
    if (db.isPostgres()) {
      const { rows } = await db.query(
        `SELECT r.id, 'Patient / representative' AS "patientName", r.blood_group AS "bloodGroup",
                r.units_needed AS "unitsNeeded", r.component, r.urgency, r.hospital, r.area,
                '' AS city, 0 AS "distanceKm", r.reason, 'Request contact' AS "contactName",
                r.contact_phone AS "contactPhone", 'Recently' AS "postedTime",
                COUNT(response.user_id)::int AS "donorsResponded", (r.created_by = $1) AS "isMine"
         FROM blood_requests r
         LEFT JOIN blood_request_responses response ON response.request_id = r.id
         WHERE r.status = 'Open'
         GROUP BY r.id
         ORDER BY r.created_at DESC`,
        [req.user.id]
      );
      return res.json({ success: true, data: rows, count: rows.length });
    }

    const requests = mem.bloodRequests
      .filter((request) => request.status === "Open")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(({ donorUserIds, createdBy, ...request }) => ({
        ...request,
        isMine: createdBy === req.user.id,
        donorsResponded: donorUserIds.length,
        postedTime: "Recently",
      }));
    return res.json({ success: true, data: requests, count: requests.length });
  } catch (err) {
    return next(err);
  }
});

router.post("/requests", async (req, res, next) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({ success: false, error: "Only patient accounts can post blood requests" });
  }

  const { bloodGroup, unitsNeeded, component, urgency, hospital, area, reason, contactPhone, contactConsent } = req.body;
  if (!bloodGroups.has(bloodGroup) || !components.has(component) || !urgencies.has(urgency)) {
    return res.status(422).json({ success: false, error: "Choose a valid blood group, component, and urgency" });
  }
  if (!Number.isInteger(unitsNeeded) || unitsNeeded < 1 || unitsNeeded > 10 || !hospital?.trim() || !area?.trim() || !contactPhone?.trim()) {
    return res.status(422).json({ success: false, error: "Units (1–10), hospital, location, and contact phone are required" });
  }
  if (contactConsent !== true) {
    return res.status(422).json({ success: false, error: "Consent is required before sharing the contact number with signed-in users" });
  }

  const requestId = `BLD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const request = {
    id: requestId,
    patientName: "Patient / representative",
    bloodGroup,
    unitsNeeded,
    component,
    urgency,
    hospital: hospital.trim(),
    area: area.trim(),
    city: "",
    distanceKm: 0,
    reason: String(reason || "").trim().slice(0, 500),
    contactName: "Request contact",
    contactPhone: contactPhone.trim().slice(0, 40),
    postedTime: "Just now",
    donorsResponded: 0,
    donorUserIds: [],
    status: "Open",
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };

  if (db.isPostgres()) {
    try {
      const { rows } = await db.query(
        `INSERT INTO blood_requests
          (id, created_by, blood_group, units_needed, component, urgency, hospital, area, contact_phone, contact_consent, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10)
         RETURNING id, blood_group AS "bloodGroup", units_needed AS "unitsNeeded", component, urgency,
                   hospital, area, reason, contact_phone AS "contactPhone", created_at AS "createdAt"`,
        [request.id, req.user.id, request.bloodGroup, request.unitsNeeded, request.component, request.urgency,
          request.hospital, request.area, request.contactPhone, request.reason]
      );
      const saved = rows[0];
      return res.status(201).json({
        success: true,
        data: {
          ...request,
          ...saved,
          donorsResponded: 0,
          isMine: true,
          postedTime: "Just now",
        },
        message: "Request added to the signed-in user feed",
      });
    } catch (err) {
      return next(err);
    }
  }

  mem.bloodRequests.unshift(request);
  const { donorUserIds, createdBy, ...publicRequest } = request;
  return res.status(201).json({ success: true, data: { ...publicRequest, isMine: true }, message: "Request added to the signed-in user feed" });
});

router.post("/requests/:id/respond", async (req, res, next) => {
  if (db.isPostgres()) {
    try {
      const requestResult = await db.query(
        "SELECT created_by FROM blood_requests WHERE id = $1 AND status = 'Open'",
        [req.params.id]
      );
      const request = requestResult.rows[0];
      if (!request) return res.status(404).json({ success: false, error: "Open blood request not found" });
      if (request.created_by === req.user.id) {
        return res.status(409).json({ success: false, error: "You cannot respond to your own request" });
      }
      const inserted = await db.query(
        "INSERT INTO blood_request_responses (request_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING user_id",
        [req.params.id, req.user.id]
      );
      if (inserted.rowCount === 0) {
        return res.status(409).json({ success: false, error: "You have already responded to this request" });
      }
      const count = await db.query(
        "SELECT COUNT(*)::int AS count FROM blood_request_responses WHERE request_id = $1",
        [req.params.id]
      );
      return res.json({ success: true, data: { requestId: req.params.id, donorsResponded: count.rows[0].count } });
    } catch (err) {
      return next(err);
    }
  }

  const request = mem.bloodRequests.find((item) => item.id === req.params.id && item.status === "Open");
  if (!request) return res.status(404).json({ success: false, error: "Open blood request not found" });
  if (request.createdBy === req.user.id) {
    return res.status(409).json({ success: false, error: "You cannot respond to your own request" });
  }
  if (request.donorUserIds.includes(req.user.id)) {
    return res.status(409).json({ success: false, error: "You have already responded to this request" });
  }
  request.donorUserIds.push(req.user.id);
  return res.json({ success: true, data: { requestId: request.id, donorsResponded: request.donorUserIds.length } });
});

module.exports = router;
