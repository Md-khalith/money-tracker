function errorHandler(err, req, res, next) {
  // Log error on server side (without sensitive credentials)
  console.error('[Error]:', err.message || err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected server error occurred.';

  // PostgreSQL Error Codes
  if (err.code) {
    if (err.code === '23505') {
      message = 'A record with these unique details already exists.';
      return res.status(409).json({ error: message });
    }
    if (err.code === '23503') {
      message = 'Operation violates referential integrity.';
      return res.status(409).json({ error: message });
    }
    if (err.code === '28P01' || err.code === '28000') {
      message = 'Database authentication failed.';
      return res.status(500).json({ error: message });
    }
  }

  res.status(statusCode).json({
    error: message
  });
}

module.exports = errorHandler;
