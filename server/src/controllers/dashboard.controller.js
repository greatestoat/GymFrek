const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { expireOverdueAssignments } = require('../utils/expireMemberships');

// GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const gymId = req.gymId;
  await expireOverdueAssignments(gymId);

  const [
    totals,
    revenueTotal,
    monthlyRevenue,
    newThisMonth,
    recentRegistrations,
    upcomingExpirations,
    planDistribution,
    recentActivity,
  ] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total_members,
         COUNT(*) FILTER (WHERE membership_status = 'Active')::int AS active_members,
         COUNT(*) FILTER (WHERE membership_status = 'Expired')::int AS expired_members,
         COUNT(*) FILTER (WHERE membership_status = 'Paused')::int AS paused_members
       FROM members WHERE gym_id = $1`,
      [gymId]
    ),
    query(`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE gym_id = $1`, [gymId]),
    query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments
       WHERE gym_id = $1 AND date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)`,
      [gymId]
    ),
    query(
      `SELECT COUNT(*)::int AS count FROM members
       WHERE gym_id = $1 AND date_trunc('month', join_date) = date_trunc('month', CURRENT_DATE)`,
      [gymId]
    ),
    query(
      `SELECT id, full_name, join_date, membership_status, photo_url
       FROM members WHERE gym_id = $1 ORDER BY join_date DESC, created_at DESC LIMIT 8`,
      [gymId]
    ),
    query(
      `SELECT a.id, a.end_date, m.id AS member_id, m.full_name, m.mobile, p.name AS plan_name
       FROM member_plan_assignments a
       JOIN members m ON m.id = a.member_id
       JOIN membership_plans p ON p.id = a.plan_id
       WHERE a.gym_id = $1 AND a.status = 'Active'
         AND a.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       ORDER BY a.end_date ASC LIMIT 10`,
      [gymId]
    ),
    query(
      `SELECT p.id AS plan_id, p.name AS plan_name, COUNT(a.id)::int AS member_count
       FROM membership_plans p
       LEFT JOIN member_plan_assignments a ON a.plan_id = p.id AND a.status = 'Active'
       WHERE p.gym_id = $1
       GROUP BY p.id, p.name
       ORDER BY member_count DESC`,
      [gymId]
    ),
    query(
      `(SELECT 'member_joined' AS type, m.id AS ref_id, m.full_name AS label, m.created_at AS occurred_at
        FROM members m WHERE m.gym_id = $1 ORDER BY m.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'payment_received' AS type, pay.id AS ref_id, m.full_name AS label, pay.created_at AS occurred_at
        FROM payments pay JOIN members m ON m.id = pay.member_id
        WHERE pay.gym_id = $1 ORDER BY pay.created_at DESC LIMIT 5)
       ORDER BY occurred_at DESC LIMIT 8`,
      [gymId]
    ),
  ]);

  // Last 6 months of revenue, for the trend chart.
  const { rows: trendRows } = await query(
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
  );

  const t = totals.rows[0];

  res.json({
    totals: {
      totalMembers: t.total_members,
      activeMembers: t.active_members,
      expiredMembers: t.expired_members,
      pausedMembers: t.paused_members,
    },
    revenue: {
      total: Number(revenueTotal.rows[0].total),
      thisMonth: Number(monthlyRevenue.rows[0].total),
    },
    newMembersThisMonth: newThisMonth.rows[0].count,
    recentRegistrations: recentRegistrations.rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      joinDate: r.join_date,
      membershipStatus: r.membership_status,
      photoUrl: r.photo_url,
    })),
    upcomingExpirations: upcomingExpirations.rows.map((r) => ({
      assignmentId: r.id,
      memberId: r.member_id,
      fullName: r.full_name,
      mobile: r.mobile,
      planName: r.plan_name,
      endDate: r.end_date,
    })),
    planDistribution: planDistribution.rows.map((r) => ({
      planId: r.plan_id,
      planName: r.plan_name,
      memberCount: r.member_count,
    })),
    recentActivity: recentActivity.rows.map((r) => ({
      type: r.type,
      refId: r.ref_id,
      label: r.label,
      occurredAt: r.occurred_at,
    })),
    revenueTrend: trendRows.map((r) => ({ month: r.label, revenue: Number(r.revenue) })),
  });
});

module.exports = { getSummary };
