const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  suspendUser,
  reinstateUser,
  verifyFreelancer,
  approveGig,
  rejectGig,
  getPlatformAnalytics,
  getFraudFlags,
  getAdminLogs,
  getAllPayments,
} = require('../controllers/adminController');
const { getFlaggedReviews, moderateReview } = require('../controllers/reviewController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/reinstate', reinstateUser);

router.put('/freelancers/:id/verify', verifyFreelancer);

router.put('/gigs/:id/approve', approveGig);
router.put('/gigs/:id/reject', rejectGig);

router.get('/analytics', getPlatformAnalytics);
router.get('/fraud-flags', getFraudFlags);
router.get('/logs', getAdminLogs);
router.get('/payments', getAllPayments);

router.get('/reviews/flagged', getFlaggedReviews);
router.put('/reviews/:id/moderate', moderateReview);

module.exports = router;
