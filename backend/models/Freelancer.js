const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    title: { type: String, default: '' }, // e.g. "Full Stack Developer"
    bio: { type: String, default: '' },

    skills: [
      {
        name: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'intermediate',
        },
      },
    ],

    portfolio: [
      {
        title: String,
        description: String,
        imageUrl: String,
        projectUrl: String,
      },
    ],

    resumeUrl: { type: String, default: '' },

    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: Date,
        certificateUrl: String,
      },
    ],

    experience: [
      {
        company: String,
        roleTitle: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],

    availability: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        slots: [{ start: String, end: String }], // "HH:mm"
      },
    ],

    hourlyRate: { type: Number, default: 0 },
    pricingType: { type: String, enum: ['hourly', 'milestone', 'both'], default: 'both' },

    isVerified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }],

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    completedGigs: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    // For AI matching - embedding vector of skills/bio text
    skillEmbedding: { type: [Number], default: [] },

    profileViews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

freelancerSchema.index({ 'skills.name': 1 });
freelancerSchema.index({ ratingAverage: -1 });

module.exports = mongoose.model('Freelancer', freelancerSchema);
