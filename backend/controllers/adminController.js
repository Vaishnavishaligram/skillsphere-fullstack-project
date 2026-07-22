const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const AdminLog = require('../models/AdminLog');
const { notifyUser } = require('../utils/notify');
const { ApiError } = require('../middleware/errorHandler');

const logAdminAction = async (req, action, targetType, targetId, details = {}) => {
  await AdminLog.create({
    admin: req.user._id,
    action,
    targetType,
    targetId,
    details,
    ipAddress: req.ip,
  });
};

// @desc    List/search all users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isSuspended, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

    const users = await User.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);

    res.status(200).json({ success: true, count: users.length, total, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend a user account
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (admin)
const suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'admin') throw new ApiError(400, 'Cannot suspend an admin account');

    user.isSuspended = true;
    user.suspensionReason = reason || 'Violation of platform policy';
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    await logAdminAction(req, 'SUSPEND_USER', 'User', user._id, { reason });

    await notifyUser(req, {
      user: user._id,
      type: 'account_suspended',
      title: 'Account Suspended',
      message: `Your account has been suspended: ${user.suspensionReason}`,
    });

    res.status(200).json({ success: true, message: 'User suspended' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reinstate a suspended user
// @route   PUT /api/admin/users/:id/reinstate
// @access  Private (admin)
const reinstateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    user.isSuspended = false;
    user.suspensionReason = undefined;
    await user.save({ validateBeforeSave: false });

    await logAdminAction(req, 'REINSTATE_USER', 'User', user._id);

    res.status(200).json({ success: true, message: 'User reinstated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a freelancer (badge system)
// @route   PUT /api/admin/freelancers/:id/verify
// @access  Private (admin)
const verifyFreelancer = async (req, res, next) => {
  try {
    const profile = await Freelancer.findOne({ user: req.params.id });
    if (!profile) throw new ApiError(404, 'Freelancer profile not found');

    profile.isVerified = true;
    await profile.save();

    await logAdminAction(req, 'VERIFY_FREELANCER', 'User', req.params.id);

    await notifyUser(req, {
      user: req.params.id,
      type: 'verification_approved',
      title: 'Verification Approved',
      message: 'Your freelancer profile has been verified! You now have a verification badge.',
    });

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a gig (if platform requires manual approval before it goes live)
// @route   PUT /api/admin/gigs/:id/approve
// @access  Private (admin)
const approveGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');

    gig.isApproved = true;
    if (gig.status === 'draft') gig.status = 'open';
    await gig.save();

    await logAdminAction(req, 'APPROVE_GIG', 'Gig', gig._id);

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject/remove a gig (fraud, policy violation)
// @route   PUT /api/admin/gigs/:id/reject
// @access  Private (admin)
const rejectGig = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');

    gig.status = 'cancelled';
    gig.isApproved = false;
    await gig.save();

    await logAdminAction(req, 'REJECT_GIG', 'Gig', gig._id, { reason });

    res.status(200).json({ success: true, message: 'Gig rejected/removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Platform-wide analytics for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private (admin)
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalFreelancers, totalClients, activeGigs, completedGigs, disputedGigs] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'freelancer' }),
        User.countDocuments({ role: 'client' }),
        Gig.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        Gig.countDocuments({ status: 'completed' }),
        Gig.countDocuments({ status: 'disputed' }),
      ]);

    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'released' } },
      { $group: { _id: null, totalRevenue: { $sum: '$platformFee' }, totalVolume: { $sum: '$amount' } } },
    ]);

    // Monthly revenue trend (last 6 months) for the admin dashboard chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenueAgg = await Payment.aggregate([
      { $match: { status: 'released', updatedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
          revenue: { $sum: '$platformFee' },
          volume: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill in any months with zero activity so the chart always shows a full 6-month range
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthLabels.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short' }) });
    }
    const monthlyRevenue = monthLabels.map(({ year, month, label }) => {
      const match = monthlyRevenueAgg.find((m) => m._id.year === year && m._id.month === month);
      return { month: label, revenue: match?.revenue || 0, volume: match?.volume || 0 };
    });

    const topCategories = await Gig.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const jobSuccessRate =
      completedGigs + disputedGigs > 0
        ? ((completedGigs / (completedGigs + disputedGigs)) * 100).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalFreelancers,
        totalClients,
        activeGigs,
        completedGigs,
        disputedGigs,
        platformRevenue: revenueAgg[0]?.totalRevenue || 0,
        totalPaymentVolume: revenueAgg[0]?.totalVolume || 0,
        monthlyRevenue,
        topCategories,
        jobSuccessRate: Number(jobSuccessRate),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Basic fraud detection - flags suspicious accounts/patterns
// @route   GET /api/admin/fraud-flags
// @access  Private (admin)
const getFraudFlags = async (req, res, next) => {
  try {
    // Heuristics: many rejected proposals, multiple accounts from same IP (not tracked here),
    // gigs with no activity but huge budgets, freelancers with 1-star spam patterns, etc.
    const Proposal = require('../models/Proposal');

    const suspiciousFreelancers = await Proposal.aggregate([
      { $group: { _id: '$freelancer', total: { $sum: 1 }, rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } } } },
      { $match: { total: { $gte: 5 } } },
      { $addFields: { rejectionRate: { $divide: ['$rejected', '$total'] } } },
      { $match: { rejectionRate: { $gte: 0.8 } } },
      { $sort: { rejectionRate: -1 } },
      { $limit: 20 },
    ]);

    const highValueUnassignedGigs = await Gig.find({
      status: 'open',
      budgetMin: { $gte: 100000 },
      proposalCount: 0,
    }).limit(20);

    res.status(200).json({
      success: true,
      flags: { suspiciousFreelancers, highValueUnassignedGigs },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform-wide payment transactions (payment monitoring)
// @route   GET /api/admin/payments
// @access  Private (admin)
const getAllPayments = async (req, res, next) => {
  try {
    const { status, provider, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (provider) filter.provider = provider;

    const payments = await Payment.find(filter)
      .populate('gig', 'title')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({ success: true, count: payments.length, total, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin action audit log
// @route   GET /api/admin/logs
// @access  Private (admin)
const getAdminLogs = async (req, res, next) => {
  try {
    const logs = await AdminLog.find()
      .populate('admin', 'name email')
      .sort('-createdAt')
      .limit(100);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  suspendUser,
  reinstateUser,
  verifyFreelancer,
  approveGig,
  rejectGig,
  getPlatformAnalytics,
  getFraudFlags,
  getAdminLogs,
  getAllPayments,
};
