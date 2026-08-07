const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { expireOverdueAssignments } = require('../utils/expireMemberships');

function publicPlan(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    planType: row.plan_type,
    durationMonths: row.duration_months,
    price: Number(row.price),
    discount: Number(row.discount),
    finalPrice: Number(row.final_price),
    features: row.features || [],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function computeFinalPrice(price, discount) {
  const final = Number(price) - Number(discount || 0);
  return final > 0 ? Number(final.toFixed(2)) : 0;
}

// GET /api/plans?type=membership|personal_training
const listPlans = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const conditions = ['gym_id = $1'];
  const params = [req.gymId];
  if (type) {
    params.push(type);
    conditions.push(`plan_type = $${params.length}`);
  }
  const { rows } = await query(
    `SELECT * FROM membership_plans WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params
  );
  res.json({ plans: rows.map(publicPlan) });
});

// GET /api/plans/:id
const getPlan = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM membership_plans WHERE id = $1 AND gym_id = $2',
    [req.params.id, req.gymId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Plan not found.' });
  res.json({ plan: publicPlan(rows[0]) });
});

// POST /api/plans
const createPlan = asyncHandler(async (req, res) => {
  const { name, description, planType, durationMonths, price, discount, features, isActive } = req.body;
  const finalPrice = computeFinalPrice(price, discount);
  const type = planType || 'membership';

  const dup = await query('SELECT id FROM membership_plans WHERE gym_id = $1 AND name = $2', [req.gymId, name]);
  if (dup.rows.length > 0) {
    return res.status(409).json({ message: 'A plan with this name already exists.' });
  }

  const { rows } = await query(
    `INSERT INTO membership_plans
      (gym_id, name, description, plan_type, duration_months, price, discount, final_price, features, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,TRUE))
     RETURNING *`,
    [req.gymId, name, description || null, type, durationMonths, price, discount || 0,
      finalPrice, features || [], isActive ?? null]
  );
  res.status(201).json({ plan: publicPlan(rows[0]) });
});

// PATCH /api/plans/:id
const updatePlan = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM membership_plans WHERE id = $1 AND gym_id = $2', [req.params.id, req.gymId]);
  if (existing.rows.length === 0) return res.status(404).json({ message: 'Plan not found.' });

  const current = existing.rows[0];
  const { name, description, planType, durationMonths, price, discount, features, isActive } = req.body;

  if (name && name !== current.name) {
    const dup = await query('SELECT id FROM membership_plans WHERE gym_id = $1 AND name = $2 AND id <> $3', [req.gymId, name, req.params.id]);
    if (dup.rows.length > 0) return res.status(409).json({ message: 'A plan with this name already exists.' });
  }

  const nextPrice = price ?? current.price;
  const nextDiscount = discount ?? current.discount;
  const finalPrice = computeFinalPrice(nextPrice, nextDiscount);

  const { rows } = await query(
    `UPDATE membership_plans SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       plan_type = COALESCE($3, plan_type),
       duration_months = COALESCE($4, duration_months),
       price = COALESCE($5, price),
       discount = COALESCE($6, discount),
       final_price = $7,
       features = COALESCE($8, features),
       is_active = COALESCE($9, is_active)
     WHERE id = $10 AND gym_id = $11
     RETURNING *`,
    [name ?? null, description ?? null, planType ?? null, durationMonths ?? null, price ?? null,
      discount ?? null, finalPrice, features ?? null, isActive ?? null, req.params.id, req.gymId]
  );
  res.json({ plan: publicPlan(rows[0]) });
});

// DELETE /api/plans/:id
const deletePlan = asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM membership_plans WHERE id = $1 AND gym_id = $2', [req.params.id, req.gymId]);
  if (rowCount === 0) return res.status(404).json({ message: 'Plan not found.' });
  res.json({ message: 'Plan deleted.' });
});

// POST /api/plans/assign
// { memberId, planId, startDate?, pricePaid?, trainerName?, trainerMobile?, trainerFee?, trainerNotes? }
//
// A member can hold ONE active assignment per plan_type at a time - e.g. one
// active Membership AND one active Personal Training assignment
// simultaneously, but not two active Memberships. Every past assignment is
// kept as history (status flips to 'Expired', row never deleted).
const assignPlan = asyncHandler(async (req, res) => {
  const { memberId, planId, startDate, pricePaid, trainerName, trainerMobile, trainerFee, trainerNotes } = req.body;

  await expireOverdueAssignments(req.gymId);

  const memberCheck = await query('SELECT id FROM members WHERE id = $1 AND gym_id = $2', [memberId, req.gymId]);
  if (memberCheck.rows.length === 0) return res.status(404).json({ message: 'Member not found.' });

  const planCheck = await query('SELECT * FROM membership_plans WHERE id = $1 AND gym_id = $2', [planId, req.gymId]);
  if (planCheck.rows.length === 0) return res.status(404).json({ message: 'Plan not found.' });
  if (!planCheck.rows[0].is_active) {
    return res.status(400).json({ message: 'This plan is inactive and cannot be assigned.' });
  }
  const plan = planCheck.rows[0];

  if (plan.plan_type === 'personal_training') {
    if (!trainerName || !trainerMobile || trainerFee === undefined || trainerFee === null || trainerFee === '') {
      return res.status(400).json({ message: 'Trainer name, mobile, and fee are required for a personal training plan.' });
    }
  }

  // Block re-assignment while a still-current assignment of the SAME
  // plan_type exists. Membership and Personal Training are tracked
  // independently, so one being active doesn't block the other.
  const activeCheck = await query(
    `SELECT a.end_date, p.name FROM member_plan_assignments a
     JOIN membership_plans p ON p.id = a.plan_id
     WHERE a.member_id = $1 AND a.status = 'Active' AND a.end_date >= CURRENT_DATE
       AND p.plan_type = $2
     LIMIT 1`,
    [memberId, plan.plan_type]
  );
  if (activeCheck.rows.length > 0) {
    const current = activeCheck.rows[0];
    const label = plan.plan_type === 'personal_training' ? 'personal training plan' : 'plan';
    return res.status(409).json({
      message: `This member already has an active "${current.name}" ${label} until ${current.end_date}. A new one can only be assigned after it expires.`,
    });
  }

  const start = startDate || new Date().toISOString().slice(0, 10);
  const price = pricePaid ?? (plan.plan_type === 'personal_training' ? trainerFee : plan.final_price);

  const { rows } = await query(
    `INSERT INTO member_plan_assignments
      (gym_id, member_id, plan_id, start_date, end_date, price_paid, status,
       trainer_name, trainer_mobile, trainer_fee, trainer_notes)
     VALUES ($1,$2,$3,$4::date, ($4::date + ($5::text || ' months')::interval)::date, $6, 'Active',
             $7,$8,$9,$10)
     RETURNING *`,
    [req.gymId, memberId, planId, start, plan.duration_months, price,
      plan.plan_type === 'personal_training' ? trainerName : null,
      plan.plan_type === 'personal_training' ? trainerMobile : null,
      plan.plan_type === 'personal_training' ? trainerFee : null,
      plan.plan_type === 'personal_training' ? (trainerNotes || null) : null]
  );
  const assignment = rows[0];

  await query(
    `INSERT INTO payments (gym_id, member_id, assignment_id, amount, payment_date)
     VALUES ($1,$2,$3,$4,$5::date)`,
    [req.gymId, memberId, assignment.id, price, start]
  );

  await query(`UPDATE members SET membership_status = 'Active' WHERE id = $1`, [memberId]);

  res.status(201).json({
    assignment: {
      id: assignment.id,
      memberId: assignment.member_id,
      planId: assignment.plan_id,
      planType: plan.plan_type,
      startDate: assignment.start_date,
      endDate: assignment.end_date,
      pricePaid: Number(assignment.price_paid),
      status: assignment.status,
      trainerName: assignment.trainer_name,
      trainerMobile: assignment.trainer_mobile,
      trainerFee: assignment.trainer_fee !== null ? Number(assignment.trainer_fee) : null,
      trainerNotes: assignment.trainer_notes,
    },
  });
});

module.exports = { listPlans, getPlan, createPlan, updatePlan, deletePlan, assignPlan };