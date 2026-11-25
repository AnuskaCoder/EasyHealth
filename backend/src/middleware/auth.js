const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "easyhealth-jwt-secret-key-2026-supersecure";

/**
 * Verify JWT Token Middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or Expired Token" });
    }
    req.user = user;
    next();
  });
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {string[]} allowedRoles - Array of allowed roles: 'patient', 'doctor', 'admin'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Forbidden: Required role '${allowedRoles.join(" or ")}', your role is '${
          req.user ? req.user.role : "unauthenticated"
        }'`,
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET,
};
