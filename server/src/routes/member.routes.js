const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { requireGym } = require('../middleware/tenant.middleware');
const { createMemberRules, updateMemberRules } = require('../middleware/member.validators');
const { uploadMemberPhoto } = require('../utils/upload');
const {
  listMembers, getMember, createMember, updateMember, deleteMember, uploadPhoto, getMemberAssignments,
} = require('../controllers/member.controller');
const { getInvoice, updateInvoiceSummary, downloadInvoicePdf } = require('../controllers/invoice.controller');
const router = express.Router();

router.use(requireAuth, requireGym);

router.get('/', listMembers);
router.post('/', createMemberRules, createMember);
router.get('/:id', getMember);
router.get('/:id/assignments', getMemberAssignments);
router.patch('/:id', updateMemberRules, updateMember);
router.delete('/:id', deleteMember);
router.post('/:id/photo', uploadMemberPhoto.single('photo'), uploadPhoto);
router.get('/:memberId/invoice', getInvoice);
router.patch('/:memberId/invoice', updateInvoiceSummary);
router.get('/:memberId/invoice/pdf', downloadInvoicePdf);

module.exports = router;
