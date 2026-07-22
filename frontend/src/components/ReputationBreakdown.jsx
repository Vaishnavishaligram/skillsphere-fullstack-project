import { ShieldCheck, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { useReviewAnalytics } from '../hooks/queries/useReviewQueries';
import LoadingSpinner from './LoadingSpinner';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-900 text-white text-xs rounded-md px-3 py-2 shadow-pin">
      <p className="font-mono opacity-70 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono font-semibold">
          {p.value}
        </p>
      ))}
    </div>
  );
};

const SubScoreBar = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-ink-400">{label}</span>
      <span className="font-mono font-semibold text-ink-900">{value?.toFixed(1) || '—'}</span>
    </div>
    <div className="w-full h-1.5 bg-ink-50 rounded-full overflow-hidden">
      <div className="h-full bg-pin" style={{ width: `${((value || 0) / 5) * 100}%` }} />
    </div>
  </div>
);

// This is the "instead of simple ratings" surface: shows the weighted,
// Bayesian-smoothed reputation score is backed by real signal - not just an
// average - by breaking out verified-vs-total, sub-scores, distribution,
// and trend, all sourced from GET /api/reviews/analytics/:userId.
const ReputationBreakdown = ({ userId }) => {
  const { data: analytics, isLoading } = useReviewAnalytics(userId);

  if (isLoading) return <LoadingSpinner label="Loading reputation" />;
  if (!analytics || analytics.totalCount === 0) {
    return <p className="text-sm text-ink-400">No reviews yet to build a reputation profile from.</p>;
  }

  const hasTrend = analytics.monthlyTrend?.some((m) => m.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <ShieldCheck size={15} className="text-pin" />
          <span className="text-ink-900 font-semibold">{analytics.verifiedCount}</span>
          <span className="text-ink-400">of {analytics.totalCount} reviews verified</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <SubScoreBar label="Communication" value={analytics.avgCommunication} />
        <SubScoreBar label="Quality" value={analytics.avgQuality} />
        <SubScoreBar label="Timeliness" value={analytics.avgTimeliness} />
      </div>

      <div>
        <p className="eyebrow mb-2">Rating distribution</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={analytics.ratingDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#EEF0F5" vertical={false} />
            <XAxis dataKey="rating" tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" fill="#FFB100" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasTrend && (
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> 6-month trend
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={analytics.monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#EEF0F5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} hide />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="avgRating" stroke="#0F8A8A" strokeWidth={2.5} dot={{ r: 3, fill: '#0F8A8A' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ReputationBreakdown;
