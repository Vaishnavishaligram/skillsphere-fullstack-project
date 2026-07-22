const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

// Pre-built templates
const emailTemplates = {
  verifyEmail: (name, link) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Welcome to SkillSphere, ${name}!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${link}" style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email</a>
      <p>Or copy this link: ${link}</p>
      <p>This link expires in 24 hours.</p>
    </div>
  `,
  resetPassword: (name, link) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="background:#DC2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `,
  twoFactorCode: (name, code) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Your 2FA Verification Code</h2>
      <p>Hi ${name}, your one-time verification code is:</p>
      <h1 style="letter-spacing:4px;">${code}</h1>
      <p>This code expires in 10 minutes.</p>
    </div>
  `,
  genericNotification: (name, title, message, link) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <p style="color:#5A6C93; font-size:12px; text-transform:uppercase; letter-spacing:1px;">SkillSphere</p>
      <h2 style="margin-top:4px;">${title}</h2>
      <p>Hi ${name},</p>
      <p>${message}</p>
      ${
        link
          ? `<a href="${(process.env.CLIENT_URL || '').replace(/\/$/, '')}${link}" style="background:#10192E;color:#fff;padding:11px 22px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:8px;">View details</a>`
          : ''
      }
    </div>
  `,
};

module.exports = { sendEmail, emailTemplates };
