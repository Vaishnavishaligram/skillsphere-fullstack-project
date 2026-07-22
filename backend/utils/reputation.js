const Review = require('../models/Review');

/**
 * Computes per-review weight for the weighted reputation score.
 * - Verified reviews (tied to an actually paid/completed milestone) count more.
 * - Recent reviews count more than old ones (mild decay, floor at 0.5x).
 */
const computeReviewWeight = (review) => {
  const verifiedMultiplier = review.isVerified ? 1.5 : 1;

  const ageInMonths = (Date.now() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24 * 30);
  const recencyMultiplier = Math.max(0.5, 1 - ageInMonths * 0.02);

  return Number((verifiedMultiplier * recencyMultiplier).toFixed(3));
};

/**
 * Weighted + Bayesian-smoothed reputation score.
 * Bayesian smoothing pulls low-review-count profiles toward the platform average,
 * so a single 5-star review doesn't immediately show as a "perfect 5.0".
 *
 * PLATFORM_PRIOR / PRIOR_WEIGHT are tunable constants:
 * - PLATFORM_PRIOR: assumed "average" rating before any reviews exist
 * - PRIOR_WEIGHT: how many "phantom" average reviews the prior is worth
 */
const PLATFORM_PRIOR = 4.2;
const PRIOR_WEIGHT = 3;

const computeWeightedReputationScore = (reviews) => {
  const usable = reviews.filter((r) => !r.flagged);
  if (usable.length === 0) return { score: 0, count: 0 };

  let weightedSum = 0;
  let weightTotal = 0;

  usable.forEach((r) => {
    const w = r.weight ?? computeReviewWeight(r);
    weightedSum += r.rating * w;
    weightTotal += w;
  });

  const bayesianScore =
    (PRIOR_WEIGHT * PLATFORM_PRIOR + weightedSum) / (PRIOR_WEIGHT + weightTotal);

  return { score: Number(bayesianScore.toFixed(2)), count: usable.length };
};

/**
 * Fraud-detection heuristics for a newly submitted review.
 * Returns { fraudScore (0-100), fraudSignals[] }.
 * This is intentionally conservative — it flags for admin attention rather than
 * silently discarding, since false positives would suppress genuine feedback.
 */
const detectReviewFraud = async ({ reviewerId, revieweeId, comment, reviewerAccountCreatedAt }) => {
  const signals = [];
  let score = 0;

  // 1. Reciprocal review ring: reviewee already reviewed this reviewer very recently
  const reciprocal = await Review.findOne({ reviewer: revieweeId, reviewee: reviewerId }).sort('-createdAt');
  if (reciprocal) {
    const hoursSince = (Date.now() - new Date(reciprocal.createdAt)) / (1000 * 60 * 60);
    if (hoursSince < 72) {
      signals.push('reciprocal_pair');
      score += 30;
    }
  }

  // 2. Duplicate/near-duplicate comment text against other reviews for the same reviewee
  if (comment && comment.trim().length > 0) {
    const normalizedComment = comment.trim().toLowerCase();
    const existing = await Review.find({ reviewee: revieweeId }).select('comment').limit(50);
    const duplicate = existing.some(
      (r) => r.comment && r.comment.trim().toLowerCase() === normalizedComment && normalizedComment.length > 10
    );
    if (duplicate) {
      signals.push('duplicate_text');
      score += 35;
    }
  }

  // 3. Brand-new reviewer account posting immediately (common in fake-review farms)
  if (reviewerAccountCreatedAt) {
    const accountAgeHours = (Date.now() - new Date(reviewerAccountCreatedAt)) / (1000 * 60 * 60);
    if (accountAgeHours < 1) {
      signals.push('new_account');
      score += 20;
    }
  }

  // 4. Burst pattern: reviewee received an unusual number of reviews in the last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await Review.countDocuments({ reviewee: revieweeId, createdAt: { $gte: oneDayAgo } });
  if (recentCount >= 5) {
    signals.push('burst_pattern');
    score += 25;
  }

  return { fraudScore: Math.min(score, 100), fraudSignals: signals };
};

module.exports = { computeReviewWeight, computeWeightedReputationScore, detectReviewFraud };
