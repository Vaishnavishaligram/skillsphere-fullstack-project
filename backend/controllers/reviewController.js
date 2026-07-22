const Review = require('../models/Review');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const Freelancer = require('../models/Freelancer');
const Client = require('../models/Client');
const User = require('../models/User');
const { notifyUser, notifyManyUsers } = require('../utils/notify');
const { computeReviewWeight, computeWeightedReputationScore } = require('../utils/reputation');
const { assessReviewFraud } = require('../utils/reviewFraud');
const { ApiError } = require('../middleware/errorHandler');

// Recalculate the weighted, Bayesian-smoothed reputation score for a reviewee.
// Flagged (suspected-fraud) reviews are excluded from the calculation entirely,
// so a fake review can never move someone's score even before an admin clears it.
const recalcRating = async (revieweeId, revieweeRole) => {
  const reviews = await Review.find({ reviewee: revieweeId, flagged: { $ne: true } });
  const { score, count } = computeWeightedReputationScore(reviews);

  if (revieweeRole === 'freelancer') {
    await Freelancer.findOneAndUpdate({ user: revieweeId }, { ratingAverage: score, ratingCount: count });
  } else {
    await Client.findOneAndUpdate({ user: revieweeId }, { ratingAverage: score, ratingCount: count });
  }
};

// @desc    Submit a review for a completed gig
// @route   POST /api/reviews/:gigId
// @access  Private (client or assigned freelancer, gig must be completed)
const createReview = async (req, res, next) => {
  try {
    const { rating, comment, communication, quality, timeliness } = req.body;
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (gig.status !== 'completed') throw new ApiError(400, 'Gig must be completed before reviewing');

    const isClient = String(gig.client) === String(req.user._id);
    const isFreelancer = String(gig.assignedFreelancer) === String(req.user._id);
    if (!isClient && !isFreelancer) throw new ApiError(403, 'Not authorized to review this gig');

    const reviewee = isClient ? gig.assignedFreelancer : gig.client;
    const revieweeRole = isClient ? 'freelancer' : 'client';

    const existing = await Review.findOne({ gig: gig._id, reviewer: req.user._id });
    if (existing) throw new ApiError(400, 'You already reviewed this gig');

    // "Verified review" = tied to a gig where at least one milestone payment
    // actually cleared escrow and was released - i.e. real, paid work happened,
    // not just a gig marked complete with no money changing hands.
    const hasReleasedPayment = await Payment.exists({ gig: gig._id, status: 'released' });

    // Fraud heuristics run BEFORE the review is persisted, so a high-risk
    // review is created already flagged rather than flagged after the fact.
    const { fraudScore, flagged, fraudSignals } = await assessReviewFraud({
      reviewerId: req.user._id,
      revieweeId: reviewee,
      rating,
      comment,
    });

    const review = await Review.create({
      gig: gig._id,
      reviewer: req.user._id,
      reviewee,
      rating,
      comment,
      communication,
      quality,
      timeliness,
      reviewerRole: isClient ? 'client' : 'freelancer',
      isVerified: !!hasReleasedPayment,
      fraudScore,
      fraudSignals,
      flagged,
    });

    review.weight = computeReviewWeight(review);
    await review.save();

    // A flagged review never counts toward the reviewee's score (recalcRating
    // filters it out), so this recalculation is safe to run unconditionally.
    await recalcRating(reviewee, revieweeRole);

    if (revieweeRole === 'freelancer') {
      await Freelancer.findOneAndUpdate({ user: reviewee }, { $inc: { completedGigs: 1 } });
    }

    await notifyUser(req, {
      user: reviewee,
      type: 'review_received',
      title: 'New Review Received',
      message: flagged
        ? `You received a ${rating}-star review for "${gig.title}" (pending moderation)`
        : `You received a ${rating}-star review for "${gig.title}"`,
      relatedGig: gig._id,
      relatedUser: req.user._id,
    });

    // Auto-flagged reviews get surfaced to admins immediately rather than
    // waiting for someone to stumble on the moderation queue.
    if (flagged) {
      const admins = await User.find({ role: 'admin' }).select('_id');
      await notifyManyUsers(
        req,
        admins.map((a) => a._id),
        {
          type: 'review_flagged',
          title: 'Review flagged for possible fraud',
          message: `A review on "${gig.title}" was auto-flagged (score ${fraudScore}/100: ${fraudSignals.join(', ')})`,
          link: `/admin/reviews`,
          relatedGig: gig._id,
          relatedUser: req.user._id,
          skipEmail: true,
        }
      );
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user (freelancer or client) - public, excludes flagged
// @route   GET /api/reviews/user/:userId
// @access  Public
const getReviewsForUser = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId, flagged: { $ne: true } })
      .populate('reviewer', 'name avatar')
      .populate('gig', 'title')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a specific gig - public, excludes flagged
// @route   GET /api/reviews/gig/:gigId
// @access  Public
const getReviewsForGig = async (req, res, next) => {
  try {
    const reviews = await Review.find({ gig: req.params.gigId, flagged: { $ne: true } }).populate(
      'reviewer',
      'name avatar'
    );
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Review analytics for a user - rating distribution, sub-score averages, monthly trend
// @route   GET /api/reviews/analytics/:userId
// @access  Public
const getReviewAnalytics = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.params.userId;
    const matchStage = { reviewee: new mongoose.Types.ObjectId(userId), flagged: { $ne: true } };

    const [distribution, subScores, monthlyTrend] = await Promise.all([
      Review.aggregate([{ $match: matchStage }, { $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            avgCommunication: { $avg: '$communication' },
            avgQuality: { $avg: '$quality' },
            avgTimeliness: { $avg: '$timeliness' },
            verifiedCount: { $sum: { $cond: ['$isVerified', 1, 0] } },
            totalCount: { $sum: 1 },
          },
        },
      ]),
      Review.aggregate([
        { $match: { ...matchStage, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      rating: star,
      count: distribution.find((d) => d._id === star)?.count || 0,
    }));

    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthLabels.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short' }) });
    }
    const trend = monthLabels.map(({ year, month, label }) => {
      const match = monthlyTrend.find((m) => m._id.year === year && m._id.month === month);
      return { month: label, avgRating: match ? Number(match.avgRating.toFixed(2)) : 0, count: match?.count || 0 };
    });

    res.status(200).json({
      success: true,
      analytics: {
        ratingDistribution,
        avgCommunication: Number((subScores[0]?.avgCommunication || 0).toFixed(2)),
        avgQuality: Number((subScores[0]?.avgQuality || 0).toFixed(2)),
        avgTimeliness: Number((subScores[0]?.avgTimeliness || 0).toFixed(2)),
        verifiedCount: subScores[0]?.verifiedCount || 0,
        totalCount: subScores[0]?.totalCount || 0,
        monthlyTrend: trend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List flagged / high-risk reviews awaiting moderation
// @route   GET /api/admin/reviews/flagged
// @access  Private (admin)
const getFlaggedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ $or: [{ flagged: true }, { fraudScore: { $gte: 30 } }] })
      .populate('reviewer', 'name email createdAt')
      .populate('reviewee', 'name email')
      .populate('gig', 'title')
      .sort('-fraudScore -createdAt');

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin clears a flagged review (marks it legitimate) or re-flags it
// @route   PUT /api/admin/reviews/:id/moderate
// @access  Private (admin)
const moderateReview = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'clear' | 'flag'
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, 'Review not found');

    review.flagged = action === 'flag';
    review.flagReason = action === 'flag' ? reason || 'Flagged by admin' : '';
    await review.save();

    const revieweeUser = await User.findById(review.reviewee).select('role');
    await recalcRating(review.reviewee, revieweeUser?.role === 'freelancer' ? 'freelancer' : 'client');

    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviewsForUser,
  getReviewsForGig,
  getReviewAnalytics,
  getFlaggedReviews,
  moderateReview,
};
