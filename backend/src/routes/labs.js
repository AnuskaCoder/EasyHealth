const express = require("express");
const { authenticate } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const { db, mem, query } = require("../config/database");
const patientRepository = require("../repositories/patientRepository");
const router = express.Router();

const labTests = [
  { id: "l1", name: "Complete Blood Count (CBC)", category: "Blood Tests", price: 350, discountPct: 30, finalPrice: 245, homeCollection: true, reportTime: "6 hours", popular: true, sampleType: "Blood" },
  { id: "l2", name: "HbA1c", category: "Diabetes", price: 650, discountPct: 25, finalPrice: 487, homeCollection: true, reportTime: "24 hours", popular: true, sampleType: "Blood" },
  { id: "l3", name: "Lipid Profile", category: "Cardiac", price: 800, discountPct: 35, finalPrice: 520, homeCollection: true, reportTime: "12 hours", popular: true, sampleType: "Blood" },
  { id: "l4", name: "Thyroid Profile (TSH, T3, T4)", category: "Thyroid", price: 950, discountPct: 20, finalPrice: 760, homeCollection: true, reportTime: "24 hours", popular: false, sampleType: "Blood" },
  { id: "l5", name: "Urine Routine & Microscopy", category: "Urine Tests", price: 180, discountPct: 10, finalPrice: 162, homeCollection: true, reportTime: "4 hours", popular: false, sampleType: "Urine" },
  { id: "l6", name: "Liver Function Test (LFT)", category: "Blood Tests", price: 700, discountPct: 30, finalPrice: 490, homeCollection: true, reportTime: "12 hours", popular: false, sampleType: "Blood" },
  { id: "l7", name: "Kidney Function Test (KFT)", category: "Blood Tests", price: 600, discountPct: 25, finalPrice: 450, homeCollection: true, reportTime: "12 hours", popular: false, sampleType: "Blood" },
  { id: "l8", name: "Vitamin D Total", category: "Vitamins", price: 1200, discountPct: 40, finalPrice: 720, homeCollection: true, reportTime: "24 hours", popular: true, sampleType: "Blood" },
  { id: "l11", name: "Full Body Checkup - Basic", category: "Health Packages", price: 2999, discountPct: 50, finalPrice: 1499, homeCollection: true, reportTime: "24 hours", popular: true, sampleType: "Blood & Urine", includes: ["CBC", "Blood Sugar", "Lipid", "LFT", "KFT", "Thyroid", "Urine"] },
  { id: "l12", name: "Full Body Checkup - Comprehensive", category: "Health Packages", price: 5999, discountPct: 55, finalPrice: 2699, homeCollection: true, reportTime: "48 hours", popular: true, sampleType: "Blood & Urine", includes: ["All Basic tests", "Vitamin B12 & D", "HbA1c", "ECG", "Doctor Consultation"] },
];

// GET /api/labs
router.get("/", (req, res) => {
  const { category } = req.query;
  let tests = labTests;
  if (category && category !== "All") tests = labTests.filter(t => t.category === category);
  res.json({ success: true, data: tests, count: tests.length });
});

// GET /api/labs/categories
router.get("/categories", (req, res) => {
  const cats = ["All", ...new Set(labTests.map(t => t.category))];
  res.json({ success: true, data: cats });
});

// GET /api/labs/bookings
router.get("/bookings", authenticate, async (req, res, next) => {
  try {
    let bookings;
    if (db.isPostgres()) {
      const result = await query(
        `SELECT b.*, p.user_id
         FROM home_sample_collections b
         JOIN patient_profiles p ON p.id = b.patient_id
         WHERE p.user_id = $1
         ORDER BY b.collection_date DESC, b.created_at DESC`,
        [req.user.id]
      );
      bookings = result.rows.map(formatBooking);
    } else {
      bookings = mem.labBookings.filter(booking => booking.patientId === req.user.id);
    }
    return res.json({ success: true, data: bookings, count: bookings.length });
  } catch (err) {
    return next(err);
  }
});

// POST /api/labs/book
router.post("/book", authenticate, async (req, res, next) => {
  const { packageId, date, timeSlot, address } = req.body;
  if (!packageId || !date || !address) {
    return res.status(422).json({ success: false, error: "packageId, date, and address are required" });
  }
  const selectedTest = labTests.find(test => test.id === packageId);
  if (!selectedTest) return res.status(422).json({ success: false, error: "Choose a valid lab test" });

  const booking = {
    id: `LAB-${uuidv4()}`,
    patientId: req.user.id,
    packageId,
    packageName: selectedTest.name,
    sampleType: selectedTest.sampleType || "Blood",
    date, timeSlot: timeSlot || "7:00 AM - 9:00 AM",
    address,
    fee: selectedTest.finalPrice,
    status: "Confirmed",
    phlebotomistName: "Assigned Phlebotomist",
    phlebotomistPhone: "+91 98700 00000",
    createdAt: new Date().toISOString(),
  };
  if (db.isPostgres()) {
    try {
      const patient = await patientRepository.findByUserId(req.user.id);
      if (!patient) return res.status(404).json({ success: false, error: "Patient profile not found" });
      const result = await query(
        `INSERT INTO home_sample_collections
          (id, package_id, patient_id, package_name, patient_name, sample_type, collection_date,
           time_slot, address, fee, status, phlebotomist_name, phlebotomist_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          booking.id, booking.packageId, patient.id, booking.packageName, patient.name,
          booking.sampleType, booking.date, booking.timeSlot, booking.address, booking.fee,
          booking.status, booking.phlebotomistName, booking.phlebotomistPhone,
        ]
      );
      return res.status(201).json({
        success: true,
        data: formatBooking({ ...result.rows[0], user_id: req.user.id }),
        message: "Home collection booked. Phlebotomist will arrive at the scheduled time.",
      });
    } catch (err) {
      return next(err);
    }
  }
  mem.labBookings.push(booking);
  return res.status(201).json({ success: true, data: booking, message: "Home collection booked. Phlebotomist will arrive at the scheduled time." });
});

// PATCH /api/labs/bookings/:id/status
router.patch("/bookings/:id/status", authenticate, async (req, res, next) => {
  const allowedStatuses = ["Confirmed", "Phlebotomist Assigned", "Sample Collected", "Processing in Lab", "Report Ready"];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(422).json({ success: false, error: "Invalid booking status" });
  }
  try {
    if (db.isPostgres()) {
      const result = await query(
        `UPDATE home_sample_collections b SET status = $1
         FROM patient_profiles p
         WHERE b.patient_id = p.id AND b.id = $2 AND (p.user_id = $3 OR $4 = 'admin')
         RETURNING b.*, p.user_id`,
        [req.body.status, req.params.id, req.user.id, req.user.role]
      );
      if (!result.rows[0]) return res.status(404).json({ success: false, error: "Booking not found" });
      return res.json({ success: true, data: formatBooking(result.rows[0]), message: "Status updated" });
    }
    const booking = mem.labBookings.find(item => item.id === req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
    if (booking.patientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You cannot update this booking" });
    }
    booking.status = req.body.status;
    return res.json({ success: true, data: booking, message: "Status updated" });
  } catch (err) {
    return next(err);
  }
});

function formatBooking(row) {
  if (!row) return null;
  const date = row.collection_date;
  return {
    id: row.id,
    patientId: row.user_id || row.patient_id,
    packageId: row.package_id || null,
    packageName: row.package_name,
    patientName: row.patient_name,
    sampleType: row.sample_type,
    date: date instanceof Date ? date.toISOString().split("T")[0] : String(date).split("T")[0],
    timeSlot: row.time_slot,
    address: row.address,
    fee: Number(row.fee),
    status: row.status,
    phlebotomistName: row.phlebotomist_name,
    phlebotomistPhone: row.phlebotomist_phone,
    createdAt: row.created_at,
  };
}

module.exports = router;

