const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Pulls the assignment (the "bill") + member + gym info needed for both
// the summary text and the invoice. Defaults to the member's most recent
// assignment if assignmentId isn't given.
async function loadInvoiceRow(gymId, memberId, assignmentId) {
  const params = assignmentId ? [gymId, memberId, assignmentId] : [gymId, memberId];
  const result = await query(
    `SELECT a.id AS assignment_id, a.invoice_number, a.summary_message,
            a.start_date, a.end_date, a.price_paid, a.created_at,
            p.name AS plan_name, p.duration_months, p.plan_type,
            a.trainer_name, a.trainer_mobile, a.trainer_fee,
            m.full_name, m.mobile, m.email,
            g.name AS gym_name, g.address, g.city, g.state, g.pincode,
            g.mobile AS gym_mobile, g.email AS gym_email, g.logo_url
       FROM member_plan_assignments a
       JOIN membership_plans p ON p.id = a.plan_id
       JOIN members m ON m.id = a.member_id
       JOIN gyms g ON g.id = a.gym_id
      WHERE a.gym_id = $1 AND a.member_id = $2 ${assignmentId ? 'AND a.id = $3' : ''}
      ORDER BY a.created_at DESC
      LIMIT 1`,
    params
  );
  return result.rows[0] || null;
}

// Lazily assigns a stable, sequential invoice number the first time
// an assignment is viewed, instead of requiring changes to the
// plan-assignment code path.
async function ensureInvoiceNumber(row, gymId) {
  if (row.invoice_number) return row.invoice_number;
  const countResult = await query(
    `SELECT COUNT(*)::int AS n FROM member_plan_assignments WHERE gym_id = $1 AND invoice_number IS NOT NULL`,
    [gymId]
  );
  const next = countResult.rows[0].n + 1;
  const gymPrefix = gymId.slice(0, 4).toUpperCase();
  const invoiceNumber = `INV-${gymPrefix}-${String(next).padStart(5, '0')}`;
  await query(`UPDATE member_plan_assignments SET invoice_number = $1 WHERE id = $2`, [
    invoiceNumber,
    row.assignment_id,
  ]);
  return invoiceNumber;
}

function defaultSummary(row) {
  if (row.plan_type === 'personal_training') {
    return `Hi ${row.full_name},\n\nThanks for your payment of ₹${Number(row.price_paid).toFixed(2)} for Personal Training with ${row.trainer_name}. Your sessions are valid until ${new Date(row.end_date).toLocaleDateString()}.\n\nThanks for training with us!\n${row.gym_name}`;
  }
  return `Hi ${row.full_name},\n\nThanks for your payment of ₹${Number(row.price_paid).toFixed(2)} for the ${row.plan_name} plan. Your membership is valid until ${new Date(row.end_date).toLocaleDateString()}.\n\nThanks for training with us!\n${row.gym_name}`;
}

// GET /api/members/:memberId/invoice?assignmentId=optional
const getInvoice = asyncHandler(async (req, res) => {
  const gymId = req.gymId;
  const { memberId } = req.params;
  const { assignmentId } = req.query;

  const row = await loadInvoiceRow(gymId, memberId, assignmentId);
  if (!row) return res.status(404).json({ message: 'No paid plan found for this member.' });

  const invoiceNumber = await ensureInvoiceNumber(row, gymId);

  res.json({
    assignmentId: row.assignment_id,
    invoiceNumber,
    issueDate: row.created_at,
    summaryMessage: row.summary_message || defaultSummary(row),
    gym: {
      name: row.gym_name,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      mobile: row.gym_mobile,
      email: row.gym_email,
      logoUrl: row.logo_url,
    },
    member: { fullName: row.full_name, mobile: row.mobile, email: row.email },
    plan: {
      name: row.plan_name,
      type: row.plan_type,
      durationMonths: row.duration_months,
      startDate: row.start_date,
      endDate: row.end_date,
    },
    trainer:
      row.plan_type === 'personal_training'
        ? {
            name: row.trainer_name,
            mobile: row.trainer_mobile,
            fee: row.trainer_fee !== null ? Number(row.trainer_fee) : 0,
          }
        : null,
    amount: Number(row.price_paid),
  });
});

// PATCH /api/members/:memberId/invoice   body: { assignmentId, summaryMessage }
const updateInvoiceSummary = asyncHandler(async (req, res) => {
  const gymId = req.gymId;
  const { memberId } = req.params;
  const { assignmentId, summaryMessage } = req.body;

  const result = await query(
    `UPDATE member_plan_assignments
        SET summary_message = $1
      WHERE id = $2 AND gym_id = $3 AND member_id = $4
      RETURNING id`,
    [summaryMessage, assignmentId, gymId, memberId]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: 'Assignment not found.' });

  res.json({ summaryMessage });
});

// GET /api/members/:memberId/invoice/pdf?assignmentId=optional
const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const gymId = req.gymId;
  const { memberId } = req.params;
  const { assignmentId } = req.query;

  const row = await loadInvoiceRow(gymId, memberId, assignmentId);
  if (!row) return res.status(404).json({ message: 'No paid plan found for this member.' });
  const invoiceNumber = await ensureInvoiceNumber(row, gymId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  // --- Header: logo + gym info -------------------------------------------
  const logoPath = row.logo_url
    ? path.join(__dirname, '..', 'uploads', 'gym-logos', path.basename(row.logo_url))
    : null;

  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 60 });
    doc.fontSize(20).text(row.gym_name, 120, 50);
  } else {
    doc.fontSize(20).text(row.gym_name, 50, 50);
  }

  doc
    .fontSize(9)
    .fillColor('#555')
    .text(row.address, 120, 75)
    .text(`${row.city}, ${row.state} ${row.pincode}`)
    .text(`${row.gym_mobile}  ${row.gym_email || ''}`);

  doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#ddd').stroke();

  // --- Invoice meta ---------------------------------------------------------
  doc.fillColor('#000').fontSize(16).text('INVOICE', 50, 150);
  doc
    .fontSize(10)
    .text(`Invoice No: ${invoiceNumber}`, 400, 150, { align: 'right' })
    .text(`Date: ${new Date(row.created_at).toLocaleDateString()}`, 400, 165, { align: 'right' });

  doc.fontSize(11).text('Billed To:', 50, 190);
  doc
    .fontSize(10)
    .fillColor('#333')
    .text(row.full_name, 50, 205)
    .text(row.mobile, 50, 220)
    .text(row.email || '', 50, 235);

  // --- Line items table ---------------------------------------------------
  const tableTop = 280;
  doc.fillColor('#000').fontSize(10);
  doc.text('Description', 50, tableTop);
  doc.text('Duration', 300, tableTop);
  doc.text('Valid Till', 380, tableTop);
  doc.text('Amount', 480, tableTop, { align: 'right' });
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#ddd').stroke();

  const rowY = tableTop + 25;
  doc.fillColor('#333');
  doc.text(`${row.plan_name} Membership`, 50, rowY);
  doc.text(`${row.duration_months} month(s)`, 300, rowY);
  doc.text(new Date(row.end_date).toLocaleDateString(), 380, rowY);
  doc.text(`Rs. ${Number(row.price_paid).toFixed(2)}`, 480, rowY, { align: 'right' });

  doc.moveTo(50, rowY + 25).lineTo(545, rowY + 25).strokeColor('#ddd').stroke();

  doc.fontSize(12).fillColor('#000').text('Total Paid', 380, rowY + 40);
  doc.fontSize(12).text(`Rs. ${Number(row.price_paid).toFixed(2)}`, 480, rowY + 40, { align: 'right' });

  doc
    .fontSize(9)
    .fillColor('#888')
    .text('Thank you for your membership!', 50, 720, { align: 'center', width: 495 });

  doc.end();
});

module.exports = { getInvoice, updateInvoiceSummary, downloadInvoicePdf };