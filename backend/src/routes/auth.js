const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET, authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Mock in-memory database store for demonstration & testing
const usersDb = [
  {
    id: "u-patient-1",
    email: "ananya.k@example.com",
    passwordHash: bcrypt.hashSync("password123", 8),
    role: "patient",
    name: "Ananya Krishnan",
  },
  {
    id: "u-doctor-1",
    email: "dr.priya@apollo.com",
    passwordHash: bcrypt.hashSync("password123", 8),
    role: "doctor",
    name: "Dr. Priya Sharma",
  },
];

/**
 * POST /api/auth/register
 * Register a new Patient or Doctor with JWT issuance
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: "Email, password, role, and name are required." });
    }

    if (!["patient", "doctor", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    const existing = usersDb.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "User already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `u-${Date.now()}`,
      email,
      passwordHash,
      role,
      name,
    };
    usersDb.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user & return JWT token
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = usersDb.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or credentials." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieve current user profile via JWT token
 */
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
