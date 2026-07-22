const express = require('express');
const router = express.Router();

const { createReview, getReviewsForUser, getReviewsForGig, getReviewAnalytics } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/:gigId', protect, createReview);
router.get('/user/:userId', getReviewsForUser);
router.get('/gig/:gigId', getReviewsForGig);
router.get('/analytics/:userId', getReviewAnalytics);

module.exports = router;
