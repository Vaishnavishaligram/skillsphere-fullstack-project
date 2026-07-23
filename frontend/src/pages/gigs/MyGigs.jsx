import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGigsList } from '../../hooks/queries/useGigQueries';
import GigCard from '../../components/GigCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const STATUSES = ['open', 'in_progress', 'completed', 'cancelled', 'disputed'];

const MyGigs = () => {
  const [statusFilter, setStatusFilter] = useState('');

  // Backend defaults to status=open when no filter is passed, so "all my
  // gigs regardless of status" means fetching each status in parallel -
  // React Query dedupes/caches each of these independently by query key.
  const results = STATUSES.map((status) => useGigsList({ status, limit: 50 }));
  const isLoading = results.some((r) => r.isLoading);

  const gigs = useMemo(() => {
    const all = results.flatMap((r) => r.data?.gigs || []);
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.dataUpdatedAt).join(',')]);

  const filtered = statusFilter ? gigs.filter((g) => g.status === statusFilter) : gigs;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-ink-900">My gigs</h1>
        <Link to="/gigs/create" className="btn-accent btn-sm">
          Post a gig
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn-sm rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              statusFilter === s ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-400'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No gigs here yet" description="Post your first gig to start matching with local talent." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GigCard key={g._id} gig={g} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGigs;
