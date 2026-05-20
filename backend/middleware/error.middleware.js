function errorMiddleware(error, _req, res, _next) {
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    sql: error.sql
  });

  if (error.code === 'ER_NO_REFERENCED_TABLE') {
    return res.status(500).json({
      message: 'Database schema error. Please ensure the visiting_cards table is created by running the updated schema.sql',
      code: error.code
    });
  }

  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      message: error.message,
      sql: error.sql,
      code: error.code
    });
  }

  res.status(error.statusCode || 500).json({
    message: error.message || 'Unable to save enquiry.',
    code: error.code
  });
}

module.exports = errorMiddleware;
