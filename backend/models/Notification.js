const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: {
      type: String,
      enum: [
        'new_gig_posted',
        'proposal_received',
        'proposal_accepted',
        'proposal_rejected',
        'new_message',
        'milestone_update',
        'payment_received',
        'payment_released',
        'review_received',
        'gig_invitation',
        'dispute_raised',
        'dispute_resolved',
        'account_suspended',
        'verification_approved',
        'review_flagged',
        'system',
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // frontend route to navigate to

    relatedGig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
