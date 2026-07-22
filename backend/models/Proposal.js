const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    coverLetter: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    estimatedDays: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'negotiating'],
      default: 'pending',
    },

    negotiationHistory: [
      {
        proposedBy: { type: String, enum: ['client', 'freelancer'] },
        amount: Number,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    matchScore: { type: Number, default: 0 }, // AI-computed skill similarity score

    attachments: [{ type: String }],
  },
  { timestamps: true }
);

proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });
proposalSchema.index({ status: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
