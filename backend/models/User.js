const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      default: 'client',
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      city: String,
      country: String,
    },

    // Auth
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    passwordResetToken: String,
    passwordResetExpire: Date,

    // 2FA
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },

    // Account status
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },

    // Refresh tokens (for logout / rotation)
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],

    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1h
  return token;
};

module.exports = mongoose.model('User', userSchema);
