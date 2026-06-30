const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error({ err }, 'Request failed');

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500
      ? 'Internal server error'
      : err.message || 'Request failed';

  return res.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;
