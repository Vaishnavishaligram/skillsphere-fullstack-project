const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('./sendEmail');

/**
 * Per the spec, these notification types are important enough to also land
 * in the user's inbox, not just in-app - everything else (typing, gig
 * invitations, milestone nudges, etc.) stays in-app only so people aren't
 * emailed every time something small happens.
 */
const EMAIL_ELIGIBLE_TYPES = new Set([
  'new_gig_posted',
  'proposal_accepted',
  'payment_received',
  'payment_released',
  'review_received',
]);

/**
 * Creates a Notification document, emits it instantly over Socket.IO to the
 * target user's personal room (set via app.set('io', io) in server.js) so it
 * appears in real time rather than only on the next poll, and sends an email
 * for the notification types that warrant it.
 *
 * Every controller that creates a notification should use this instead of
 * calling Notification.create directly, so "real-time" and "email" both hold
 * for every relevant notification type, not just chat messages.
 *
 * @param {import('express').Request} req - needed to reach the Socket.IO instance via req.app.get('io')
 * @param {object} data - { user, type, title, message, link, relatedGig, relatedUser, skipEmail }
 */
const notifyUser = async (req, data) => {
  const notification = await Notification.create(data);

  // Real-time push
  try {
    const io = req?.app?.get('io');
    if (io && data.user) {
      io.to(String(data.user)).emit('notification', notification);
    }
  } catch (err) {
    console.error('Socket notification emit failed:', err.message);
  }

  // Email for high-value notification types
  if (!data.skipEmail && EMAIL_ELIGIBLE_TYPES.has(data.type)) {
    try {
      const user = await User.findById(data.user).select('name email');
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: data.title,
          html: emailTemplates.genericNotification(user.name, data.title, data.message, data.link || ''),
        });
      }
    } catch (err) {
      console.error('Notification email failed:', err.message);
    }
  }

  return notification;
};

/**
 * Notify many users at once (e.g. broadcasting "new gig posted" to every
 * freelancer whose skills match). Runs in parallel and never throws.
 */
const notifyManyUsers = async (req, userIds, payload) => {
  await Promise.all(
    userIds.map((userId) =>
      notifyUser(req, { ...payload, user: userId }).catch((err) => console.error('notifyManyUsers item failed:', err.message))
    )
  );
};

module.exports = { notifyUser, notifyManyUsers, EMAIL_ELIGIBLE_TYPES };
