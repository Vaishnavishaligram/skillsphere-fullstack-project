const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const Freelancer = require('../models/Freelancer');
const { notifyUser } = require('../utils/notify');
const { ApiError } = require('../middleware/errorHandler');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    : null;

const PLATFORM_FEE_PERCENT = 10; // 10% platform commission

// @desc    Create a Razorpay order for escrow deposit (milestone funding)
// @route   POST /api/payments/razorpay/create-order
// @access  Private (client)
const createRazorpayOrder = async (req, res, next) => {
  try {
    if (!razorpay) throw new ApiError(500, 'Razorpay is not configured on this server');

    const { gigId, milestoneId, amount } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `gig_${gigId}_${Date.now()}`,
      notes: { gigId, milestoneId: milestoneId || '' },
    });

    const payment = await Payment.create({
      gig: gigId,
      milestoneId,
      client: req.user._id,
      freelancer: gig.assignedFreelancer,
      amount,
      provider: 'razorpay',
      providerOrderId: order.id,
      type: 'escrow_deposit',
      status: 'created',
      platformFee: (amount * PLATFORM_FEE_PERCENT) / 100,
      netAmount: amount - (amount * PLATFORM_FEE_PERCENT) / 100,
    });

    res.status(201).json({ success: true, order, paymentId: payment._id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature and hold funds in escrow
// @route   POST /api/payments/razorpay/verify
// @access  Private (client)
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new ApiError(400, 'Payment verification failed - signature mismatch');
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ApiError(404, 'Payment record not found');

    payment.providerPaymentId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    payment.status = 'held_in_escrow';
    await payment.save();

    await notifyUser(req, {
      user: payment.freelancer,
      type: 'payment_received',
      title: 'Funds Held in Escrow',
      message: `Client has funded a milestone. Funds will be released on approval.`,
      relatedGig: payment.gig,
    });

    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Stripe PaymentIntent (alternative provider)
// @route   POST /api/payments/stripe/create-intent
// @access  Private (client)
const createStripeIntent = async (req, res, next) => {
  try {
    if (!stripe) throw new ApiError(500, 'Stripe is not configured on this server');

    const { gigId, milestoneId, amount, currency = 'usd' } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { gigId, milestoneId: milestoneId || '', clientId: String(req.user._id) },
    });

    const payment = await Payment.create({
      gig: gigId,
      milestoneId,
      client: req.user._id,
      freelancer: gig.assignedFreelancer,
      amount,
      currency: currency.toUpperCase(),
      provider: 'stripe',
      providerOrderId: intent.id,
      type: 'escrow_deposit',
      status: 'pending',
      platformFee: (amount * PLATFORM_FEE_PERCENT) / 100,
      netAmount: amount - (amount * PLATFORM_FEE_PERCENT) / 100,
    });

    res.status(201).json({ success: true, clientSecret: intent.client_secret, paymentId: payment._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe webhook - confirms payment success and moves to escrow
// @route   POST /api/payments/stripe/webhook
// @access  Public (Stripe signature verified)
const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const payment = await Payment.findOne({ providerOrderId: intent.id });
      if (payment) {
        payment.status = 'held_in_escrow';
        payment.providerPaymentId = intent.id;
        await payment.save();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Release escrowed milestone payment to freelancer (client approves work)
// @route   POST /api/payments/:paymentId/release
// @access  Private (client)
const releaseMilestonePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (String(payment.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
    if (payment.status !== 'held_in_escrow') throw new ApiError(400, 'Payment is not in escrow');

    payment.status = 'released';
    await payment.save();

    // In production: trigger actual payout via Razorpay Payouts / Stripe Transfers here
    await Freelancer.findOneAndUpdate(
      { user: payment.freelancer },
      { $inc: { totalEarnings: payment.netAmount } }
    );

    if (payment.milestoneId) {
      const gig = await Gig.findById(payment.gig);
      const milestone = gig.milestones.id(payment.milestoneId);
      if (milestone) {
        milestone.status = 'paid';
        await gig.save();
      }
    }

    await notifyUser(req, {
      user: payment.freelancer,
      type: 'payment_released',
      title: 'Payment Released',
      message: `A milestone payment of ${payment.netAmount} has been released to you`,
      relatedGig: payment.gig,
    });

    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund an escrow payment to client (e.g. dispute resolution)
// @route   POST /api/payments/:paymentId/refund
// @access  Private (admin)
const refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.status !== 'held_in_escrow') throw new ApiError(400, 'Only escrowed payments can be refunded');

    if (payment.provider === 'stripe' && stripe) {
      await stripe.refunds.create({ payment_intent: payment.providerPaymentId });
    }
    // Razorpay refund would call razorpay.payments.refund(payment.providerPaymentId)

    payment.status = 'refunded';
    await payment.save();

    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction history for logged-in user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'client' ? { client: req.user._id } : { freelancer: req.user._id };

    const payments = await Payment.find(filter).populate('gig', 'title').sort('-createdAt');
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  stripeWebhook,
  releaseMilestonePayment,
  refundPayment,
  getPaymentHistory,
};
