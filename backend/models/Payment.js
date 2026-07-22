const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    milestoneId: { type: mongoose.Schema.Types.ObjectId },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    provider: { type: String, enum: ['stripe', 'razorpay'], required: true },
    providerOrderId: { type: String },
    providerPaymentId: { type: String },
    providerSignature: { type: String },

    type: {
      type: String,
      enum: ['escrow_deposit', 'milestone_release', 'refund', 'payout'],
      required: true,
    },

    status: {
      type: String,
      enum: ['created', 'pending', 'held_in_escrow', 'released', 'refunded', 'failed'],
      default: 'created',
    },

    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number },

    failureReason: String,
  },
  { timestamps: true }
);

paymentSchema.index({ gig: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ freelancer: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
