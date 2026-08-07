const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
} = require('../utils/tokens');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    goal: row.goal,
    avatarColor: row.avatar_color,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function issueTokens(res, user, req) {
  const refreshToken = signRefreshToken(user);

  // Insert first so we get the session's row id, then embed that id (sid)
  // in the access token. This is what lets requireAuth() recognize and
  // reject this exact session later if it gets revoked/replaced.
  const { rows } = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
     RETURNING id`,
    [user.id, hashToken(refreshToken), req.headers['user-agent'] || null, req.ip]
  );

  const sessionId = rows[0].id;
  const accessToken = signAccessToken(user, sessionId);

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}

// SESSION REPLACEMENT: called at the start of login. Revokes every
// currently-active session for this user before a new one is created, so a
// login on a new device immediately invalidates any session already open
// elsewhere for that same user/role.
async function revokeActiveSessions(userId, reason) {
  await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason]
  );
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, goal, avatar_color, role, created_at`,
    [name, email, passwordHash]
  );

  const user = rows[0];
  const accessToken = await issueTokens(res, user, req);

  res.status(201).json({ user: publicUser(user), accessToken });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(
    `SELECT id, name, email, password_hash, goal, avatar_color, role, is_active, created_at,
            failed_attempts, locked_until
     FROM users WHERE email = $1`,
    [email]
  );

  // Deliberately generic message below (for both "no such user" and "wrong
  // password") so an attacker can't use this endpoint to enumerate emails.
  const genericError = { message: 'Invalid email or password.' };
  if (rows.length === 0) return res.status(401).json(genericError);

  const user = rows[0];

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    return res.status(423).json({
      message: `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
    });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    const attempts = user.failed_attempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await query(
      `UPDATE users SET failed_attempts = $1,
       locked_until = ${shouldLock ? `NOW() + INTERVAL '${LOCK_MINUTES} minutes'` : 'NULL'}
       WHERE id = $2`,
      [attempts, user.id]
    );
    return res.status(401).json(genericError);
  }

  // Successful login: reset lockout counters.
  await query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1', [
    user.id,
  ]);

  // Checked AFTER the password is verified (not before) so a wrong-password
  // attempt never reveals whether an account exists and is inactive.
  if (!user.is_active) {
    return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
  }

  // SESSION REPLACEMENT: kick out any session already active for this user
  // before creating the new one.
  await revokeActiveSessions(user.id, 'replaced');

  const accessToken = await issueTokens(res, user, req);
  res.json({ user: publicUser(user), accessToken });
});

// POST /api/auth/refresh
// Reads the httpOnly refresh cookie, verifies it against the DB (so a
// stolen-but-since-revoked token can never mint new access tokens), then
// rotates it: the old one is revoked and a brand new one is issued.
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Not authenticated.' });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  const tokenHash = hashToken(token);
  const { rows } = await query(
    `SELECT rt.id, rt.revoked_at, rt.expires_at, u.id as user_id, u.name, u.email,
            u.goal, u.avatar_color, u.role, u.is_active, u.created_at
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.user_id = $2`,
    [tokenHash, payload.sub]
  );

  if (rows.length === 0 || rows[0].revoked_at || new Date(rows[0].expires_at) < new Date()) {
    res.clearCookie('refreshToken', clearRefreshCookieOptions());
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  const record = rows[0];

  // An account can be deactivated mid-session. The short-lived access token
  // already in the browser still works until it naturally expires, but the
  // moment it tries to refresh, we cut it off here.
  if (!record.is_active) {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = $2 WHERE id = $1',
      [record.id, 'inactive']
    );
    res.clearCookie('refreshToken', clearRefreshCookieOptions());
    return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
  }

  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = $2 WHERE id = $1',
    [record.id, 'rotated']
  );

  const user = { id: record.user_id, name: record.name, email: record.email, role: record.role };
  const accessToken = await issueTokens(res, user, req);

  res.json({
    user: publicUser({ ...record, id: record.user_id }),
    accessToken,
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await query(
      "UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = 'logout' WHERE token_hash = $1",
      [hashToken(token)]
    );
  }
  res.clearCookie('refreshToken', clearRefreshCookieOptions());
  res.json({ message: 'Logged out.' });
});

module.exports = { register, login, refresh, logout };