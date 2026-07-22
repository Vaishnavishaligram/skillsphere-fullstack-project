const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. "SUSPEND_USER", "APPROVE_GIG"
    targetType: { type: String, enum: ['User', 'Gig', 'Payment', 'Dispute', 'Review'] },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminLog', adminLogSchema);
