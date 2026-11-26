const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { mem } = require("../config/database");
const router = express.Router();

// GET /api/doctors
router.get("/", (req, res) => {
  const { specialty, available, online, search } = req.query;
  let results = [...mem.doctors];
  if (specialty && specialty !== "All") results = results.filter(d => d.specialty?.toLowerCase() === specialty.toLowerCase());
  if (available === "true") results = results.filter(d => d.availableToday);
  if (online === "true") results = results.filter(d => d.isOnline);
  if (search) results = results.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) || d.specialty?.toLowerCase().includes(search.toLowerCase()));
  res.json({ success: true, count: results.length, data: results });
});

// GET /api/doctors/specialties
router.get("/specialties", (req, res) => {
  const specialties = [...new Set(mem.doctors.map(d => d.specialty).filter(Boolean))].sort();
  res.json({ success: true, data: specialties });
});

// GET /api/doctors/analytics - doctor dashboard analytics
router.get("/analytics", authenticate, requireRole("doctor"), (req, res) => {
  const doctorAppts = mem.appointments.filter(a => a.doctorId === req.user.id || a.doctorId === "d1");
  res.json({
    success: true,
    data: {
      totalAppointments: doctorAppts.length,
      todayAppointments: doctorAppts.filter(a => a.date === new Date().toISOString().split("T")[0]).length,
      completedThisMonth: doctorAppts.filter(a => a.status === "completed").length,
      pendingReports: 3,
      monthlyRevenue: doctorAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.fee || 0), 0),
      rating: 4.9,
      avgWaitTimeMins: 8,
      diseasePrevalence: [
        { disease: "Hypertension", percentage: 32 },
        { disease: "Coronary Artery Disease", percentage: 26 },
        { disease: "Arrhythmia", percentage: 18 },
        { disease: "Anemia", percentage: 14 },
        { disease: "Heart Failure", percentage: 10 },
      ],
      modalitySplit: { video: 46, inPerson: 38, emergency: 16 },
    },
  });
});

// GET /api/doctors/:id
router.get("/:id", (req, res) => {
  const doctor = mem.doctors.find(d => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ success: false, error: "Doctor not found" });
  res.json({ success: true, data: doctor });
});

// PATCH /api/doctors/:id/availability
router.patch("/:id/availability", authenticate, requireRole("doctor"), (req, res) => {
  const idx = mem.doctors.findIndex(d => d.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Doctor profile not found" });
  mem.doctors[idx] = { ...mem.doctors[idx], ...req.body };
  res.json({ success: true, data: mem.doctors[idx], message: "Availability updated" });
});

module.exports = router;

