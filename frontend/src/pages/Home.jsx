import { Link, Navigate } from 'react-router-dom';
import { Sparkles, MapPin, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost btn-sm">
            Sign in
          </Link>
          <Link to="/register" className="btn-accent btn-sm">
            Get started
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-12 pb-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Hyperlocal freelance ecosystem</p>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-ink-900 leading-[1.1] mb-6">
            Find the right local talent — matched, not just filtered.
          </h1>
          <p className="text-base text-ink-400 mb-8 max-w-lg">
            SkillSphere pairs clients with verified nearby freelancers using AI-matched skills, secures every
            milestone in escrow, and keeps the whole project — chat, proposals, payments — in one place.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/register" className="btn-accent">
              Post a gig
            </Link>
            <Link to="/register" className="btn-outline">
              Find work
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-20">
          <div className="card p-6">
            <Sparkles size={20} className="text-signal-600 mb-3" />
            <h3 className="font-display font-semibold text-ink-900 mb-1">AI-matched gigs</h3>
            <p className="text-sm text-ink-400">Skill-similarity scoring surfaces the best fit, not just the first result.</p>
          </div>
          <div className="card p-6">
            <MapPin size={20} className="text-pin mb-3" />
            <h3 className="font-display font-semibold text-ink-900 mb-1">Hyperlocal by design</h3>
            <p className="text-sm text-ink-400">Discover verified professionals near you, or work remote — your call.</p>
          </div>
          <div className="card p-6">
            <ShieldCheck size={20} className="text-ink-900 mb-3" />
            <h3 className="font-display font-semibold text-ink-900 mb-1">Escrow-secured milestones</h3>
            <p className="text-sm text-ink-400">Funds are held safely and released only when work is approved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
