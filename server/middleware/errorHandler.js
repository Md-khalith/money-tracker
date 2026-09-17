function errorHandler(err, req, res, next) {
  // Log full error on server side
  console.error('[Error]:', err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected server error occurred.';

  // If it's a raw SQLite error without explicit message
  if (err.code && err.code.startsWith('SQLITE')) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      message = 'A record with these unique details already exists.';
      return res.status(409).json({ error: message });
    }
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      message = 'Operation violates referential integrity.';
      return res.status(409).json({ error: message });
    }
    message = 'A database error occurred.';
  }

  res.status(statusCode).json({
    error: message
  });
}

module.exports = errorHandler;
