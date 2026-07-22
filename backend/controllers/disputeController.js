const Dispute = require('../models/Dispute');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const { notifyUser } = require('../utils/notify');
const { uploadToCloudinary } = require('../utils/upload');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Raise a dispute for a gig
// @route   POST /api/disputes/:gigId
// @access  Private (client or assigned freelancer)
const raiseDispute = async (req, res, next) => {
  try {
    const { reason, description } = req.body;
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) throw new ApiError(404, 'Gig not found');

    const isClient = String(gig.client) === String(req.user._id);
    const isFreelancer = String(gig.assignedFreelancer) === String(req.user._id);
    if (!isClient && !isFreelancer) throw new ApiError(403, 'Not authorized');

    const against = isClient ? gig.assignedFreelancer : gig.client;

    let evidenceFiles = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'skillsphere/disputes');
        evidenceFiles.push(result.secure_url);
      }
    }

    const dispute = await Dispute.create({
      gig: gig._id,
      raisedBy: req.user._id,
      against,
      reason,
      description,
      evidenceFiles,
    });

    gig.status = 'disputed';
    await gig.save();

    res.status(201).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all disputes (admin) or own disputes (user)
// @route   GET /api/disputes
// @access  Private
const getDisputes = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ raisedBy: req.user._id }, { against: req.user._id }] };

    if (req.query.status) filter.status = req.query.status;

    const disputes = await Dispute.find(filter)
      .populate('raisedBy', 'name avatar')
      .populate('against', 'name avatar')
      .populate('gig', 'title')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: disputes.length, disputes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single dispute detail
// @route   GET /api/disputes/:id
// @access  Private (involved parties or admin)
const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('raisedBy', 'name avatar email')
      .populate('against', 'name avatar email')
      .populate('gig');

    if (!dispute) throw new ApiError(404, 'Dispute not found');

    const involved = [String(dispute.raisedBy._id), String(dispute.against._id)].includes(String(req.user._id));
    if (!involved && req.user.role !== 'admin') throw new ApiError(403, 'Not authorized');

    res.status(200).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin mediation - add a note / move to under_review
// @route   PUT /api/disputes/:id/review
// @access  Private (admin)
const reviewDispute = async (req, res, next) => {
  try {
    const { note } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new ApiError(404, 'Dispute not found');

    dispute.status = 'under_review';
    if (note) {
      dispute.adminNotes.push({ admin: req.user._id, note });
    }
    await dispute.save();

    res.status(200).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin resolves a dispute (refund client, pay freelancer, split, or no action)
// @route   PUT /api/disputes/:id/resolve
// @access  Private (admin)
const resolveDispute = async (req, res, next) => {
  try {
    const { decision, notes, refundAmount } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new ApiError(404, 'Dispute not found');

    dispute.status = 'resolved';
    dispute.resolution = {
      decision,
      notes,
      refundAmount,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    };
    await dispute.save();

    // Update related gig status back to a resolved terminal state
    const gig = await Gig.findById(dispute.gig);
    if (gig) {
      gig.status = decision === 'no_action' ? 'in_progress' : 'completed';
      await gig.save();
    }

    // Notify both parties
    await notifyUser(req, {
      user: dispute.raisedBy,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Your dispute has been resolved: ${decision}`,
      relatedGig: dispute.gig,
    });
    await notifyUser(req, {
      user: dispute.against,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `A dispute involving you has been resolved: ${decision}`,
      relatedGig: dispute.gig,
    });

    res.status(200).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

module.exports = { raiseDispute, getDisputes, getDisputeById, reviewDispute, resolveDispute };
