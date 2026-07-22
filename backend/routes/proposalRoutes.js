const express = require('express');
const router = express.Router();

const {
  submitProposal,
  getProposalsForGig,
  getMyProposals,
  acceptProposal,
  rejectProposal,
  negotiateProposal,
  withdrawProposal,
} = require('../controllers/proposalController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/my', protect, authorize('freelancer'), getMyProposals);
router.get('/gig/:gigId', protect, authorize('client'), getProposalsForGig);
router.post('/:gigId', protect, authorize('freelancer'), submitProposal);

router.put('/:id/accept', protect, authorize('client'), acceptProposal);
router.put('/:id/reject', protect, authorize('client'), rejectProposal);
router.put('/:id/negotiate', protect, negotiateProposal);
router.put('/:id/withdraw', protect, authorize('freelancer'), withdrawProposal);

module.exports = router;
