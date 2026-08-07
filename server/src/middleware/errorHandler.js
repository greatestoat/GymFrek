// Centralized error handler. Never leak stack traces or internal details
// to the client in production.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === '23505') {
    // Postgres unique_violation (e.g. duplicate email)
    return res.status(409).json({ message: 'That email is already registered.' });
  }

  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Something went wrong.';

  res.status(status).json({ message });
}

module.exports = errorHandler;
