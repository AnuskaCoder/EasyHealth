const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const hospitals = [
  { id: "h1", name: "Apollo Hospitals", address: "21 Greams Lane, Chennai", distance: 1.2, rating: 4.8, phone: "+91-44-28290200", emergency24x7: true, ambulance: true, waitTime: 8, beds: { icu: { total: 40, available: 6 }, emergency: { total: 20, available: 3 }, private: { total: 80, available: 22 }, general: { total: 150, available: 48 } } },
  { id: "h2", name: "Fortis Healthcare", address: "Bannerghatta Road, Bangalore", distance: 2.5, rating: 4.6, phone: "+91-80-66214444", emergency24x7: true, ambulance: true, waitTime: 12, beds: { icu: { total: 30, available: 2 }, emergency: { total: 15, available: 5 }, private: { total: 60, available: 14 }, general: { total: 120, available: 31 } } },
  { id: "h3", name: "Max Super Specialty", address: "Press Enclave Road, New Delhi", distance: 3.8, rating: 4.5, phone: "+91-11-26515050", emergency24x7: true, ambulance: true, waitTime: 20, beds: { icu: { total: 25, available: 0 }, emergency: { total: 18, available: 7 }, private: { total: 70, available: 18 }, general: { total: 130, available: 55 } } },
  { id: "h4", name: "Narayana Health City", address: "Bommasandra, Bangalore", distance: 5.1, rating: 4.7, phone: "+91-80-71222222", emergency24x7: true, ambulance: true, waitTime: 15, beds: { icu: { total: 50, available: 11 }, emergency: { total: 25, available: 9 }, private: { total: 100, available: 30 }, general: { total: 200, available: 72 } } },
];

// GET /api/emergency/hospitals
router.get("/hospitals", (req, res) => {
  res.json({ success: true, data: hospitals, count: hospitals.length });
});

// POST /api/emergency/admit
router.post("/admit", (req, res) => {
  const { hospitalId, bedType, patientName, patientPhone, symptoms } = req.body;
  if (!hospitalId || !patientName || !patientPhone) {
    return res.status(422).json({ success: false, error: "hospitalId, patientName, and patientPhone are required" });
  }
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (!hospital) return res.status(404).json({ success: false, error: "Hospital not found" });

  const refId = `EH-${Math.floor(100000 + Math.random() * 900000)}`;
  res.status(201).json({
    success: true,
    data: {
      referenceId: refId,
      hospital: hospital.name,
      bedType: bedType || "Emergency",
      patientName,
      estimatedWaitMinutes: hospital.waitTime,
      message: `Emergency admission confirmed at ${hospital.name}. Reference: ${refId}`,
      admittedAt: new Date().toISOString(),
    },
  });
});

// POST /api/emergency/book-bed
router.post("/book-bed", (req, res) => {
  const { hospitalId, bedType, patientName, patientPhone, patientAge, reason } = req.body;
  if (!hospitalId || !patientName || !patientPhone || !patientAge) {
    return res.status(422).json({ success: false, error: "hospitalId, patientName, patientPhone, patientAge are required" });
  }
  const refId = `BED-${Math.floor(100000 + Math.random() * 900000)}`;
  res.status(201).json({
    success: true,
    data: {
      bookingId: refId,
      hospitalId,
      bedType: bedType || "General",
      patientName,
      status: "Confirmed",
      message: `${bedType || "General"} bed booked. Present Reference ID ${refId} at admission desk.`,
      bookedAt: new Date().toISOString(),
    },
  });
});

// GET /api/emergency/ambulance
router.get("/ambulance", (req, res) => {
  res.json({
    success: true,
    data: {
      nationalEmergency: "112",
      ambulance: "108",
      policeEmergency: "100",
      fireEmergency: "101",
      womenHelpline: "1091",
      poisonControl: "1800-11-6117",
      message: "Call 108 for free government ambulance service available 24x7",
    },
  });
});

module.exports = router;

