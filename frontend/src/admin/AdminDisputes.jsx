import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useDisputes, useReviewDispute, useResolveDispute } from '../../hooks/queries/useDisputeQueries';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const AdminDisputes = () => {
  const { data: disputes = [], isLoading } = useDisputes();
  const reviewDispute = useReviewDispute();
  const resolveDisputeMutation = useResolveDispute();

  const [resolveTarget, setResolveTarget] = useState(null);
  const [decision, setDecision] = useState('no_action');
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const handleReview = async (id) => {
    try {
      await reviewDispute.mutateAsync({ id, note: 'Under review by admin' });
      toast.success('Marked as under review');
    } catch (err) {
      toast.error('Failed to update dispute');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await resolveDisputeMutation.mutateAsync({
        id: resolveTarget._id,
        data: { decision, notes, refundAmount: refundAmount ? Number(refundAmount) : undefined },
      });
      toast.success('Dispute resolved');
      setResolveTarget(null);
      setNotes('');
      setRefundAmount('');
    } catch (err) {
      toast.error('Failed to resolve dispute');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Dispute resolution</h1>

      {disputes.length === 0 ? (
        <EmptyState title="No disputes" description="All gigs are running smoothly." />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link to={`/gigs/${d.gig?._id}`} className="font-medium text-sm text-ink-900 hover:text-pin">
                    {d.gig?.title}
                  </Link>
                  <p className="text-xs text-ink-400 mt-1">
                    Raised by <strong>{d.raisedBy?.name}</strong> against <strong>{d.against?.name}</strong>
                  </p>
                  <p className="text-sm text-ink-600 mt-2">
                    <strong>{d.reason}</strong> — {d.description}
                  </p>
                  {d.evidenceFiles?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {d.evidenceFiles.map((f, i) => (
                        <a key={i} href={f} target="_blank" rel="noreferrer" className="text-xs text-pin underline">
                          Evidence {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={d.status} />
                  {d.status === 'open' && (
                    <button onClick={() => handleReview(d._id)} className="btn-outline btn-sm">
                      Start review
                    </button>
                  )}
                  {(d.status === 'open' || d.status === 'under_review') && (
                    <button onClick={() => setResolveTarget(d)} className="btn-accent btn-sm">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              {d.resolution?.decision && (
                <div className="mt-3 pt-3 border-t border-ink-100 text-xs text-ink-600">
                  Resolved: <strong className="capitalize">{d.resolution.decision.replace(/_/g, ' ')}</strong> —{' '}
                  {d.resolution.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!resolveTarget} onClose={() => setResolveTarget(null)} title="Resolve dispute">
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="label">Decision</label>
            <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="no_action">No action</option>
              <option value="refund_client">Refund client</option>
              <option value="pay_freelancer">Pay freelancer</option>
              <option value="partial_split">Partial split</option>
            </select>
          </div>
          {(decision === 'refund_client' || decision === 'partial_split') && (
            <div>
              <label className="label">Refund amount (₹)</label>
              <input
                type="number"
                className="input"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label">Resolution notes</label>
            <textarea required className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button className="btn-accent w-full">Confirm resolution</button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDisputes;
