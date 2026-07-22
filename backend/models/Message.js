const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true }, // sorted pair of userIds or gigId-based
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    content: { type: String, default: '' },
    attachments: [{ type: String }],

    isRead: { type: Boolean, default: false },
    readAt: Date,

    messageType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
