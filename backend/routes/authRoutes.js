const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
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
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

// Public
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-2fa', authLimiter, verifyTwoFactorLogin);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', sensitiveLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

// Private
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/resend-verification', protect, resendVerification);
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/confirm', protect, confirmTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

module.exports = router;
