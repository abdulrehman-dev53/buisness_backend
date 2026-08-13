const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Runs after an array of express-validator check()/body() rules.
 * If any validation failed, responds with 400 and a list of field errors.
 * Otherwise passes control to the next handler.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));

    return sendError(res, 400, 'Validation failed', formatted);
  }

  next();
};

module.exports = validate;
