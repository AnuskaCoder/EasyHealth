/**
 * Authentication Controller
 * Persistent User Registration & Login via Repository Layer
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userRepository = require("../repositories/userRepository");
const patientRepository = require("../repositories/patientRepository");
const doctorRepository = require("../repositories/doctorRepository");

const activeRefreshTokens = new Set();

function generateTokenPair(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, type: "access" },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, type: "refresh", salt: Math.random().toString(36).slice(2) },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  activeRefreshTokens.add(refreshToken);
  return { accessToken, refreshToken, token: accessToken };
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
    const { email, password, name, role = "patient", phone, profileData } = req.body;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists.",
        code: 409
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await userRepository.create({
      email,
      passwordHash,
      role,
      name,
      phone
    });

    let profile = null;
    if (role === "patient") {
      profile = await patientRepository.create({
        userId: newUser.id,
        name: name || "New Patient",
        email: newUser.email,
        phone: phone || null,
        ...(profileData || {}),
      });
    } else if (role === "doctor") {
      profile = await doctorRepository.create({
        userId: newUser.id,
        name: name || "Dr. Specialist",
        email: newUser.email,
        phone: phone || null,
        ...(profileData || {}),
      });
    }

    const tokenPair = generateTokenPair(newUser);
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: tokenPair.accessToken,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: safeUser(newUser),
      profile,
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

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        code: 401
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        code: 401
      });
    }

    await userRepository.updateLastLogin(user.id);

    let profile = null;
    if (user.role === "patient") {
      profile = await patientRepository.findByUserId(user.id);
    } else if (user.role === "doctor") {
      profile = await doctorRepository.findByUserId(user.id);
    }

    const tokenPair = generateTokenPair(user);
    return res.json({
      success: true,
      message: "Login successful",
      token: tokenPair.accessToken,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: safeUser(user),
      profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        code: 404
      });
    }

    let profile = null;
    if (user.role === "patient") {
      profile = await patientRepository.findByUserId(user.id);
    } else if (user.role === "doctor") {
      profile = await doctorRepository.findByUserId(user.id);
    }

    return res.json({
      success: true,
      user: safeUser(user),
      profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
  return res.json({ success: true, message: "Logged out successfully" });
}

/**
 * POST /api/auth/refresh
 * Performs Refresh-Token Rotation: verifies old refresh token, invalidates it, issues new pair
 */
async function refreshToken(req, res, next) {
  try {
    const providedRefreshToken = req.body.refreshToken || req.headers["x-refresh-token"];
    if (providedRefreshToken && !activeRefreshTokens.has(providedRefreshToken)) {
      return res.status(401).json({
        success: false,
        error: "Invalid or already rotated refresh token. Please re-authenticate.",
        code: 401
      });
    }

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        code: 404
      });
    }

    if (providedRefreshToken) {
      activeRefreshTokens.delete(providedRefreshToken);
    }

    const newTokens = generateTokenPair(user);
    return res.json({
      success: true,
      token: newTokens.accessToken,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout, refreshToken };
