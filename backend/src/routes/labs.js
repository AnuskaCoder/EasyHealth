const express = require("express");

const router = express.Router();

const labPackages = [
  { id: "l11", name: "Full Body Checkup - Basic", category: "Health Packages", price: 2999, discountPct: 50, finalPrice: 1499, homeCollection: true, reportTime: "24 hours", includes: ["CBC", "Blood Sugar Fasting", "Lipid Profile", "LFT", "KFT", "Thyroid TSH", "Urine Routine"] },
  { id: "l12", name: "Full Body Checkup - Comprehensive", category: "Health Packages", price: 5999, discountPct: 55, finalPrice: 2699, homeCollection: true, reportTime: "48 hours", includes: ["Everything in Basic", "Vitamin B12 & D", "HbA1c", "Iron Profile", "CRP", "ECG", "Doctor Teleconsult"] },
  { id: "l1", name: "Complete Blood Count (CBC)", category: "Blood Tests", price: 350, discountPct: 30, finalPrice: 245, homeCollection: true, reportTime: "6 hours" },
  { id: "l5", name: "Urine Routine & Microscopy", category: "Urine Tests", price: 180, discountPct: 10, finalPrice: 162, homeCollection: true, reportTime: "4 hours" },
];

let homeBookingsDb = [
  {
    id: "HC-7712",
    packageName: "Full Body Checkup - Basic (Blood & Urine)",
    patientName: "Ananya Krishnan",
    sampleType: "Blood & Urine",
    date: "2026-11-29",
    timeSlot: "7:00 AM - 8:00 AM",
    address: "Flat 402, Green Glen Layout, Bellandur, Bangalore",
    fee: 1499,
    status: "Phlebotomist Assigned",
    phlebotomistName: "Ramesh Patil",
    phlebotomistPhone: "+91 98451 22334",
  },
];

/**
 * GET /api/labs/packages
 */
router.get("/packages", (req, res) => {
  res.json({ count: labPackages.length, packages: labPackages });
});

/**
 * POST /api/labs/home-collection
 */
router.post("/home-collection", (req, res) => {
  const { packageName, patientName, sampleType, date, timeSlot, address, fee } = req.body;

  const newBooking = {
    id: `HC-${Math.floor(1000 + Math.random() * 9000)}`,
    packageName: packageName || "Full Body Checkup",
    patientName: patientName || "Patient",
    sampleType: sampleType || "Blood & Urine",
    date: date || new Date().toISOString().split("T")[0],
    timeSlot: timeSlot || "7:00 AM - 8:00 AM",
    address: address || "Registered Address",
    fee: fee || 1499,
    status: "Confirmed",
    phlebotomistName: "Sanjay Verma (Certified Phlebotomist)",
    phlebotomistPhone: "+91 97120 44556",
    createdAt: new Date().toISOString(),
  };

  homeBookingsDb.unshift(newBooking);
  res.status(201).json({ message: "Home sample collection scheduled successfully", booking: newBooking });
});

module.exports = router;
