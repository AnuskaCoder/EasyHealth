const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const doctorRepository = require("../repositories/doctorRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { specialty, available, online, search } = req.query;
    let results = await doctorRepository.getAll({
      specialty: specialty && specialty !== "All" ? specialty : undefined,
      availableToday: available === "true" ? true : undefined,
    });
    if (online === "true") results = results.filter(doctor => doctor.online || doctor.isOnline);
    if (search) {
      const term = String(search).toLowerCase();
      results = results.filter(doctor =>
        doctor.name?.toLowerCase().includes(term) || doctor.specialty?.toLowerCase().includes(term)
      );
    }
    return res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    return next(err);
  }
});

router.get("/specialties", async (req, res, next) => {
  try {
    const doctors = await doctorRepository.getAll();
    const specialties = [...new Set(doctors.map(doctor => doctor.specialty).filter(Boolean))].sort();
    return res.json({ success: true, data: specialties });
  } catch (err) {
    return next(err);
  }
});

router.get("/analytics", authenticate, requireRole("doctor"), async (req, res, next) => {
  try {
    const doctor = await doctorRepository.findByUserId(req.user.id);
    const appointments = await appointmentRepository.findByDoctorId(doctor?.id || req.user.id);
    const completed = appointments.filter(item => item.status === "completed");
    return res.json({
      success: true,
      data: {
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter(item => item.date === new Date().toISOString().split("T")[0]).length,
        completedThisMonth: completed.length,
        pendingReports: 0,
        monthlyRevenue: completed.reduce((sum, item) => sum + (item.fee || 0), 0),
        rating: doctor?.rating || 0,
        avgWaitTimeMins: null,
        diseasePrevalence: [],
        modalitySplit: {
          video: appointments.filter(item => item.mode === "video").length,
          inPerson: appointments.filter(item => item.mode === "in-person").length,
          emergency: appointments.filter(item => item.mode === "emergency").length,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const doctor = await doctorRepository.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, error: "Doctor not found" });
    return res.json({ success: true, data: doctor });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/availability", authenticate, requireRole("doctor"), async (req, res, next) => {
  try {
    const doctor = await doctorRepository.findByUserId(req.user.id);
    if (!doctor || (req.params.id !== doctor.id && req.params.id !== req.user.id)) {
      return res.status(404).json({ success: false, error: "Doctor profile not found" });
    }
    const updated = await doctorRepository.updateByUserId(req.user.id, req.body);
    return res.json({ success: true, data: updated, message: "Availability updated" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
