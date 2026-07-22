import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAdminGigsList, useApproveGigAdmin, useRejectGigAdmin } from '../../hooks/queries/useAdminQueries';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminGigs = () => {
  const { data: gigs = [], isLoading } = useAdminGigsList();
  const approveGig = useApproveGigAdmin();
  const rejectGig = useRejectGigAdmin();

  const handleApprove = async (id) => {
    try {
      await approveGig.mutateAsync(id);
      toast.success('Gig approved');
    } catch (err) {
      toast.error('Failed to approve gig');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejecting this gig:');
    if (reason === null) return;
    try {
      await rejectGig.mutateAsync({ id, reason });
      toast.success('Gig rejected');
    } catch (err) {
      toast.error('Failed to reject gig');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Manage gigs</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Budget</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gigs.map((g) => (
              <tr key={g._id} className="border-t border-ink-50">
                <td className="px-4 py-3 font-medium text-ink-900">
                  <Link to={`/gigs/${g._id}`} className="hover:text-pin">
                    {g.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-600">{g.category}</td>
                <td className="px-4 py-3 font-mono text-ink-600">
                  ₹{g.budgetMin}–₹{g.budgetMax}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={g.status} />
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {!g.isApproved && (
                    <button onClick={() => handleApprove(g._id)} className="btn-accent btn-sm">
                      Approve
                    </button>
                  )}
                  {g.status !== 'cancelled' && (
                    <button onClick={() => handleReject(g._id)} className="btn-danger btn-sm">
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGigs;
