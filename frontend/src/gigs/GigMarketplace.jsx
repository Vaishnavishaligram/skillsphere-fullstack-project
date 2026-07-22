import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useGigsList } from '../../hooks/queries/useGigQueries';
import GigCard from '../../components/GigCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
  'Home Services',
  'Tutoring',
  'Other',
];

const GigMarketplace = () => {
  const [draftFilters, setDraftFilters] = useState({ category: '', minBudget: '', maxBudget: '', isRemote: '' });
  const [page, setPage] = useState(1);
  // appliedParams only changes on submit/page-change, so the query key (and
  // therefore the network request + cache entry) is stable while typing.
  const [appliedParams, setAppliedParams] = useState({ page: 1, limit: 9 });

  const { data, isLoading } = useGigsList(appliedParams);
  const gigs = data?.gigs || [];
  const pages = data?.pages || 1;

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    const params = { page: 1, limit: 9 };
    if (draftFilters.category) params.category = draftFilters.category;
    if (draftFilters.minBudget) params.minBudget = draftFilters.minBudget;
    if (draftFilters.maxBudget) params.maxBudget = draftFilters.maxBudget;
    if (draftFilters.isRemote) params.isRemote = draftFilters.isRemote;
    setAppliedParams(params);
  };

  const goToPage = (p) => {
    setPage(p);
    setAppliedParams({ ...appliedParams, page: p });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink-900">Gig marketplace</h1>
          <p className="text-sm text-ink-400">Local and remote work, matched to your skills.</p>
        </div>
      </div>

      <form onSubmit={applyFilters} className="card p-4 mb-6 grid sm:grid-cols-2 md:grid-cols-5 gap-3">
        <select
          className="input"
          value={draftFilters.category}
          onChange={(e) => setDraftFilters({ ...draftFilters, category: e.target.value })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min budget"
          className="input"
          value={draftFilters.minBudget}
          onChange={(e) => setDraftFilters({ ...draftFilters, minBudget: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max budget"
          className="input"
          value={draftFilters.maxBudget}
          onChange={(e) => setDraftFilters({ ...draftFilters, maxBudget: e.target.value })}
        />
        <select
          className="input"
          value={draftFilters.isRemote}
          onChange={(e) => setDraftFilters({ ...draftFilters, isRemote: e.target.value })}
        >
          <option value="">Remote or local</option>
          <option value="true">Remote only</option>
          <option value="false">Local only</option>
        </select>
        <button className="btn-accent">
          <SearchIcon size={15} /> Search
        </button>
      </form>

      {isLoading ? (
        <LoadingSpinner />
      ) : gigs.length === 0 ? (
        <EmptyState title="No gigs match your filters" description="Try widening your search criteria." />
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {gigs.map((gig) => (
              <GigCard key={gig._id} gig={gig} />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 rounded-md text-sm font-medium ${
                    p === page ? 'bg-ink-900 text-white' : 'text-ink-400 hover:bg-ink-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GigMarketplace;
