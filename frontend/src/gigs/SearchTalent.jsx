import { useState } from 'react';
import { Search as SearchIcon, TrendingUp } from 'lucide-react';
import { useSearchFreelancers, useTrendingSkills } from '../../hooks/queries/useGigQueries';
import FreelancerCard from '../../components/FreelancerCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SearchTalent = () => {
  const [draftFilters, setDraftFilters] = useState({ q: '', skills: '', minRating: '', city: '', verifiedOnly: false });
  const [appliedParams, setAppliedParams] = useState({});

  const { data: freelancers = [], isLoading } = useSearchFreelancers(appliedParams);
  const { data: trending = [] } = useTrendingSkills();

  const applyFilters = (e) => {
    e.preventDefault();
    const params = {};
    if (draftFilters.q) params.q = draftFilters.q;
    if (draftFilters.skills) params.skills = draftFilters.skills;
    if (draftFilters.minRating) params.minRating = draftFilters.minRating;
    if (draftFilters.city) params.city = draftFilters.city;
    if (draftFilters.verifiedOnly) params.verifiedOnly = 'true';
    setAppliedParams(params);
  };

  const selectTrendingSkill = (skill) => {
    setDraftFilters({ ...draftFilters, skills: skill });
    setAppliedParams({ ...appliedParams, skills: skill });
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-1">Find local talent</h1>
      <p className="text-sm text-ink-400 mb-6">Search by skill, rating, and location.</p>

      <form onSubmit={applyFilters} className="card p-4 mb-4 grid sm:grid-cols-2 md:grid-cols-5 gap-3">
        <input
          className="input"
          placeholder="Search by name"
          value={draftFilters.q}
          onChange={(e) => setDraftFilters({ ...draftFilters, q: e.target.value })}
        />
        <input
          className="input"
          placeholder="Skills (comma-separated)"
          value={draftFilters.skills}
          onChange={(e) => setDraftFilters({ ...draftFilters, skills: e.target.value })}
        />
        <input
          className="input"
          placeholder="City"
          value={draftFilters.city}
          onChange={(e) => setDraftFilters({ ...draftFilters, city: e.target.value })}
        />
        <select
          className="input"
          value={draftFilters.minRating}
          onChange={(e) => setDraftFilters({ ...draftFilters, minRating: e.target.value })}
        >
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
        </select>
        <button className="btn-accent">
          <SearchIcon size={15} /> Search
        </button>
      </form>

      <label className="flex items-center gap-2 text-sm text-ink-600 mb-6">
        <input
          type="checkbox"
          checked={draftFilters.verifiedOnly}
          onChange={(e) => setDraftFilters({ ...draftFilters, verifiedOnly: e.target.checked })}
        />
        Verified freelancers only
      </label>

      {trending.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6 text-xs">
          <span className="flex items-center gap-1 text-ink-400 font-mono uppercase tracking-wide">
            <TrendingUp size={13} /> Trending:
          </span>
          {trending.slice(0, 8).map((t) => (
            <button
              key={t._id}
              onClick={() => selectTrendingSkill(t._id)}
              className="px-2 py-1 bg-ink-50 text-ink-600 rounded hover:bg-ink-100"
            >
              {t._id}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : freelancers.length === 0 ? (
        <EmptyState title="No freelancers found" description="Try a broader search." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {freelancers.map((f) => (
            <FreelancerCard key={f._id} freelancer={f} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchTalent;
