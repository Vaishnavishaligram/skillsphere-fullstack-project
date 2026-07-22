const express = require('express');
const router = express.Router();

const {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  inviteFreelancer,
  getFreelancerRecommendations,
  uploadGigAttachment,
  updateMilestone,
} = require('../controllers/gigController');

const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { upload } = require('../utils/upload');

router.get('/', getGigs);
router.get('/:id', optionalAuth, getGigById);

router.post('/', protect, authorize('client'), createGig);
router.put('/:id', protect, authorize('client'), updateGig);
router.delete('/:id', protect, authorize('client'), deleteGig);

router.post('/:id/invite', protect, authorize('client'), inviteFreelancer);
router.get('/:id/recommendations', protect, authorize('client'), getFreelancerRecommendations);
router.post('/:id/attachments', protect, authorize('client'), upload.single('file'), uploadGigAttachment);

router.put('/:id/milestones/:milestoneId', protect, updateMilestone);

module.exports = router;
