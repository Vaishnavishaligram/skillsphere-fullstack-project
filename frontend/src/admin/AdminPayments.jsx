import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAllPayments } from '../../hooks/queries/usePaymentQueries';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const AdminPayments = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: payments = [], isLoading } = useAdminAllPayments(
    statusFilter ? { status: statusFilter, limit: 50 } : { limit: 50 }
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-1">Payment monitoring</h1>
      <p className="text-sm text-ink-400 mb-6">Every escrow deposit and milestone release across the platform.</p>

      <div className="flex gap-2 mb-6">
        {['', 'created', 'pending', 'held_in_escrow', 'released', 'refunded', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn-sm rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              statusFilter === s ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-400'
            }`}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState title="No transactions found" description="Nothing matches this filter yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Gig</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Freelancer</th>
                <th className="text-left px-4 py-3">Provider</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-ink-50">
                  <td className="px-4 py-3">
                    <Link to={`/gigs/${p.gig?._id}`} className="font-medium text-ink-900 hover:text-pin">
                      {p.gig?.title || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{p.client?.name}</td>
                  <td className="px-4 py-3 text-ink-600">{p.freelancer?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-600 capitalize">{p.provider}</td>
                  <td className="px-4 py-3 font-mono text-ink-900">₹{p.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
