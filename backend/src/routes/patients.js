const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { encryptPHI, decryptPHI } = require("../middleware/encryption");

const router = express.Router();

let currentPatient = {
  id: "p1",
  name: "Ananya Krishnan",
  age: 28,
  gender: "Female",
  dob: "1996-03-15",
  phone: "+91 98765 43210",
  email: "ananya.k@example.com",
  bloodGroup: "B+",
  height: 164,
  weight: 58,
  allergies: ["Penicillin", "Dust Mites"],
  chronicConditions: ["Mild Bronchial Asthma"],
  emergencyContact: "+91 98765 00000 (Rohan Krishnan - Brother)",
  address: "Flat 402, Green Glen Layout, Bellandur, Bangalore 560103",
  encryptedPhi: encryptPHI({
    allergies: ["Penicillin", "Dust Mites"],
    chronicConditions: ["Mild Bronchial Asthma"],
    ssn_id: "IND-BLR-849102",
  }),
};

/**
 * GET /api/patients/profile
 */
router.get("/profile", authenticateToken, (req, res) => {
  res.json({ patient: currentPatient });
});

/**
 * PUT /api/patients/profile
 */
router.put("/profile", authenticateToken, (req, res) => {
  const updates = req.body;
  currentPatient = {
    ...currentPatient,
    ...updates,
    encryptedPhi: encryptPHI({
      allergies: updates.allergies || currentPatient.allergies,
      chronicConditions: updates.chronicConditions || currentPatient.chronicConditions,
      updated_at: new Date().toISOString(),
    }),
  };
  res.json({ message: "Profile updated successfully", patient: currentPatient });
});

/**
 * GET /api/patients/vault/inspect
 * Demo endpoint to inspect raw ciphertext vs decrypted plaintext
 */
router.get("/vault/inspect", authenticateToken, (req, res) => {
  res.json({
    algorithm: "AES-256-GCM",
    rawCiphertext: currentPatient.encryptedPhi,
    decryptedData: decryptPHI(currentPatient.encryptedPhi),
  });
});

module.exports = router;
