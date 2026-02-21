const { validationResult } = require('express-validator');

/**
 * Middleware that reads the validation result set by express-validator
 * and returns a 422 with the first error if any validations failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
