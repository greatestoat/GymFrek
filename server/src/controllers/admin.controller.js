const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { expireOverdueAssignments } = require('../utils/expireMemberships');

const SALT_ROUNDS = 12;

// GET /api/admin/overview
// Platform-wide totals for the admin landing page.
const getOverview = asyncHandler(async (req, res) => {
  const [owners, members, revenue] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE is_active)::int AS active,
              COUNT(*) FILTER (WHERE NOT is_active)::int AS inactive
       FROM users WHERE role = 'owner'`
    ),
    query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE membership_status = 'Active')::int AS active
       FROM members`
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total,
              COALESCE(SUM(amount) FILTER (
                WHERE date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)
              ), 0)::numeric AS this_month
       FROM payments`
    ),
  ]);

  const gymsRegistered = await query('SELECT COUNT(*)::int AS total FROM gyms');

  res.json({
    totalGyms: gymsRegistered.rows[0].total,
    owners: {
      total: owners.rows[0].total,
      active: owners.rows[0].active,
      inactive: owners.rows[0].inactive,
    },
    members: {
      total: members.rows[0].total,
      active: members.rows[0].active,
    },
    revenue: {
      total: Number(revenue.rows[0].total),
      thisMonth: Number(revenue.rows[0].this_month),
    },
  });
});

// GET /api/admin/gyms
// One row per registered gym, with its owner and a revenue/member rollup.
// This is the main "who's registered" table.
const listGyms = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT
       g.id AS gym_id, g.name AS gym_name, g.city, g.state, g.created_at,
       u.id AS owner_id, u.name AS owner_name, u.email AS owner_email,
       u.is_active AS owner_active,
       COALESCE(mc.total, 0)::int AS member_count,
       COALESCE(mc.active, 0)::int AS active_member_count,
       COALESCE(rv.total, 0)::numeric AS revenue_total,
       COALESCE(rv.this_month, 0)::numeric AS revenue_this_month
     FROM gyms g
     JOIN users u ON u.id = g.owner_id
     LEFT JOIN (
       SELECT gym_id, COUNT(*) AS total,
              COUNT(*) FILTER (WHERE membership_status = 'Active') AS active
       FROM members GROUP BY gym_id
     ) mc ON mc.gym_id = g.id
     LEFT JOIN (
       SELECT gym_id, SUM(amount) AS total,
              SUM(amount) FILTER (
                WHERE date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)
              ) AS this_month
       FROM payments GROUP BY gym_id
     ) rv ON rv.gym_id = g.id
     ORDER BY g.created_at DESC`
  );

  res.json({
    gyms: rows.map((r) => ({
      gymId: r.gym_id,
      gymName: r.gym_name,
      city: r.city,
      state: r.state,
      createdAt: r.created_at,
      owner: { id: r.owner_id, name: r.owner_name, email: r.owner_email, isActive: r.owner_active },
      memberCount: r.member_count,
      activeMemberCount: r.active_member_count,
      revenue: { total: Number(r.revenue_total), thisMonth: Number(r.revenue_this_month) },
    })),
  });
});

// GET /api/admin/gyms/:gymId
// Full drill-down: gym + owner details, every member with their current
// plan, every plan the gym offers, and a 6-month revenue trend. This is
// read-only for admins - it never writes to a gym's data.
const getGymDetail = asyncHandler(async (req, res) => {
  const { gymId } = req.params;

  const gymResult = await query(
    `SELECT g.*, u.name AS owner_full_name, u.email AS owner_email, u.is_active AS owner_active,
            u.id AS owner_id
     FROM gyms g JOIN users u ON u.id = g.owner_id
     WHERE g.id = $1`,
    [gymId]
  );
  if (gymResult.rows.length === 0) return res.status(404).json({ message: 'Gym not found.' });
  const gym = gymResult.rows[0];

  await expireOverdueAssignments(gymId);

  const [members, plans, revenueTotal, trend, personalTraining] = await Promise.all([
    query(
      `SELECT m.id, m.full_name, m.mobile, m.membership_status, m.join_date,
              p.name AS active_plan_name, a.end_date AS active_plan_end_date
       FROM members m
       LEFT JOIN LATERAL (
         SELECT * FROM member_plan_assignments a
         WHERE a.member_id = m.id AND a.status = 'Active'
         ORDER BY a.end_date DESC LIMIT 1
       ) a ON TRUE
       LEFT JOIN membership_plans p ON p.id = a.plan_id
       WHERE m.gym_id = $1
       ORDER BY m.created_at DESC`,
      [gymId]
    ),
    query(
      `SELECT p.id, p.name, p.duration_months, p.final_price, p.is_active,
              COUNT(a.id) FILTER (WHERE a.status = 'Active')::int AS active_member_count
       FROM membership_plans p
       LEFT JOIN member_plan_assignments a ON a.plan_id = p.id
       WHERE p.gym_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [gymId]
    ),
    query('SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE gym_id = $1', [gymId]),
    query(
      `SELECT to_char(month, 'Mon YYYY') AS label, COALESCE(sum, 0)::numeric AS revenue
       FROM generate_series(
         date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
         date_trunc('month', CURRENT_DATE),
         INTERVAL '1 month'
       ) AS month
       LEFT JOIN (
         SELECT date_trunc('month', payment_date) AS month, SUM(amount) AS sum
         FROM payments WHERE gym_id = $1
         GROUP BY date_trunc('month', payment_date)
       ) p USING (month)
       ORDER BY month ASC`,
      [gymId]
    ),
    query(
      `SELECT a.id AS assignment_id, m.id AS member_id, m.full_name, m.mobile,
              p.name AS plan_name, a.trainer_name, a.trainer_mobile, a.trainer_fee,
              a.start_date, a.end_date, a.status
       FROM member_plan_assignments a
       JOIN membership_plans p ON p.id = a.plan_id
       JOIN members m ON m.id = a.member_id
       WHERE a.gym_id = $1 AND p.plan_type = 'personal_training'
       ORDER BY a.created_at DESC`,
      [gymId]
    ),
  ]);

  res.json({
    gym: {
      id: gym.id,
      name: gym.name,
      city: gym.city,
      state: gym.state,
      mobile: gym.mobile,
      email: gym.email,
      address: gym.address,
      openingTime: gym.opening_time,
      closingTime: gym.closing_time,
      createdAt: gym.created_at,
    },
    owner: {
      id: gym.owner_id,
      name: gym.owner_full_name,
      email: gym.owner_email,
      isActive: gym.owner_active,
    },
    members: members.rows.map((m) => ({
      id: m.id,
      fullName: m.full_name,
      mobile: m.mobile,
      membershipStatus: m.membership_status,
      joinDate: m.join_date,
      activePlanName: m.active_plan_name,
      activePlanEndDate: m.active_plan_end_date,
    })),
    plans: plans.rows.map((p) => ({
      id: p.id,
      name: p.name,
      durationMonths: p.duration_months,
      finalPrice: Number(p.final_price),
      isActive: p.is_active,
      activeMemberCount: p.active_member_count,
    })),
    personalTraining: personalTraining.rows.map((r) => ({
      assignmentId: r.assignment_id,
      memberId: r.member_id,
      memberName: r.full_name,
      memberMobile: r.mobile,
      planName: r.plan_name,
      trainerName: r.trainer_name,
      trainerMobile: r.trainer_mobile,
      trainerFee: r.trainer_fee !== null ? Number(r.trainer_fee) : null,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
    })),
    revenue: {
      total: Number(revenueTotal.rows[0].total),
      trend: trend.rows.map((r) => ({ month: r.label, revenue: Number(r.revenue) })),
    },
  });
});

// PATCH /api/admin/owners/:ownerId/status  { isActive: boolean }
// Activates/deactivates a gym owner's login. Deactivating also revokes all
// of their live refresh tokens immediately, so they're cut off the next
// time their (short-lived) access token needs renewing - not waiting for
// their 7-day session to naturally expire.
const setOwnerStatus = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;
  const { isActive } = req.body;

  const owner = await query(`SELECT id, role FROM users WHERE id = $1`, [ownerId]);
  if (owner.rows.length === 0) return res.status(404).json({ message: 'Owner not found.' });
  if (owner.rows[0].role !== 'owner') {
    return res.status(400).json({ message: 'Only gym-owner accounts can be managed here.' });
  }

  await query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, ownerId]);

  if (!isActive) {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [ownerId]
    );
  }

  res.json({ message: isActive ? 'Account activated.' : 'Account deactivated.' });
});

// PATCH /api/admin/owners/:ownerId/password  { newPassword }
// Admin-initiated password reset - no knowledge of the old password
// required. Also revokes all existing sessions so a compromised/shared
// password can't keep being used after the reset.
const setOwnerPassword = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;
  const { newPassword } = req.body;

  const owner = await query(`SELECT id, role FROM users WHERE id = $1`, [ownerId]);
  if (owner.rows.length === 0) return res.status(404).json({ message: 'Owner not found.' });
  if (owner.rows[0].role !== 'owner') {
    return res.status(400).json({ message: 'Only gym-owner accounts can be managed here.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query(
    'UPDATE users SET password_hash = $1, failed_attempts = 0, locked_until = NULL WHERE id = $2',
    [passwordHash, ownerId]
  );
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [ownerId]
  );

  res.json({ message: 'Password updated. The owner has been logged out everywhere.' });
});

// GET /api/admin/personal-training
// List personal-training assignments across all gyms for the admin screen.
const listPersonalTraining = asyncHandler(async (req, res) => {
  const statusFilter = req.query.status ? String(req.query.status) : null;

  const { rows } = await query(
    `SELECT a.id AS assignment_id,
            g.id AS gym_id,
            g.name AS gym_name,
            m.id AS member_id,
            m.full_name AS member_name,
            m.mobile AS member_mobile,
            p.name AS plan_name,
            a.trainer_name,
            a.trainer_mobile,
            a.trainer_fee,
            a.start_date,
            a.end_date,
            a.status,
            a.created_at
     FROM member_plan_assignments a
     JOIN membership_plans p ON p.id = a.plan_id
     JOIN members m ON m.id = a.member_id
     JOIN gyms g ON g.id = a.gym_id
     WHERE p.plan_type = 'personal_training'
       AND ($1::text IS NULL OR a.status = $1)
     ORDER BY a.created_at DESC`,
    [statusFilter]
  );

  res.json({
    registrations: rows.map((row) => ({
      assignmentId: row.assignment_id,
      gymId: row.gym_id,
      gymName: row.gym_name,
      memberId: row.member_id,
      memberName: row.member_name,
      memberMobile: row.member_mobile,
      planName: row.plan_name,
      trainerName: row.trainer_name,
      trainerMobile: row.trainer_mobile,
      trainerFee: row.trainer_fee !== null ? Number(row.trainer_fee) : null,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      createdAt: row.created_at,
    })),
  });
});

module.exports = {
  getOverview,
  listGyms,
  getGymDetail,
  setOwnerStatus,
  setOwnerPassword,
  listPersonalTraining,
};
