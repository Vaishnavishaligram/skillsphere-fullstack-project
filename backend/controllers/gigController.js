const Gig = require('../models/Gig');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');
const { notifyUser, notifyManyUsers } = require('../utils/notify');
const { getEmbedding, computeMatchScore } = require('../utils/aiMatching');
const { uploadToCloudinary } = require('../utils/upload');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Create a new gig
// @route   POST /api/gigs
// @access  Private (client)
const createGig = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      skillsRequired,
      budgetType,
      budgetMin,
      budgetMax,
      city,
      isRemote,
      coordinates,
      milestones,
      deadline,
    } = req.body;

    if (!title || !description || !category || budgetMin == null || budgetMax == null) {
      throw new ApiError(400, 'Missing required gig fields');
    }

    const embedding = await getEmbedding(`${title}. ${description}. Skills: ${(skillsRequired || []).join(', ')}`);

    const gig = await Gig.create({
      client: req.user._id,
      title,
      description,
      category,
      skillsRequired: skillsRequired || [],
      budgetType: budgetType || 'fixed',
      budgetMin,
      budgetMax,
      location: {
        city,
        isRemote: !!isRemote,
        coordinates: coordinates || [0, 0],
      },
      milestones: milestones || [],
      deadline,
      descriptionEmbedding: embedding,
    });

    await Client.findOneAndUpdate({ user: req.user._id }, { $inc: { totalGigsPosted: 1 } });

    // Notify freelancers whose skills match this gig (real-time + email, per spec).
    // Capped to the top 25 by rating so a single gig post doesn't mass-email the
    // entire freelancer base - this targets the people actually likely to apply.
    if (gig.skillsRequired?.length) {
      const matchingFreelancers = await Freelancer.find({ 'skills.name': { $in: gig.skillsRequired } })
        .sort('-ratingAverage')
        .limit(25)
        .select('user');

      const recipientIds = matchingFreelancers.map((f) => f.user).filter((id) => String(id) !== String(req.user._id));

      if (recipientIds.length) {
        await notifyManyUsers(req, recipientIds, {
          type: 'new_gig_posted',
          title: 'New gig matching your skills',
          message: `"${gig.title}" was just posted and matches your skillset`,
          link: `/gigs/${gig._id}`,
          relatedGig: gig._id,
          relatedUser: req.user._id,
        });
      }
    }

    res.status(201).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all gigs (with filters/pagination)
// @route   GET /api/gigs
// @access  Public
const getGigs = async (req, res, next) => {
  try {
    const { category, status, minBudget, maxBudget, isRemote, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    filter.status = status || 'open';
    if (minBudget) filter.budgetMax = { $gte: Number(minBudget) };
    if (maxBudget) filter.budgetMin = { ...(filter.budgetMin || {}), $lte: Number(maxBudget) };
    if (isRemote !== undefined) filter['location.isRemote'] = isRemote === 'true';

    const gigs = await Gig.find(filter)
      .populate('client', 'name avatar')
      .sort('-createdAt')
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

// @desc    Get single gig by ID
// @route   GET /api/gigs/:id
// @access  Public
const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('client', 'name avatar location')
      .populate('assignedFreelancer', 'name avatar');

    if (!gig) throw new ApiError(404, 'Gig not found');

    gig.viewCount += 1;
    await gig.save();

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gig (owner only, before assignment)
// @route   PUT /api/gigs/:id
// @access  Private (client - owner)
const updateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
    if (gig.status !== 'open' && gig.status !== 'draft') {
      throw new ApiError(400, 'Cannot edit a gig that is already in progress');
    }

    const allowedFields = [
      'title',
      'description',
      'category',
      'skillsRequired',
      'budgetType',
      'budgetMin',
      'budgetMax',
      'deadline',
      'status',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) gig[field] = req.body[field];
    });

    if (req.body.title || req.body.description || req.body.skillsRequired) {
      gig.descriptionEmbedding = await getEmbedding(
        `${gig.title}. ${gig.description}. Skills: ${(gig.skillsRequired || []).join(', ')}`
      );
    }

    await gig.save();
    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/cancel a gig
// @route   DELETE /api/gigs/:id
// @access  Private (client - owner)
const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    if (gig.status === 'in_progress') {
      gig.status = 'cancelled';
      await gig.save();
      return res.status(200).json({ success: true, message: 'Gig cancelled (was in progress)' });
    }

    await gig.deleteOne();
    res.status(200).json({ success: true, message: 'Gig deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite a freelancer to a gig
// @route   POST /api/gigs/:id/invite
// @access  Private (client - owner)
const inviteFreelancer = async (req, res, next) => {
  try {
    const { freelancerUserId } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    if (!gig.invitedFreelancers.includes(freelancerUserId)) {
      gig.invitedFreelancers.push(freelancerUserId);
      await gig.save();
    }

    await notifyUser(req, {
      user: freelancerUserId,
      type: 'gig_invitation',
      title: 'New Gig Invitation',
      message: `You've been invited to apply for "${gig.title}"`,
      link: `/gigs/${gig._id}`,
      relatedGig: gig._id,
      relatedUser: req.user._id,
    });

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    AI-powered freelancer recommendations for a gig
// @route   GET /api/gigs/:id/recommendations
// @access  Private (client - owner)
const getFreelancerRecommendations = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');

    // Candidate pool: freelancers with at least one overlapping skill, or all if none match
    const candidates = await Freelancer.find({
      'skills.name': { $in: gig.skillsRequired },
    })
      .populate('user', 'name avatar location')
      .limit(50);

    const pool = candidates.length ? candidates : await Freelancer.find().populate('user', 'name avatar location').limit(50);

    const scored = pool.map((f) => ({
      freelancer: f,
      matchScore: computeMatchScore({
        gigEmbedding: gig.descriptionEmbedding,
        freelancerEmbedding: f.skillEmbedding,
        gigSkills: gig.skillsRequired,
        freelancerSkills: f.skills,
        freelancerRating: f.ratingAverage,
      }),
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({ success: true, recommendations: scored.slice(0, 10) });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload gig attachments
// @route   POST /api/gigs/:id/attachments
// @access  Private (client - owner)
const uploadGigAttachment = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const result = await uploadToCloudinary(req.file.buffer, 'skillsphere/gigs');
    gig.attachments.push(result.secure_url);
    await gig.save();

    res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    next(error);
  }
};

// @desc    Update milestone progress
// @route   PUT /api/gigs/:id/milestones/:milestoneId
// @access  Private (client or assigned freelancer)
const updateMilestone = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) throw new ApiError(404, 'Gig not found');

    const isClient = String(gig.client) === String(req.user._id);
    const isFreelancer = String(gig.assignedFreelancer) === String(req.user._id);
    if (!isClient && !isFreelancer) throw new ApiError(403, 'Not authorized');

    const milestone = gig.milestones.id(req.params.milestoneId);
    if (!milestone) throw new ApiError(404, 'Milestone not found');

    const { status, completionPercentage, files } = req.body;
    if (status) milestone.status = status;
    if (completionPercentage !== undefined) milestone.completionPercentage = completionPercentage;
    if (files) milestone.files.push(...files);

    // Recompute overall gig progress
    const totalMilestones = gig.milestones.length || 1;
    const sumProgress = gig.milestones.reduce((acc, m) => acc + (m.completionPercentage || 0), 0);
    gig.progressPercentage = Math.round(sumProgress / totalMilestones);

    await gig.save();

    await notifyUser(req, {
      user: isClient ? gig.assignedFreelancer : gig.client,
      type: 'milestone_update',
      title: 'Milestone Updated',
      message: `Milestone "${milestone.title}" was updated to ${milestone.status}`,
      relatedGig: gig._id,
    });

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  inviteFreelancer,
  getFreelancerRecommendations,
  uploadGigAttachment,
  updateMilestone,
};
