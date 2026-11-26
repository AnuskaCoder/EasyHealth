const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "easyhealth-dev-secret-2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, name, role, phone } = req.body;

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this email already exists.", code: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      role: role || "patient",
      name,
      phone: phone || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    db.users.push(newUser);

    // Create profile stub for the new user
    if (newUser.role === "patient") {
      db.patients.push({ id: newUser.id, userId: newUser.id, name, email: newUser.email, phone: phone || null });
    } else if (newUser.role === "doctor") {
      db.doctors.push({ id: `d-${newUser.id}`, userId: newUser.id, name, email: newUser.email, phone: phone || null });
    }

    const token = generateToken(newUser);
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: safeUser(newUser),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password", code: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password", code: 401 });
    }

    user.lastLogin = new Date().toISOString();
    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
function getMe(req, res, next) {
  try {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found", code: 404 });
    }
    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
  // JWT is stateless; client should discard the token
  return res.json({ success: true, message: "Logged out successfully" });
}

/**
 * POST /api/auth/refresh
 */
function refreshToken(req, res, next) {
  try {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found", code: 404 });
    }
    const token = generateToken(user);
    return res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout, refreshToken };
