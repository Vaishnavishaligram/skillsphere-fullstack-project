import { Link } from 'react-router-dom';
import { Briefcase, Send, Star, Eye, TrendingUp, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFreelancerAnalytics } from '../hooks/queries/useProfileQueries';
import { useMyProposals, useGigsList } from '../hooks/queries/useGigQueries';
import { useAdminAnalytics } from '../hooks/queries/useAdminQueries';
import LoadingSpinner from '../components/LoadingSpinner';
import GigCard from '../components/GigCard';

const ChartTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-900 text-white text-xs rounded-md px-3 py-2 shadow-pin">
      <p className="font-mono opacity-70 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono font-semibold">
          {prefix}
          {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="eyebrow">{label}</span>
      <Icon size={16} className="text-ink-300" />
    </div>
    <p className="text-2xl font-display font-semibold text-ink-900">{value}</p>
  </div>
);

const FreelancerOverview = () => {
  const { data: analytics, isLoading: loadingAnalytics } = useFreelancerAnalytics();
  const { data: proposals = [], isLoading: loadingProposals } = useMyProposals();
  const { data: gigsData, isLoading: loadingGigs } = useGigsList({ limit: 3 });

  if (loadingAnalytics || loadingProposals || loadingGigs) return <LoadingSpinner />;

  const recentProposals = proposals.slice(0, 3);
  const gigs = gigsData?.gigs || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Profile Views" value={analytics?.profileViews ?? 0} />
        <StatCard icon={Briefcase} label="Completed Gigs" value={analytics?.completedGigs ?? 0} />
        <StatCard icon={TrendingUp} label="Earnings" value={`₹${analytics?.totalEarnings?.toLocaleString() ?? 0}`} />
        <StatCard icon={Star} label="Rating" value={analytics?.ratingAverage?.toFixed(1) ?? '—'} />
      </div>

      {analytics?.monthlyEarnings?.some((m) => m.earnings > 0) && (
        <section className="card p-5">
          <h2 className="font-display font-semibold text-ink-900 mb-4">Monthly earnings</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.monthlyEarnings} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#EEF0F5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="earnings" stroke="#0F8A8A" strokeWidth={2.5} dot={{ r: 4, fill: '#0F8A8A' }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-ink-900">Recent proposals</h2>
          <Link to="/proposals/mine" className="text-sm text-pin font-medium hover:underline">
            View all
          </Link>
        </div>
        {recentProposals.length === 0 ? (
          <p className="text-sm text-ink-400">You haven't submitted any proposals yet.</p>
        ) : (
          <div className="space-y-2">
            {recentProposals.map((p) => (
              <div key={p._id} className="card p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-900">{p.gig?.title}</span>
                <span className="text-xs text-ink-400 capitalize">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-ink-900">New gigs for you</h2>
          <Link to="/gigs" className="text-sm text-pin font-medium hover:underline">
            Browse marketplace
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {gigs.map((g) => (
            <GigCard key={g._id} gig={g} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ClientOverview = () => {
  const { data: gigsData, isLoading } = useGigsList({ limit: 50, status: undefined });

  if (isLoading) return <LoadingSpinner />;

  const gigs = gigsData?.gigs || [];
  const openCount = gigs.filter((g) => g.status === 'open').length;
  const inProgressCount = gigs.filter((g) => g.status === 'in_progress').length;
  const completedCount = gigs.filter((g) => g.status === 'completed').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Open Gigs" value={openCount} />
        <StatCard icon={Send} label="In Progress" value={inProgressCount} />
        <StatCard icon={Star} label="Completed" value={completedCount} />
        <StatCard icon={Users} label="Total Posted" value={gigs.length} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-ink-900">Your gigs</h2>
          <Link to="/gigs/create" className="text-sm text-pin font-medium hover:underline">
            Post a new gig
          </Link>
        </div>
        {gigs.length === 0 ? (
          <p className="text-sm text-ink-400">You haven't posted any gigs yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {gigs.slice(0, 6).map((g) => (
              <GigCard key={g._id} gig={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const AdminOverview = () => {
  const { data: analytics, isLoading } = useAdminAnalytics();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={analytics?.totalUsers} />
        <StatCard icon={Briefcase} label="Active Gigs" value={analytics?.activeGigs} />
        <StatCard icon={Star} label="Job Success Rate" value={`${analytics?.jobSuccessRate}%`} />
        <StatCard icon={TrendingUp} label="Platform Revenue" value={`₹${analytics?.platformRevenue?.toLocaleString()}`} />
        <StatCard icon={Briefcase} label="Completed Gigs" value={analytics?.completedGigs} />
        <StatCard icon={Send} label="Disputed Gigs" value={analytics?.disputedGigs} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-ink-900 mb-4">Platform revenue · last 6 months</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics?.monthlyRevenue || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#EEF0F5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#FFB100" strokeWidth={2.5} dot={{ r: 4, fill: '#FFB100' }} />
              <Line type="monotone" dataKey="volume" stroke="#AEB9CE" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-ink-400 mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-signal mr-1" /> Platform fee revenue ·{' '}
            <span className="inline-block w-2 h-2 rounded-full bg-ink-200 mr-1" /> Total payment volume
          </p>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-ink-900 mb-4">Top categories</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics?.topCategories || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#EEF0F5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#5A6C93' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="_id"
                tick={{ fontSize: 11, fill: '#5A6C93' }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<ChartTooltip prefix="" />} />
              <Bar dataKey="count" fill="#0F8A8A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-1">
        {user?.role === 'admin' ? 'Platform overview' : `Welcome back, ${user?.name?.split(' ')[0]}`}
      </h1>
      <p className="text-sm text-ink-400 mb-8">
        {user?.role === 'client' && "Here's what's happening across your gigs."}
        {user?.role === 'freelancer' && "Here's your activity and new opportunities."}
        {user?.role === 'admin' && "Here's how the platform is performing."}
      </p>

      {user?.role === 'client' && <ClientOverview />}
      {user?.role === 'freelancer' && <FreelancerOverview />}
      {user?.role === 'admin' && <AdminOverview />}
    </div>
  );
};

export default Dashboard;
