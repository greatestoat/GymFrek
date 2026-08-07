const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { toPublicUrl } = require('../utils/upload');

function publicGym(row) {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.owner_name,
    mobile: row.mobile,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    logoUrl: row.logo_url,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/gym/me
// Tells the client whether the logged-in user already has a gym. Used right
// after login to decide: show the registration wizard, or go to dashboard.
const getMyGym = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM gyms WHERE owner_id = $1', [req.userId]);
  if (rows.length === 0) return res.json({ gym: null });
  res.json({ gym: publicGym(rows[0]) });
});

// POST /api/gym
// A user can register only one gym - enforced both here (explicit check,
// so we can return a friendly 409) and at the DB level (UNIQUE owner_id, so
// it's safe even under a race condition).
const registerGym = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM gyms WHERE owner_id = $1', [req.userId]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'You have already registered a gym.' });
  }

  const {
    name, ownerName, mobile, email, address, city, state, pincode,
    openingTime, closingTime, description,
  } = req.body;

  const nameTaken = await query('SELECT id FROM gyms WHERE name = $1', [name]);
  if (nameTaken.rows.length > 0) {
    return res.status(409).json({ message: 'That gym name is already taken.' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO gyms
        (owner_id, name, owner_name, mobile, email, address, city, state, pincode,
         opening_time, closing_time, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.userId, name, ownerName, mobile, email, address, city, state, pincode,
        openingTime, closingTime, description || null]
    );
    res.status(201).json({ gym: publicGym(rows[0]) });
  } catch (err) {
    // 23505 = unique_violation (race on owner_id or name uniqueness)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'You already registered a gym, or the gym name is taken.' });
    }
    throw err;
  }
});

// PATCH /api/gym
// Owner-only edit of their own gym. req.gymId is derived from the
// authenticated session (see tenant.middleware), never from the request
// body, so there is no way to target another gym's row.
const updateGym = asyncHandler(async (req, res) => {
  const {
    name, ownerName, mobile, email, address, city, state, pincode,
    openingTime, closingTime, description,
  } = req.body;

  if (name) {
    const nameTaken = await query('SELECT id FROM gyms WHERE name = $1 AND id <> $2', [name, req.gymId]);
    if (nameTaken.rows.length > 0) {
      return res.status(409).json({ message: 'That gym name is already taken.' });
    }
  }

  const { rows } = await query(
    `UPDATE gyms SET
       name = COALESCE($1, name),
       owner_name = COALESCE($2, owner_name),
       mobile = COALESCE($3, mobile),
       email = COALESCE($4, email),
       address = COALESCE($5, address),
       city = COALESCE($6, city),
       state = COALESCE($7, state),
       pincode = COALESCE($8, pincode),
       opening_time = COALESCE($9, opening_time),
       closing_time = COALESCE($10, closing_time),
       description = COALESCE($11, description)
     WHERE id = $12
     RETURNING *`,
    [name ?? null, ownerName ?? null, mobile ?? null, email ?? null, address ?? null,
      city ?? null, state ?? null, pincode ?? null, openingTime ?? null, closingTime ?? null,
      description ?? null, req.gymId]
  );

  res.json({ gym: publicGym(rows[0]) });
});

// POST /api/gym/logo  (multipart/form-data, field name "logo")
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });

  const logoUrl = toPublicUrl('gym-logos', req.file.filename);
  const { rows } = await query(
    'UPDATE gyms SET logo_url = $1 WHERE id = $2 RETURNING *',
    [logoUrl, req.gymId]
  );
  res.json({ gym: publicGym(rows[0]) });
});

module.exports = { getMyGym, registerGym, updateGym, uploadLogo };
