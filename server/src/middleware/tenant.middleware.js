const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Runs after requireAuth. Looks up the gym owned by req.userId and attaches
// it to the request. Does NOT block the request if no gym exists yet - that
// is a valid state (the user hasn't registered a gym). Routes that need a
// gym to exist should be chained with `requireGym` below.
const attachGym = asyncHandler(async (req, res, next) => {
  const { rows } = await query('SELECT * FROM gyms WHERE owner_id = $1', [req.userId]);
  req.gym = rows[0] || null;
  next();
});

// Blocks any route that needs a registered gym. This is the core of the
// multi-tenant isolation guarantee: req.gymId is ALWAYS derived from the
// authenticated user's own gym record (never from a client-supplied param
// or body field), so every downstream query that filters on
// `WHERE gym_id = req.gymId` can only ever touch that owner's data.
const requireGym = [
  attachGym,
  (req, res, next) => {
    if (!req.gym) {
      return res.status(403).json({ message: 'Register your gym before accessing this resource.' });
    }
    req.gymId = req.gym.id;
    next();
  },
];

module.exports = { attachGym, requireGym };
