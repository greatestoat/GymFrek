const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { toPublicUrl } = require('../utils/upload');
const { expireOverdueAssignments } = require('../utils/expireMemberships');

function publicMember(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    mobile: row.mobile,
    email: row.email,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    address: row.address,
    emergencyContact: row.emergency_contact,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    medicalNotes: row.medical_notes,
    joinDate: row.join_date,
    membershipStatus: row.membership_status,
    photoUrl: row.photo_url,
    activePlanName: row.active_plan_name ?? null,
    activePlanEndDate: row.active_plan_end_date ?? null,
    activePlanFee: row.active_plan_fee ?? null,
    activeTrainingPlanName: row.active_training_plan_name ?? null,
    activeTrainingPlanEndDate: row.active_training_plan_end_date ?? null,
    activeTrainingTrainerName: row.active_training_trainer_name ?? null,
    createdAt: row.created_at,
  };
}

const SORT_COLUMNS = {
  name: 'm.full_name',
  joinDate: 'm.join_date',
  fee: 'active_plan_fee',
};

// GET /api/members?search=&status=&planId=&joinFrom=&joinTo=&sortBy=&sortDir=&page=&limit=
const listMembers = asyncHandler(async (req, res) => {
  await expireOverdueAssignments(req.gymId);

  const {
    search, status, planId, joinFrom, joinTo,
    sortBy = 'joinDate', sortDir = 'desc',
    page = '1', limit = '20',
  } = req.query;

  const conditions = ['m.gym_id = $1'];
  const params = [req.gymId];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(m.full_name ILIKE $${params.length} OR m.mobile ILIKE $${params.length} OR m.email ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`m.membership_status = $${params.length}`);
  }
  if (joinFrom) {
    params.push(joinFrom);
    conditions.push(`m.join_date >= $${params.length}`);
  }
  if (joinTo) {
    params.push(joinTo);
    conditions.push(`m.join_date <= $${params.length}`);
  }
  if (planId) {
    params.push(planId);
    conditions.push(`EXISTS (
      SELECT 1 FROM member_plan_assignments a
      WHERE a.member_id = m.id AND a.plan_id = $${params.length} AND a.status = 'Active'
    )`);
  }

  const sortCol = SORT_COLUMNS[sortBy] || SORT_COLUMNS.joinDate;
  const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNum - 1) * pageSize;

  const whereClause = conditions.join(' AND ');

  const dataSql = `
    SELECT m.*, p.name AS active_plan_name, a.end_date AS active_plan_end_date,
           a.price_paid AS active_plan_fee
           ,
           pt_p.name AS active_training_plan_name, pt_a.end_date AS active_training_plan_end_date,
           pt_a.trainer_name AS active_training_trainer_name
    FROM members m
    LEFT JOIN LATERAL (
      SELECT a.* FROM member_plan_assignments a
      JOIN membership_plans p ON p.id = a.plan_id
      WHERE a.member_id = m.id AND a.status = 'Active' AND p.plan_type = 'membership'
      ORDER BY a.end_date DESC LIMIT 1
    ) a ON TRUE
    LEFT JOIN membership_plans p ON p.id = a.plan_id
    LEFT JOIN LATERAL (
      SELECT a.* FROM member_plan_assignments a
      JOIN membership_plans p ON p.id = a.plan_id
      WHERE a.member_id = m.id AND a.status = 'Active' AND p.plan_type = 'personal_training'
      ORDER BY a.end_date DESC LIMIT 1
    ) pt_a ON TRUE
    LEFT JOIN membership_plans pt_p ON pt_p.id = pt_a.plan_id
    WHERE ${whereClause}
    ORDER BY ${sortCol} ${dir} NULLS LAST
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const countSql = `SELECT COUNT(*)::int AS total FROM members m WHERE ${whereClause}`;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(dataSql, [...params, pageSize, offset]),
    query(countSql, params),
  ]);

  res.json({
    members: rows.map(publicMember),
    pagination: {
      page: pageNum,
      limit: pageSize,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / pageSize) || 1,
    },
  });
});

// GET /api/members/:id
const getMember = asyncHandler(async (req, res) => {
  await expireOverdueAssignments(req.gymId);

  const { rows } = await query(
    `SELECT m.*, p.name AS active_plan_name, a.end_date AS active_plan_end_date,
            a.price_paid AS active_plan_fee
           ,
           pt_p.name AS active_training_plan_name, pt_a.end_date AS active_training_plan_end_date,
           pt_a.trainer_name AS active_training_trainer_name
     FROM members m
     LEFT JOIN LATERAL (
       SELECT a.* FROM member_plan_assignments a
       JOIN membership_plans p ON p.id = a.plan_id
       WHERE a.member_id = m.id AND a.status = 'Active' AND p.plan_type = 'membership'
       ORDER BY a.end_date DESC LIMIT 1
     ) a ON TRUE
     LEFT JOIN membership_plans p ON p.id = a.plan_id
     LEFT JOIN LATERAL (
       SELECT a.* FROM member_plan_assignments a
       JOIN membership_plans p ON p.id = a.plan_id
       WHERE a.member_id = m.id AND a.status = 'Active' AND p.plan_type = 'personal_training'
       ORDER BY a.end_date DESC LIMIT 1
     ) pt_a ON TRUE
     LEFT JOIN membership_plans pt_p ON pt_p.id = pt_a.plan_id
     WHERE m.id = $1 AND m.gym_id = $2`,
    [req.params.id, req.gymId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Member not found.' });
  res.json({ member: publicMember(rows[0]) });
});

// POST /api/members
const createMember = asyncHandler(async (req, res) => {
  const {
    fullName, mobile, email, gender, dateOfBirth, address, emergencyContact,
    heightCm, weightKg, medicalNotes, joinDate, membershipStatus,
  } = req.body;

  const { rows } = await query(
    `INSERT INTO members
      (gym_id, full_name, mobile, email, gender, date_of_birth, address, emergency_contact,
       height_cm, weight_kg, medical_notes, join_date, membership_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12, CURRENT_DATE),COALESCE($13,'Active'))
     RETURNING *`,
    [req.gymId, fullName, mobile, email || null, gender || null, dateOfBirth || null,
      address || null, emergencyContact || null, heightCm ?? null, weightKg ?? null,
      medicalNotes || null, joinDate || null, membershipStatus || null]
  );
  res.status(201).json({ member: publicMember(rows[0]) });
});

// PATCH /api/members/:id
const updateMember = asyncHandler(async (req, res) => {
  const owns = await query('SELECT id FROM members WHERE id = $1 AND gym_id = $2', [req.params.id, req.gymId]);
  if (owns.rows.length === 0) return res.status(404).json({ message: 'Member not found.' });

  const {
    fullName, mobile, email, gender, dateOfBirth, address, emergencyContact,
    heightCm, weightKg, medicalNotes, joinDate, membershipStatus,
  } = req.body;

  const { rows } = await query(
    `UPDATE members SET
       full_name = COALESCE($1, full_name),
       mobile = COALESCE($2, mobile),
       email = COALESCE($3, email),
       gender = COALESCE($4, gender),
       date_of_birth = COALESCE($5, date_of_birth),
       address = COALESCE($6, address),
       emergency_contact = COALESCE($7, emergency_contact),
       height_cm = COALESCE($8, height_cm),
       weight_kg = COALESCE($9, weight_kg),
       medical_notes = COALESCE($10, medical_notes),
       join_date = COALESCE($11, join_date),
       membership_status = COALESCE($12, membership_status)
     WHERE id = $13 AND gym_id = $14
     RETURNING *`,
    [fullName ?? null, mobile ?? null, email ?? null, gender ?? null, dateOfBirth ?? null,
      address ?? null, emergencyContact ?? null, heightCm ?? null, weightKg ?? null,
      medicalNotes ?? null, joinDate ?? null, membershipStatus ?? null,
      req.params.id, req.gymId]
  );
  res.json({ member: publicMember(rows[0]) });
});

// DELETE /api/members/:id
const deleteMember = asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM members WHERE id = $1 AND gym_id = $2', [req.params.id, req.gymId]);
  if (rowCount === 0) return res.status(404).json({ message: 'Member not found.' });
  res.json({ message: 'Member deleted.' });
});

// POST /api/members/:id/photo
const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });

  const photoUrl = toPublicUrl('member-photos', req.file.filename);
  const { rows } = await query(
    'UPDATE members SET photo_url = $1 WHERE id = $2 AND gym_id = $3 RETURNING *',
    [photoUrl, req.params.id, req.gymId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Member not found.' });
  res.json({ member: publicMember(rows[0]) });
});

// GET /api/members/:id/assignments
// Full plan history for a member, oldest last-assigned first. Every past
// assignment is kept (never deleted, only marked Expired/Cancelled), so
// this always shows "previously assigned" plans alongside the current one.
const getMemberAssignments = asyncHandler(async (req, res) => {
  await expireOverdueAssignments(req.gymId);

  const owns = await query('SELECT id FROM members WHERE id = $1 AND gym_id = $2', [req.params.id, req.gymId]);
  if (owns.rows.length === 0) return res.status(404).json({ message: 'Member not found.' });

  const { rows } = await query(
    `SELECT a.id, a.plan_id, p.name AS plan_name, p.plan_type, a.start_date, a.end_date,
            a.price_paid, a.status, a.created_at,
            a.trainer_name, a.trainer_mobile, a.trainer_fee, a.trainer_notes
     FROM member_plan_assignments a
     JOIN membership_plans p ON p.id = a.plan_id
     WHERE a.member_id = $1 AND a.gym_id = $2
     ORDER BY a.start_date DESC, a.created_at DESC`,
    [req.params.id, req.gymId]
  );

  res.json({
    assignments: rows.map((r) => ({
      id: r.id,
      planId: r.plan_id,
      planName: r.plan_name,
      planType: r.plan_type,
      startDate: r.start_date,
      endDate: r.end_date,
      pricePaid: Number(r.price_paid),
      status: r.status,
      createdAt: r.created_at,
      trainerName: r.trainer_name,
      trainerMobile: r.trainer_mobile,
      trainerFee: r.trainer_fee !== null ? Number(r.trainer_fee) : null,
      trainerNotes: r.trainer_notes,
    })),
  });
});

module.exports = {
  listMembers, getMember, createMember, updateMember, deleteMember, uploadPhoto, getMemberAssignments,
};
