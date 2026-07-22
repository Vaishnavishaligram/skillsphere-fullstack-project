const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const Client = require('../models/Client');
const { sendTokenResponse, generateAccessToken } = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email and password are required');
    }
    if (!['client', 'freelancer'].includes(role)) {
      throw new ApiError(400, 'Role must be client or freelancer');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, 'Email already registered');

    const user = await User.create({ name, email, password, role });

    // Create the associated role-specific profile
    if (role === 'freelancer') {
      await Freelancer.create({ user: user._id });
    } else {
      await Client.create({ user: user._id });
    }

    // Email verification
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your SkillSphere account',
        html: emailTemplates.verifyEmail(user.name, verifyLink),
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login with email + password
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password required');

    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.isSuspended || !user.isActive) {
      throw new ApiError(403, 'Your account has been suspended. Contact support.');
    }

    if (user.twoFactorEnabled) {
      // Issue a short-lived pre-auth token; client must call /verify-2fa next
      const preAuthToken = jwt.sign({ id: user._id, stage: '2fa_pending' }, process.env.JWT_SECRET, {
        expiresIn: '10m',
      });
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        preAuthToken,
      });
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2FA code and complete login
// @route   POST /api/auth/verify-2fa
// @access  Public (requires preAuthToken)
const verifyTwoFactorLogin = async (req, res, next) => {
  try {
    const { preAuthToken, code } = req.body;
    if (!preAuthToken || !code) throw new ApiError(400, 'preAuthToken and code required');

    const decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET);
    if (decoded.stage !== '2fa_pending') throw new ApiError(400, 'Invalid pre-auth token');

    const user = await User.findById(decoded.id).select('+twoFactorSecret');
    if (!user) throw new ApiError(404, 'User not found');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new ApiError(401, 'Invalid 2FA code');

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Enable 2FA - generates secret + QR code
// @route   POST /api/auth/2fa/setup
// @access  Private
const setupTwoFactor = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `${process.env.TWO_FA_APP_NAME || 'SkillSphere'} (${req.user.email})`,
    });

    req.user.twoFactorTempSecret = secret.base32;
    await req.user.save({ validateBeforeSave: false });

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({ success: true, qrCode: qrDataUrl, secret: secret.base32 });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm 2FA setup with a code from authenticator app
// @route   POST /api/auth/2fa/confirm
// @access  Private
const confirmTwoFactor = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorTempSecret');

    if (!user.twoFactorTempSecret) throw new ApiError(400, 'No 2FA setup in progress');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new ApiError(401, 'Invalid code, try again');

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disableTwoFactor = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.authProvider === 'local' && !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Incorrect password');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: '2FA disabled' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) throw new ApiError(400, 'Invalid or expired verification link');

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.isEmailVerified) throw new ApiError(400, 'Email already verified');

    const token = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your SkillSphere account',
      html: emailTemplates.verifyEmail(user.name, verifyLink),
    });

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Respond success either way to avoid leaking which emails exist
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your SkillSphere password',
      html: emailTemplates.resetPassword(user.name, resetLink),
    });

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) throw new ApiError(400, 'Invalid or expired reset token');
    if (!req.body.password || req.body.password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.refreshTokens = []; // invalidate old sessions
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh-token
// @access  Public (requires valid refresh cookie)
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, 'No refresh token provided');

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.some((rt) => rt.token === token)) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired refresh token'));
  }
};

// @desc    Logout - invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      req.user.refreshTokens = req.user.refreshTokens.filter((rt) => rt.token !== token);
      await req.user.save({ validateBeforeSave: false });
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  res.status(200).json({ success: true, user: req.user });
};

// @desc    Google OAuth callback handler - issues tokens & redirects
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res, next) => {
  try {
    const user = req.user; // set by passport
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshTokenValue = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    });

    user.refreshTokens.push({ token: refreshTokenValue });
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token in query (frontend should store it then strip URL)
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyTwoFactorLogin,
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getMe,
  googleCallback,
};
