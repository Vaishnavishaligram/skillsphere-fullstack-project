const express = require('express');
const router = express.Router();

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  releaseMilestonePayment,
  refundPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// NOTE: Stripe webhook is mounted separately in server.js (needs raw body, not JSON-parsed)

router.post('/razorpay/create-order', protect, authorize('client'), createRazorpayOrder);
router.post('/razorpay/verify', protect, authorize('client'), verifyRazorpayPayment);
router.post('/stripe/create-intent', protect, authorize('client'), createStripeIntent);

router.post('/:paymentId/release', protect, authorize('client'), releaseMilestonePayment);
router.post('/:paymentId/refund', protect, authorize('admin'), refundPayment);

router.get('/history', protect, getPaymentHistory);

module.exports = router;
