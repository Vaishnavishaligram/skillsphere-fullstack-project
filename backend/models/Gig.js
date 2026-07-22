const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'paid'],
      default: 'pending',
    },
    completionPercentage: { type: Number, default: 0 },
    files: [{ type: String }],
  },
  { _id: true, timestamps: true }
);

const gigSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    skillsRequired: [{ type: String }],

    budgetType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      city: String,
      isRemote: { type: Boolean, default: false },
    },

    milestones: [milestoneSchema],
    attachments: [{ type: String }],

    invitedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'submitted', 'completed', 'cancelled', 'disputed'],
      default: 'open',
    },

    isApproved: { type: Boolean, default: true }, // admin approval flag
    deadline: Date,

    progressPercentage: { type: Number, default: 0 },

    // For AI matching
    descriptionEmbedding: { type: [Number], default: [] },

    viewCount: { type: Number, default: 0 },
    proposalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gigSchema.index({ location: '2dsphere' });
gigSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });
gigSchema.index({ category: 1, status: 1 });
gigSchema.index({ budgetMin: 1, budgetMax: 1 });

module.exports = mongoose.model('Gig', gigSchema);
