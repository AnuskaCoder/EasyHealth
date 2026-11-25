const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const doctorsCatalog = [
  { id: "d1", name: "Dr. Priya Sharma", specialty: "Cardiologist", experience: 18, hospital: "Apollo Hospitals", rating: 4.9, reviewCount: 1240, consultFee: 1200, emergencyFee: 2500, availableToday: true, online: true, languages: ["English", "Hindi", "Tamil"] },
  { id: "d2", name: "Dr. Arjun Mehta", specialty: "Neurologist", experience: 14, hospital: "Apollo Hospitals", rating: 4.7, reviewCount: 892, consultFee: 1000, emergencyFee: 2200, availableToday: true, online: false, languages: ["English", "Hindi"] },
  { id: "d3", name: "Dr. Sunita Rao", specialty: "Orthopedic Surgeon", experience: 22, hospital: "Fortis Healthcare", rating: 4.8, reviewCount: 1560, consultFee: 1500, emergencyFee: 3000, availableToday: false, online: false, languages: ["English", "Kannada"] },
  { id: "d4", name: "Dr. Rahul Kapoor", specialty: "Emergency Medicine", experience: 10, hospital: "Max Super Specialty", rating: 4.6, reviewCount: 643, consultFee: 800, emergencyFee: 1800, availableToday: true, online: true, languages: ["English", "Hindi"] },
  { id: "d5", name: "Dr. Meera Nair", specialty: "Pediatrician", experience: 16, hospital: "Narayana Health City", rating: 4.9, reviewCount: 2100, consultFee: 900, emergencyFee: 2000, availableToday: true, online: true, languages: ["English", "Malayalam", "Hindi"] },
  { id: "d7", name: "Dr. Kavitha Reddy", specialty: "Dermatologist", experience: 12, hospital: "Apollo Hospitals", rating: 4.8, reviewCount: 1420, consultFee: 800, emergencyFee: 1500, availableToday: true, online: true, languages: ["English", "Telugu"] },
];

/**
 * GET /api/doctors
 */
router.get("/", (req, res) => {
  const { specialty, availableToday } = req.query;
  let results = [...doctorsCatalog];

  if (specialty && specialty !== "All") {
    results = results.filter((d) => d.specialty.toLowerCase() === specialty.toLowerCase());
  }
  if (availableToday === "true") {
    results = results.filter((d) => d.availableToday);
  }

  res.json({ count: results.length, doctors: results });
});

/**
 * GET /api/doctors/analytics
 */
router.get("/analytics", (req, res) => {
  res.json({
    monthlyConsultations: 148,
    netRevenue: 184000,
    satisfactionRating: 4.9,
    avgWaitTimeMinutes: 6.5,
    diseasePrevalence: [
      { disease: "Essential Hypertension", percentage: 32 },
      { disease: "Coronary Artery Disease", percentage: 26 },
      { disease: "Arrhythmia & Palpitations", percentage: 18 },
      { disease: "Nutritional Anemia & Fatigue", percentage: 14 },
      { disease: "Congestive Heart Failure", percentage: 10 },
    ],
    modalitySplit: {
      telehealthVideo: 46,
      hospitalInPerson: 38,
      emergencyTriage: 16,
    },
  });
});

module.exports = router;
