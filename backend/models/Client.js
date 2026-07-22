const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    about: { type: String, default: '' },
    totalGigsPosted: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
