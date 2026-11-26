const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR ${err.status || 500}: ${err.message}`);
  if (process.env.NODE_ENV === "development") console.error(err.stack);

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, error: "Invalid token", code: 401 });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, error: "Token expired, please log in again", code: 401 });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(422).json({ success: false, error: err.message, code: 422 });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && statusCode === 500
    ? "Internal server error"
    : err.message || "Something went wrong";

  res.status(statusCode).json({ success: false, error: message, code: statusCode });
};

module.exports = errorHandler;
