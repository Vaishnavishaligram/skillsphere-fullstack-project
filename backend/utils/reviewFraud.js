const Review = require('../models/Review');
const User = require('../models/User');

const NEW_ACCOUNT_DAYS = 3;
const BURST_WINDOW_HOURS = 24;
const BURST_THRESHOLD = 3;
const FRAUD_THRESHOLD = 50; // score >= this is auto-flagged

/**
 * Computes a 0-100 fraud risk score for a review at write-time, using cheap
 * heuristics rather than ML (no training data available in this environment).
 * Flagged reviews are excluded from the public weighted rating until an
 * admin clears them (see adminController reviewModeration endpoints).
 */
const assessReviewFraud = async ({ reviewerId, revieweeId, rating, comment }) => {
  const signals = [];
  let score = 0;

  const reviewer = await User.findById(reviewerId).select('createdAt');
  const accountAgeDays = reviewer ? (Date.now() - reviewer.createdAt) / (1000 * 60 * 60 * 24) : 999;

  // Signal 1: brand-new account leaving a review
  if (accountAgeDays < NEW_ACCOUNT_DAYS) {
    score += 30;
    signals.push('new_account');
  }

  // Signal 2: extreme rating with little-to-no explanation (common in fake reviews)
  const trimmedComment = (comment || '').trim();
  if ((rating === 1 || rating === 5) && trimmedComment.length < 10) {
    score += 20;
    signals.push('extreme_rating_thin_comment');
  }

  // Signal 3: burst pattern - same reviewer posting many reviews in a short window
  const since = new Date(Date.now() - BURST_WINDOW_HOURS * 60 * 60 * 1000);
  const recentCount = await Review.countDocuments({ reviewer: reviewerId, createdAt: { $gte: since } });
  if (recentCount >= BURST_THRESHOLD) {
    score += 25;
    signals.push('burst_pattern');
  }

  // Signal 4: duplicate/near-duplicate comment text reused by the same reviewer elsewhere
  if (trimmedComment.length > 0) {
    const priorSameText = await Review.findOne({
      reviewer: reviewerId,
      comment: trimmedComment,
    });
    if (priorSameText) {
      score += 40;
      signals.push('duplicate_text');
    }
  }

  // Signal 5: reciprocal review pair - reviewee has also just reviewed this reviewer
  // (common in "you rate me 5, I rate you 5" collusion rings)
  const reciprocal = await Review.findOne({ reviewer: revieweeId, reviewee: reviewerId });
  if (reciprocal) {
    const hoursApart = Math.abs(new Date(reciprocal.createdAt) - Date.now()) / (1000 * 60 * 60);
    if (hoursApart < 1) {
      score += 20;
      signals.push('reciprocal_pair');
    }
  }

  score = Math.min(score, 100);

  return {
    fraudScore: score,
    flagged: score >= FRAUD_THRESHOLD,
    fraudSignals: signals,
  };
};

module.exports = { assessReviewFraud, FRAUD_THRESHOLD };
