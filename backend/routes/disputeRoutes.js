const express = require('express');
const router = express.Router();

const {
  raiseDispute,
  getDisputes,
  getDisputeById,
  reviewDispute,
  resolveDispute,
} = require('../controllers/disputeController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { upload } = require('../utils/upload');

router.get('/', protect, getDisputes);
router.get('/:id', protect, getDisputeById);
router.post('/:gigId', protect, upload.array('evidence', 5), raiseDispute);

router.put('/:id/review', protect, authorize('admin'), reviewDispute);
router.put('/:id/resolve', protect, authorize('admin'), resolveDispute);

module.exports = router;
