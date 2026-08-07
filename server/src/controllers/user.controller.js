const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

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


// GET /api/users/me
const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, email, goal, avatar_color, role, created_at FROM users WHERE id = $1`,
    [req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(rows[0]) });
});

// PATCH /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { name, goal } = req.body;

  const { rows } = await query(
    `UPDATE users SET
       name = COALESCE($1, name),
       goal = COALESCE($2, goal)
     WHERE id = $3
     RETURNING id, name, email, goal, avatar_color, role, created_at`,
    [name ?? null, goal ?? null, req.userId]
  );

  if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(rows[0]) });
});

module.exports = { getProfile, updateProfile };
