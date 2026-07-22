const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },

    // Detailed ratings for freelancers reviewed by clients
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },

    reviewerRole: { type: String, enum: ['client', 'freelancer'], required: true },

    // --- Smart reputation / fraud detection fields ---
    isVerified: { type: Boolean, default: false }, // tied to a gig with a released (paid) milestone
    weight: { type: Number, default: 1 }, // computed weight used in weighted reputation score

    flagged: { type: Boolean, default: false }, // excluded from rating calc when true
    flagReason: { type: String, default: '' },
    fraudScore: { type: Number, default: 0 }, // 0-100 heuristic risk score
    fraudSignals: [{ type: String }], // e.g. 'reciprocal_pair', 'duplicate_text', 'new_account', 'burst_pattern'
  },
  { timestamps: true }
);

reviewSchema.index({ gig: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });

module.exports = mongoose.model('Review', reviewSchema);
