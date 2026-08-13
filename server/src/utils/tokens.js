const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = process.env;

// Short-lived access token: sent in the JSON response body, kept in memory
// on the client (never localStorage) and attached as a Bearer header.
//
// `sessionId` is the refresh_tokens row id this access token belongs to.
// Embedding it lets requireAuth() check, on every request, whether THIS
// specific session has since been revoked (e.g. because the user logged in
// elsewhere) - without it, a replaced session would stay usable for up to
// 15 minutes (its natural expiry) instead of being cut off immediately.
function signAccessToken(user, sessionId) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, sid: sessionId },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

// Long-lived refresh token: sent ONLY as an httpOnly, secure, sameSite cookie.
// JS on the client can never read it, which protects it from XSS.
function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

// We never store raw refresh tokens in the DB - only a SHA-256 hash.
// If the DB ever leaked, the tokens themselves would still be useless.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Attributes shared by both "set" and "clear" - everything EXCEPT maxAge.
// A cookie can only be cleared by the browser if these identifying
// attributes match the ones it was originally set with.
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/api/auth', // only sent to auth endpoints (refresh/logout)
  };
}

// Use when SETTING the refresh cookie.
function refreshCookieOptions() {
  const days = 7;
  return {
    ...baseCookieOptions(),
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}

// Use when CLEARING the refresh cookie. Express v5 ignores/deprecates
// maxAge on clearCookie (it always expires immediately), so we pass only
// the identifying attributes to avoid the deprecation warning.
function clearRefreshCookieOptions() {
  return baseCookieOptions();
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
};