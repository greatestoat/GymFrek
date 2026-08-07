
const { query } = require('../config/db');
async function expireOverdueAssignments(gymId) {
  await query(
    `UPDATE member_plan_assignments
     SET status = 'Expired'
     WHERE gym_id = $1 AND status = 'Active' AND end_date < CURRENT_DATE`,
    [gymId]
  );

  await query(
    `UPDATE members m
     SET membership_status = 'Expired'
     WHERE m.gym_id = $1
       AND m.membership_status <> 'Paused'
       AND EXISTS (
         SELECT 1 FROM member_plan_assignments a
         JOIN membership_plans p ON p.id = a.plan_id
         WHERE a.member_id = m.id AND p.plan_type = 'membership'
       )
       AND NOT EXISTS (
         SELECT 1 FROM member_plan_assignments a
         JOIN membership_plans p ON p.id = a.plan_id
         WHERE a.member_id = m.id AND a.status = 'Active' AND p.plan_type = 'membership'
       )`,
    [gymId]
  );
}

module.exports = { expireOverdueAssignments };