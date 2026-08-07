const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { expireOverdueAssignments } = require('../utils/expireMemberships');

// GET /api/dues
// Splits every member in the gym into two buckets:
//   paid   - has a plan assignment that is Active and not yet past end_date
//   unpaid - either their last plan has expired, or they've never had one
// This is what backs the "who still owes us money" page.
const getDues = asyncHandler(async (req, res) => {
  const gymId = req.gymId;
  await expireOverdueAssignments(gymId);

  const [paidResult, unpaidResult] = await Promise.all([
    query(
      `SELECT m.id, m.full_name, m.mobile, m.email, m.photo_url,
              p.name AS plan_name, a.start_date, a.end_date, a.price_paid
       FROM members m
       JOIN member_plan_assignments a
         ON a.member_id = m.id AND a.status = 'Active' AND a.end_date >= CURRENT_DATE
       JOIN membership_plans p ON p.id = a.plan_id
       WHERE m.gym_id = $1
       ORDER BY a.end_date ASC`,
      [gymId]
    ),
    query(
      `SELECT m.id, m.full_name, m.mobile, m.email, m.photo_url, m.join_date,
              last.plan_name, last.end_date, last.price_paid
       FROM members m
       LEFT JOIN LATERAL (
         SELECT p.name AS plan_name, a.end_date, a.price_paid
         FROM member_plan_assignments a
         JOIN membership_plans p ON p.id = a.plan_id
         WHERE a.member_id = m.id
         ORDER BY a.end_date DESC
         LIMIT 1
       ) last ON TRUE
       WHERE m.gym_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM member_plan_assignments a2
           WHERE a2.member_id = m.id AND a2.status = 'Active' AND a2.end_date >= CURRENT_DATE
         )
       ORDER BY last.end_date ASC NULLS FIRST`,
      [gymId]
    ),
  ]);

  const paid = paidResult.rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    mobile: r.mobile,
    email: r.email,
    photoUrl: r.photo_url,
    planName: r.plan_name,
    startDate: r.start_date,
    endDate: r.end_date,
    pricePaid: Number(r.price_paid),
  }));

  const unpaid = unpaidResult.rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    mobile: r.mobile,
    email: r.email,
    photoUrl: r.photo_url,
    joinDate: r.join_date,
    lastPlanName: r.plan_name || null,
    lastEndDate: r.end_date || null,
    lastPricePaid: r.price_paid != null ? Number(r.price_paid) : null,
    reason: r.plan_name ? 'renewal_due' : 'never_subscribed',
  }));

  res.json({
    paid,
    unpaid,
    summary: {
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      collectedThisPeriod: paid.reduce((sum, m) => sum + m.pricePaid, 0),
    },
  });
});

module.exports = { getDues };
