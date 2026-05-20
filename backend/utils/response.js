function success(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json(data);
}

function error(res, message, statusCode = 500, details = {}) {
  return res.status(statusCode).json({
    message,
    ...details
  });
}

function createHttpError(statusCode, message, details = {}) {
  const err = new Error(message);
  err.statusCode = statusCode;
  Object.assign(err, details);
  return err;
}

module.exports = {
  success,
  error,
  createHttpError
};
