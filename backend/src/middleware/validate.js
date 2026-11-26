const { validationResult } = require("express-validator");

const runValidation = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    await validation.run(req);
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: "Validation failed",
      code: 422,
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { runValidation };
