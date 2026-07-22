import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Paperclip, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useGig,
  useGigRecommendations,
  useUpdateMilestone,
} from '../../hooks/queries/useGigQueries';
import {
  useProposalsForGig,
  useAcceptProposal,
  useRejectProposal,
} from '../../hooks/queries/useGigQueries';
import { useCreateReview } from '../../hooks/queries/useReviewQueries';
import { useRaiseDispute } from '../../hooks/queries/useDisputeQueries';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import FreelancerCard from '../../components/FreelancerCard';
import SubmitProposalModal from './SubmitProposalModal';
import Modal from '../../components/Modal';
import RatingStars from '../../components/RatingStars';

const GigDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  const { data: gig, isLoading: gigLoading } = useGig(id);
  const isOwner = user && gig && String(gig.client._id || gig.client) === String(user._id);
  const isAssignedFreelancer = user && gig && String(gig.assignedFreelancer?._id) === String(user._id);

  // Proposals + AI recommendations only matter (and are only authorized) for the owning client
  const { data: proposals = [] } = useProposalsForGig(id, { enabled: !!isOwner });
  const { data: recommendations = [] } = useGigRecommendations(id, { enabled: !!isOwner && gig?.status === 'open' });

  const acceptProposal = useAcceptProposal(id);
  const rejectProposal = useRejectProposal(id);
  const updateMilestone = useUpdateMilestone(id);

  const handleAcceptProposal = async (proposalId) => {
    try {
      await acceptProposal.mutateAsync(proposalId);
      toast.success('Proposal accepted, freelancer assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await rejectProposal.mutateAsync(proposalId);
    } catch (err) {
      toast.error('Failed to reject proposal');
    }
  };

  const handleMilestoneUpdate = async (milestoneId, status) => {
    try {
      await updateMilestone.mutateAsync({
        milestoneId,
        data: { status, completionPercentage: status === 'approved' ? 100 : undefined },
      });
      toast.success('Milestone updated');
    } catch (err) {
      toast.error('Failed to update milestone');
    }
  };

  if (gigLoading) return <LoadingSpinner />;
  if (!gig) return <p className="text-ink-400">Gig not found.</p>;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={gig.status} />
              <span className="text-xs text-ink-400">{gig.category}</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-ink-900">{gig.title}</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-semibold text-lg text-ink-900">
              ₹{gig.budgetMin?.toLocaleString()} – ₹{gig.budgetMax?.toLocaleString()}
            </p>
            <p className="text-xs text-ink-400">{gig.budgetType}</p>
          </div>
        </div>

        <p className="text-sm text-ink-600 mt-4 leading-relaxed whitespace-pre-line">{gig.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {(gig.skillsRequired || []).map((s) => (
            <span key={s} className="text-xs font-mono px-2.5 py-1 bg-ink-50 text-ink-600 rounded">
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {gig.location?.isRemote ? 'Remote' : gig.location?.city}
          </span>
          {gig.attachments?.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip size={12} /> {gig.attachments.length} attachment(s)
            </span>
          )}
        </div>

        {user?.role === 'freelancer' && gig.status === 'open' && (
          <button onClick={() => setProposalModalOpen(true)} className="btn-accent mt-5">
            Submit a proposal
          </button>
        )}

        {(isOwner || isAssignedFreelancer) && gig.status === 'in_progress' && (
          <div className="mt-5 flex gap-3">
            <button onClick={() => setDisputeModalOpen(true)} className="btn-outline btn-sm text-rose border-rose/30">
              <AlertTriangle size={14} /> Raise a dispute
            </button>
          </div>
        )}

        {(isOwner || isAssignedFreelancer) && gig.status === 'completed' && (
          <button onClick={() => setReviewModalOpen(true)} className="btn-outline mt-5">
            Leave a review
          </button>
        )}
      </div>

      {/* Milestones */}
      {gig.milestones?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink-900 mb-4">
            Milestones · {gig.progressPercentage || 0}% complete
          </h2>
          <div className="w-full h-2 bg-ink-50 rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-pin transition-all" style={{ width: `${gig.progressPercentage || 0}%` }} />
          </div>
          <div className="space-y-3">
            {gig.milestones.map((m) => (
              <div key={m._id} className="border border-ink-100 rounded-md p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-ink-900">{m.title}</p>
                  <p className="text-xs text-ink-400">{m.description}</p>
                  <p className="text-xs font-mono text-ink-600 mt-1">₹{m.amount?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={m.status} />
                  {isAssignedFreelancer && m.status === 'pending' && (
                    <button onClick={() => handleMilestoneUpdate(m._id, 'in_progress')} className="btn-outline btn-sm">
                      Start
                    </button>
                  )}
                  {isAssignedFreelancer && m.status === 'in_progress' && (
                    <button onClick={() => handleMilestoneUpdate(m._id, 'submitted')} className="btn-outline btn-sm">
                      Submit
                    </button>
                  )}
                  {isOwner && m.status === 'submitted' && (
                    <button onClick={() => handleMilestoneUpdate(m._id, 'approved')} className="btn-accent btn-sm">
                      Approve
                    </button>
                  )}
                  {isOwner && m.status === 'approved' && (
                    <Link to="/payments" className="btn-accent btn-sm">
                      Release payment
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI recommendations (client, open gigs) */}
      {isOwner && gig.status === 'open' && recommendations.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-signal-600" />
            <h2 className="font-display font-semibold text-ink-900">AI-recommended freelancers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec) => (
              <FreelancerCard key={rec.freelancer._id} freelancer={rec.freelancer} matchScore={rec.matchScore} />
            ))}
          </div>
        </div>
      )}

      {/* Proposals (client view) */}
      {isOwner && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink-900 mb-4">Proposals ({proposals.length})</h2>
          {proposals.length === 0 ? (
            <p className="text-sm text-ink-400">No proposals yet.</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <div key={p._id} className="border border-ink-100 rounded-md p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/freelancers/${p.freelancer._id}`} className="font-medium text-sm text-ink-900 hover:text-pin">
                          {p.freelancer.name}
                        </Link>
                        <span className="text-xs font-mono text-pin bg-pin/10 px-1.5 py-0.5 rounded">
                          {p.matchScore}% match
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 mt-2">{p.coverLetter}</p>
                      <p className="text-xs text-ink-400 mt-2">
                        Bid: <span className="font-mono font-semibold text-ink-900">₹{p.bidAmount}</span> · {p.estimatedDays} days
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={p.status} />
                      {p.status === 'pending' && gig.status === 'open' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleRejectProposal(p._id)} className="btn-outline btn-sm">
                            Reject
                          </button>
                          <button onClick={() => handleAcceptProposal(p._id)} className="btn-accent btn-sm">
                            Accept
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SubmitProposalModal
        open={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        gig={gig}
      />
      <ReviewModal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} gigId={gig._id} />
      <DisputeModal open={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} gigId={gig._id} />
    </div>
  );
};

const ReviewModal = ({ open, onClose, gigId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview(gigId);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({ rating, comment });
      toast.success('Review submitted');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Leave a review">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Rating</label>
          <RatingStars rating={rating} interactive size={26} onChange={setRating} />
        </div>
        <div>
          <label className="label">Comment</label>
          <textarea className="input min-h-24" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <button className="btn-accent w-full" disabled={createReview.isPending}>
          {createReview.isPending ? 'Submitting...' : 'Submit review'}
        </button>
      </form>
    </Modal>
  );
};

const DisputeModal = ({ open, onClose, gigId }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const raiseDispute = useRaiseDispute();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('description', description);
      await raiseDispute.mutateAsync({ gigId, formData });
      toast.success('Dispute raised. Our team will review it.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Raise a dispute">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Reason</label>
          <input required className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            required
            className="input min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button className="btn-danger w-full" disabled={raiseDispute.isPending}>
          {raiseDispute.isPending ? 'Submitting...' : 'Submit dispute'}
        </button>
      </form>
    </Modal>
  );
};

export default GigDetail;
