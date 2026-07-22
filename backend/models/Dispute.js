const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidenceFiles: [{ type: String }],

    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected'],
      default: 'open',
    },

    resolution: {
      decision: { type: String, enum: ['refund_client', 'pay_freelancer', 'partial_split', 'no_action'] },
      notes: String,
      refundAmount: Number,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: Date,
    },

    adminNotes: [
      {
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

disputeSchema.index({ status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
