import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMyProposals, useWithdrawProposal } from '../../hooks/queries/useGigQueries';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const MyProposals = () => {
  const { data: proposals = [], isLoading } = useMyProposals();
  const withdrawProposal = useWithdrawProposal();

  const handleWithdraw = async (id) => {
    try {
      await withdrawProposal.mutateAsync(id);
      toast.success('Proposal withdrawn');
    } catch (err) {
      toast.error('Failed to withdraw proposal');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">My proposals</h1>

      {proposals.length === 0 ? (
        <EmptyState title="No proposals yet" description="Browse the marketplace and submit your first proposal." />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p._id} className="card p-5 flex items-center justify-between gap-4">
              <div>
                <Link to={`/gigs/${p.gig?._id}`} className="font-medium text-sm text-ink-900 hover:text-pin">
                  {p.gig?.title}
                </Link>
                <p className="text-xs text-ink-400 mt-1">
                  Bid ₹{p.bidAmount} · Budget ₹{p.gig?.budgetMin}–₹{p.gig?.budgetMax}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={p.status} />
                {p.status === 'pending' && (
                  <button onClick={() => handleWithdraw(p._id)} className="btn-outline btn-sm">
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProposals;
