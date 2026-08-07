// Runs after requireAuth. req.userRole is read straight from the verified
// JWT (see tokens.js / auth.middleware.js), so this never needs a DB round
// trip. Because role changes only take effect on the next access token
// (max 15 minutes, per JWT_ACCESS_EXPIRES_IN), demoting an admin doesn't
// revoke their current token instantly - acceptable for a short-lived
// access token, but worth knowing if you shorten/lengthen that expiry.
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = requireAdmin;
