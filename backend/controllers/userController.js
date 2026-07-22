const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const Client = require('../models/Client');
const { uploadToCloudinary } = require('../utils/upload');
const { getEmbedding } = require('../utils/aiMatching');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Update basic user info (name, phone, location, avatar)
// @route   PUT /api/users/me
// @access  Private
const updateBasicProfile = async (req, res, next) => {
  try {
    const { name, phone, city, country, coordinates } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (city) user.location.city = city;
    if (country) user.location.country = country;
    if (coordinates && Array.isArray(coordinates)) user.location.coordinates = coordinates;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'skillsphere/avatars');
      user.avatar = result.secure_url;
    }

    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get freelancer profile (own or public by id)
// @route   GET /api/users/freelancer/:id?
// @access  Public
const getFreelancerProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user?._id;
    if (!userId) throw new ApiError(400, 'User id required');

    const profile = await Freelancer.findOne({ user: userId }).populate('user', 'name email avatar location isEmailVerified');
    if (!profile) throw new ApiError(404, 'Freelancer profile not found');

    // Increment view count if viewed by someone else
    if (req.user && String(req.user._id) !== String(userId)) {
      profile.profileViews += 1;
      await profile.save();
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update freelancer profile (skills, bio, portfolio, experience, availability, pricing)
// @route   PUT /api/users/freelancer/me
// @access  Private (freelancer)
const updateFreelancerProfile = async (req, res, next) => {
  try {
    const profile = await Freelancer.findOne({ user: req.user._id });
    if (!profile) throw new ApiError(404, 'Freelancer profile not found');

    const {
      title,
      bio,
      skills,
      certifications,
      experience,
      availability,
      hourlyRate,
      pricingType,
      portfolio,
    } = req.body;

    if (title !== undefined) profile.title = title;
    if (bio !== undefined) profile.bio = bio;
    if (skills !== undefined) profile.skills = skills;
    if (certifications !== undefined) profile.certifications = certifications;
    if (experience !== undefined) profile.experience = experience;
    if (availability !== undefined) profile.availability = availability;
    if (hourlyRate !== undefined) profile.hourlyRate = hourlyRate;
    if (pricingType !== undefined) profile.pricingType = pricingType;
    if (portfolio !== undefined) profile.portfolio = portfolio;

    // Recompute AI embedding whenever skills/bio/title change (for matching engine)
    if (title !== undefined || bio !== undefined || skills !== undefined) {
      const skillText = (profile.skills || []).map((s) => s.name).join(', ');
      const combinedText = `${profile.title}. ${profile.bio}. Skills: ${skillText}`;
      profile.skillEmbedding = await getEmbedding(combinedText);
    }

    await profile.save();
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload resume / portfolio image / certification file
// @route   POST /api/users/freelancer/upload
// @access  Private (freelancer)
const uploadFreelancerFile = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    const { fileType } = req.body; // 'resume' | 'portfolio' | 'certification' | 'verification'

    const result = await uploadToCloudinary(req.file.buffer, `skillsphere/${fileType || 'misc'}`);

    const profile = await Freelancer.findOne({ user: req.user._id });
    if (fileType === 'resume') {
      profile.resumeUrl = result.secure_url;
    } else if (fileType === 'verification') {
      profile.verificationDocuments.push(result.secure_url);
    }
    await profile.save();

    res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client profile
// @route   GET /api/users/client/:id?
// @access  Public
const getClientProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user?._id;
    const profile = await Client.findOne({ user: userId }).populate('user', 'name email avatar location isEmailVerified');
    if (!profile) throw new ApiError(404, 'Client profile not found');
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client profile
// @route   PUT /api/users/client/me
// @access  Private (client)
const updateClientProfile = async (req, res, next) => {
  try {
    const profile = await Client.findOne({ user: req.user._id });
    if (!profile) throw new ApiError(404, 'Client profile not found');

    const { companyName, companyWebsite, about } = req.body;
    if (companyName !== undefined) profile.companyName = companyName;
    if (companyWebsite !== undefined) profile.companyWebsite = companyWebsite;
    if (about !== undefined) profile.about = about;

    await profile.save();
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Freelancer analytics dashboard data
// @route   GET /api/users/freelancer/analytics
// @access  Private (freelancer)
const getFreelancerAnalytics = async (req, res, next) => {
  try {
    const Proposal = require('../models/Proposal');
    const Review = require('../models/Review');

    const profile = await Freelancer.findOne({ user: req.user._id });
    const proposalStats = await Proposal.aggregate([
      { $match: { freelancer: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentReviews = await Review.find({ reviewee: req.user._id })
      .sort('-createdAt')
      .limit(5)
      .populate('reviewer', 'name avatar');

    // Monthly earnings trend (last 6 months) for the freelancer analytics chart
    const Payment = require('../models/Payment');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyEarningsAgg = await Payment.aggregate([
      { $match: { freelancer: req.user._id, status: 'released', updatedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
          earnings: { $sum: '$netAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthLabels.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short' }) });
    }
    const monthlyEarnings = monthLabels.map(({ year, month, label }) => {
      const match = monthlyEarningsAgg.find((m) => m._id.year === year && m._id.month === month);
      return { month: label, earnings: match?.earnings || 0 };
    });

    res.status(200).json({
      success: true,
      analytics: {
        profileViews: profile.profileViews,
        completedGigs: profile.completedGigs,
        totalEarnings: profile.totalEarnings,
        ratingAverage: profile.ratingAverage,
        ratingCount: profile.ratingCount,
        proposalStats,
        recentReviews,
        monthlyEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateBasicProfile,
  getFreelancerProfile,
  updateFreelancerProfile,
  uploadFreelancerFile,
  getClientProfile,
  updateClientProfile,
  getFreelancerAnalytics,
};
