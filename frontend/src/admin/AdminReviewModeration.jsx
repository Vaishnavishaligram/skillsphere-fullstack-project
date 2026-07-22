import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, ShieldCheck, Flag } from 'lucide-react';
import { useFlaggedReviews, useModerateReview } from '../../hooks/queries/useReviewQueries';
import RatingStars from '../../components/RatingStars';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SIGNAL_LABELS = {
  reciprocal_pair: 'Reciprocal review pair',
  duplicate_text: 'Duplicate comment text',
  new_account: 'Brand-new account',
  burst_pattern: 'Burst posting pattern',
  extreme_rating_thin_comment: 'Extreme rating, no explanation',
};

const AdminReviewModeration = () => {
  const { data: reviews = [], isLoading } = useFlaggedReviews();
  const moderateReview = useModerateReview();
  const [reasonDrafts, setReasonDrafts] = useState({});

  const handleClear = async (id) => {
    try {
      await moderateReview.mutateAsync({ id, action: 'clear' });
      toast.success('Review cleared and restored to public rating');
    } catch (err) {
      toast.error('Failed to clear review');
    }
  };

  const handleConfirmFraud = async (id) => {
    try {
      await moderateReview.mutateAsync({ id, action: 'flag', reason: reasonDrafts[id] || 'Confirmed fraudulent by admin' });
      toast.success('Review confirmed as fraudulent and excluded from rating');
    } catch (err) {
      toast.error('Failed to flag review');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-1">Review moderation</h1>
      <p className="text-sm text-ink-400 mb-6">
        Reviews auto-flagged by the fraud-detection heuristics, awaiting a human decision.
      </p>

      {reviews.length === 0 ? (
        <EmptyState title="Nothing flagged" description="No reviews are currently awaiting moderation." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={15} className="text-rose" />
                    <span className="text-sm font-semibold text-rose">Fraud score: {r.fraudScore}/100</span>
                    {r.flagged && (
                      <span className="badge-danger">
                        <Flag size={11} /> Auto-flagged
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(r.fraudSignals || []).map((s) => (
                      <span key={s} className="text-xs font-mono px-2 py-0.5 bg-rose/10 text-rose rounded">
                        {SIGNAL_LABELS[s] || s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-medium text-ink-900">{r.reviewer?.name}</span>
                    <span className="text-ink-400">→</span>
                    <span className="font-medium text-ink-900">{r.reviewee?.name}</span>
                    <RatingStars rating={r.rating} size={12} />
                  </div>
                  <p className="text-sm text-ink-600">{r.comment || <em className="text-ink-300">No comment</em>}</p>
                  <Link to={`/gigs/${r.gig?._id}`} className="text-xs text-pin hover:underline mt-1 inline-block">
                    View related gig: {r.gig?.title}
                  </Link>

                  <input
                    className="input mt-3"
                    placeholder="Reason (used if confirming as fraud)"
                    value={reasonDrafts[r._id] || ''}
                    onChange={(e) => setReasonDrafts({ ...reasonDrafts, [r._id]: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => handleClear(r._id)} className="btn-outline btn-sm" disabled={moderateReview.isPending}>
                    <ShieldCheck size={13} /> Clear (legitimate)
                  </button>
                  <button
                    onClick={() => handleConfirmFraud(r._id)}
                    className="btn-danger btn-sm"
                    disabled={moderateReview.isPending}
                  >
                    <Flag size={13} /> Confirm fraud
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewModeration;
