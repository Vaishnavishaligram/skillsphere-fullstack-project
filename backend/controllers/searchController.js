const Gig = require('../models/Gig');
const Freelancer = require('../models/Freelancer');

// @desc    Search gigs - text, location, price, skill filters
// @route   GET /api/search/gigs
// @access  Public
const searchGigs = async (req, res, next) => {
  try {
    const {
      q,
      category,
      minBudget,
      maxBudget,
      skills,
      city,
      isRemote,
      lat,
      lng,
      radiusKm = 25,
      page = 1,
      limit = 12,
      sortBy = '-createdAt',
    } = req.query;

    const filter = { status: 'open' };

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      filter.skillsRequired = { $in: skillList };
    }
    if (minBudget) filter.budgetMax = { $gte: Number(minBudget) };
    if (maxBudget) filter.budgetMin = { ...(filter.budgetMin || {}), $lte: Number(maxBudget) };
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (isRemote !== undefined) filter['location.isRemote'] = isRemote === 'true';

    // Geo-based search (nearby gigs)
    if (lat && lng) {
      filter.location = {
        ...filter.location,
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radiusKm) * 1000,
        },
      };
    }

    const gigs = await Gig.find(filter)
      .populate('client', 'name avatar')
      .sort(q ? { score: { $meta: 'textScore' } } : sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Gig.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: gigs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      gigs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search freelancers - skill, rating, price, experience filters
// @route   GET /api/search/freelancers
// @access  Public
const searchFreelancers = async (req, res, next) => {
  try {
    const {
      q,
      skills,
      minRating,
      minRate,
      maxRate,
      city,
      verifiedOnly,
      page = 1,
      limit = 12,
      sortBy = '-ratingAverage',
    } = req.query;

    const filter = {};

    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      filter['skills.name'] = { $in: skillList };
    }
    if (minRating) filter.ratingAverage = { $gte: Number(minRating) };
    if (minRate) filter.hourlyRate = { $gte: Number(minRate) };
    if (maxRate) filter.hourlyRate = { ...(filter.hourlyRate || {}), $lte: Number(maxRate) };
    if (verifiedOnly === 'true') filter.isVerified = true;

    let userMatch = {};
    if (city) userMatch['location.city'] = new RegExp(city, 'i');

    let query = Freelancer.find(filter).populate({
      path: 'user',
      match: { ...userMatch, ...(q ? { name: new RegExp(q, 'i') } : {}) },
      select: 'name avatar location',
    });

    let freelancers = await query.sort(sortBy).skip((page - 1) * limit).limit(Number(limit));
    // Filter out entries where populate match excluded the user
    freelancers = freelancers.filter((f) => f.user);

    res.status(200).json({ success: true, count: freelancers.length, freelancers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending skills (based on recent gig postings)
// @route   GET /api/search/trending-skills
// @access  Public
const getTrendingSkills = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trending = await Gig.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$skillsRequired' },
      { $group: { _id: '$skillsRequired', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    res.status(200).json({ success: true, trending });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchGigs, searchFreelancers, getTrendingSkills };
