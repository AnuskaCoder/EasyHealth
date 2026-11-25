const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

let appointmentsDb = [
  {
    id: "APT-849102",
    doctorId: "d1",
    doctorName: "Dr. Priya Sharma",
    doctorSpecialty: "Cardiologist",
    patientId: "p1",
    patientName: "Ananya Krishnan",
    date: "2026-11-28",
    time: "11:30 AM",
    mode: "video",
    status: "upcoming",
    hospital: "Apollo Hospitals",
    fee: 1200,
    symptoms: "Occasional palpitation during workout, mild fatigue",
  },
  {
    id: "APT-619283",
    doctorId: "d5",
    doctorName: "Dr. Meera Nair",
    doctorSpecialty: "Pediatrician",
    patientId: "p1",
    patientName: "Ananya Krishnan",
    date: "2026-11-20",
    time: "3:30 PM",
    mode: "video",
    status: "completed",
    hospital: "Narayana Health City",
    fee: 900,
    notes: "Follow-up in 2 weeks. Continue Montelukast at bedtime.",
  },
];

/**
 * GET /api/appointments
 */
router.get("/", (req, res) => {
  const { status, doctorId, patientId } = req.query;
  let list = [...appointmentsDb];

  if (status) list = list.filter((a) => a.status === status);
  if (doctorId) list = list.filter((a) => a.doctorId === doctorId);
  if (patientId) list = list.filter((a) => a.patientId === patientId);

  res.json({ count: list.length, appointments: list });
});

/**
 * POST /api/appointments
 */
router.post("/", (req, res) => {
  const { doctorId, doctorName, doctorSpecialty, patientName, date, time, mode, fee, symptoms, hospital } = req.body;

  const newAppt = {
    id: `APT-${Math.floor(100000 + Math.random() * 900000)}`,
    doctorId: doctorId || "d1",
    doctorName: doctorName || "Dr. Priya Sharma",
    doctorSpecialty: doctorSpecialty || "General Physician",
    patientId: "p1",
    patientName: patientName || "Ananya Krishnan",
    date: date || new Date().toISOString().split("T")[0],
    time: time || "10:00 AM",
    mode: mode || "video",
    status: "upcoming",
    hospital: hospital || "Apollo Hospitals",
    fee: fee || 1000,
    symptoms: symptoms || "",
    createdAt: new Date().toISOString(),
  };

  appointmentsDb.unshift(newAppt);
  res.status(201).json({ message: "Appointment confirmed", appointment: newAppt });
});

/**
 * PATCH /api/appointments/:id/status
 */
router.patch("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const appt = appointmentsDb.find((a) => a.id === id);
  if (!appt) {
    return res.status(404).json({ error: "Appointment not found." });
  }

  appt.status = status;
  res.json({ message: `Appointment status updated to ${status}`, appointment: appt });
});

module.exports = router;
