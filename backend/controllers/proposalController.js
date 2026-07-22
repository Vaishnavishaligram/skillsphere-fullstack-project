const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');
const Freelancer = require('../models/Freelancer');
const { notifyUser } = require('../utils/notify');
const { computeMatchScore } = require('../utils/aiMatching');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Submit a proposal (bid) for a gig
// @route   POST /api/proposals/:gigId
// @access  Private (freelancer)
const submitProposal = async (req, res, next) => {
  try {
    const { coverLetter, bidAmount, estimatedDays } = req.body;
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (gig.status !== 'open') throw new ApiError(400, 'This gig is not open for proposals');

    const existing = await Proposal.findOne({ gig: gig._id, freelancer: req.user._id });
    if (existing) throw new ApiError(400, 'You already submitted a proposal for this gig');

    const freelancerProfile = await Freelancer.findOne({ user: req.user._id });

    const matchScore = computeMatchScore({
      gigEmbedding: gig.descriptionEmbedding,
      freelancerEmbedding: freelancerProfile?.skillEmbedding,
      gigSkills: gig.skillsRequired,
      freelancerSkills: freelancerProfile?.skills || [],
      freelancerRating: freelancerProfile?.ratingAverage || 0,
    });

    const proposal = await Proposal.create({
      gig: gig._id,
      freelancer: req.user._id,
      coverLetter,
      bidAmount,
      estimatedDays,
      matchScore,
    });

    gig.proposalCount += 1;
    await gig.save();

    await notifyUser(req, {
      user: gig.client,
      type: 'proposal_received',
      title: 'New Proposal Received',
      message: `${req.user.name} submitted a proposal for "${gig.title}"`,
      link: `/gigs/${gig._id}/proposals`,
      relatedGig: gig._id,
      relatedUser: req.user._id,
    });

    res.status(201).json({ success: true, proposal });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all proposals for a gig (client view) sorted by match score
// @route   GET /api/proposals/gig/:gigId
// @access  Private (client - owner)
const getProposalsForGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) throw new ApiError(404, 'Gig not found');
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    const proposals = await Proposal.find({ gig: gig._id })
      .populate('freelancer', 'name avatar')
      .sort('-matchScore');

    res.status(200).json({ success: true, count: proposals.length, proposals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get proposals submitted by the logged-in freelancer
// @route   GET /api/proposals/my
// @access  Private (freelancer)
const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('gig', 'title budgetMin budgetMax status')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: proposals.length, proposals });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a proposal - assigns freelancer to the gig
// @route   PUT /api/proposals/:id/accept
// @access  Private (client - owner)
const acceptProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('gig');
    if (!proposal) throw new ApiError(404, 'Proposal not found');

    const gig = await Gig.findById(proposal.gig._id);
    if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
    if (gig.status !== 'open') throw new ApiError(400, 'Gig is not open');

    proposal.status = 'accepted';
    await proposal.save();

    gig.assignedFreelancer = proposal.freelancer;
    gig.status = 'in_progress';
    await gig.save();

    // Auto-reject other pending proposals
    await Proposal.updateMany(
      { gig: gig._id, _id: { $ne: proposal._id }, status: 'pending' },
      { status: 'rejected' }
    );

    await notifyUser(req, {
      user: proposal.freelancer,
      type: 'proposal_accepted',
      title: 'Proposal Accepted!',
      message: `Your proposal for "${gig.title}" was accepted`,
      link: `/gigs/${gig._id}`,
      relatedGig: gig._id,
    });

    res.status(200).json({ success: true, proposal, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a proposal
// @route   PUT /api/proposals/:id/reject
// @access  Private (client - owner)
const rejectProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('gig');
    if (!proposal) throw new ApiError(404, 'Proposal not found');
    if (String(proposal.gig.client) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    proposal.status = 'rejected';
    await proposal.save();

    await notifyUser(req, {
      user: proposal.freelancer,
      type: 'proposal_rejected',
      title: 'Proposal Update',
      message: `Your proposal for "${proposal.gig.title}" was not selected`,
      relatedGig: proposal.gig._id,
    });

    res.status(200).json({ success: true, proposal });
  } catch (error) {
    next(error);
  }
};

// @desc    Negotiate price on a proposal (either party)
// @route   PUT /api/proposals/:id/negotiate
// @access  Private (client or freelancer involved)
const negotiateProposal = async (req, res, next) => {
  try {
    const { amount, message } = req.body;
    const proposal = await Proposal.findById(req.params.id).populate('gig');
    if (!proposal) throw new ApiError(404, 'Proposal not found');

    const isClient = String(proposal.gig.client) === String(req.user._id);
    const isFreelancer = String(proposal.freelancer) === String(req.user._id);
    if (!isClient && !isFreelancer) throw new ApiError(403, 'Not authorized');

    proposal.negotiationHistory.push({
      proposedBy: isClient ? 'client' : 'freelancer',
      amount,
      message,
    });
    proposal.status = 'negotiating';
    await proposal.save();

    res.status(200).json({ success: true, proposal });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw a proposal
// @route   PUT /api/proposals/:id/withdraw
// @access  Private (freelancer - owner)
const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) throw new ApiError(404, 'Proposal not found');
    if (String(proposal.freelancer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

    proposal.status = 'withdrawn';
    await proposal.save();

    res.status(200).json({ success: true, proposal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProposal,
  getProposalsForGig,
  getMyProposals,
  acceptProposal,
  rejectProposal,
  negotiateProposal,
  withdrawProposal,
};
