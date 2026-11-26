const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mem } = require("../config/database");
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
router.get("/bookings", authenticate, (req, res) => {
  const bookings = mem.labBookings.filter(b => b.patientId === req.user.id);
  res.json({ success: true, data: bookings, count: bookings.length });
});

// POST /api/labs/book
router.post("/book", authenticate, (req, res) => {
  const { packageId, packageName, sampleType, date, timeSlot, address, fee } = req.body;
  if (!packageId || !date || !address) {
    return res.status(422).json({ success: false, error: "packageId, date, and address are required" });
  }
  const booking = {
    id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: req.user.id,
    packageId, packageName: packageName || "Lab Test",
    sampleType: sampleType || "Blood",
    date, timeSlot: timeSlot || "7:00 AM - 9:00 AM",
    address, fee: fee || 0,
    status: "Confirmed",
    phlebotomistName: "Assigned Phlebotomist",
    phlebotomistPhone: "+91 98700 00000",
    createdAt: new Date().toISOString(),
  };
  mem.labBookings.push(booking);
  res.status(201).json({ success: true, data: booking, message: "Home collection booked. Phlebotomist will arrive at the scheduled time." });
});

// PATCH /api/labs/bookings/:id/status
router.patch("/bookings/:id/status", authenticate, (req, res) => {
  const idx = mem.labBookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Booking not found" });
  mem.labBookings[idx].status = req.body.status;
  res.json({ success: true, data: mem.labBookings[idx], message: "Status updated" });
});

module.exports = router;

