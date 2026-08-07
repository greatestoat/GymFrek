
const { verifyAccessToken } = require('../utils/tokens');
const { query } = require('../config/db');

// Protects routes: expects "Authorization: Bearer <accessToken>".
// Never trusts anything from the client without verifying the signature.
//
// SESSION REPLACEMENT: signature + expiry alone aren't enough here. A
// session that just got replaced (user logged in elsewhere) still has a
// perfectly valid, unexpired access token for up to 15 minutes. So after
// verifying the JWT we also check the specific session (payload.sid) in the
// DB - if it's been revoked, we reject with a distinct code the frontend
// can key off to show the right message instead of a generic "logged out".
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid.' });
  }

  try {
    if (payload.sid) {
      const { rows } = await query(
        'SELECT revoked_at, revoked_reason FROM refresh_tokens WHERE id = $1',
        [payload.sid]
      );

      if (rows.length === 0 || rows[0].revoked_at) {
        const reason = rows[0]?.revoked_reason;
        return res.status(401).json({
          message:
            reason === 'replaced'
              ? 'You were signed out because your account was signed in elsewhere.'
              : 'Session expired or invalid.',
          code: reason === 'replaced' ? 'SESSION_REPLACED' : 'SESSION_REVOKED',
        });
      }
    }

    req.userId = payload.sub;
    req.userRole = payload.role || 'owner';
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;