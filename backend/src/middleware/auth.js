const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "easyhealth-dev-secret-2024";

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided. Authorization header missing.", code: 401 });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Session expired. Please log in again.", code: 401 });
    }
    return res.status(403).json({ success: false, error: "Invalid or tampered token.", code: 403 });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated", code: 401 });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: `Access denied. Required role: ${roles.join(" or ")}`, code: 403 });
  }
  next();
};

module.exports = { authenticate, requireRole };
