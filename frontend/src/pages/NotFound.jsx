import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
    <Logo />
    <svg width="72" height="72" viewBox="0 0 32 32" fill="none" className="my-8 opacity-30">
      <circle cx="8" cy="24" r="3" fill="#0F8A8A" />
      <circle cx="24" cy="8" r="3" fill="#AEB9CE" />
      <line x1="8" y1="24" x2="24" y2="8" stroke="#DAD5C9" strokeWidth="1.5" strokeDasharray="4 4" />
    </svg>
    <h1 className="text-2xl font-display font-semibold text-ink-900 mb-2">Lost connection</h1>
    <p className="text-sm text-ink-400 mb-6 max-w-sm">
      This page doesn't exist, or the node you're looking for has moved.
    </p>
    <Link to="/dashboard" className="btn-accent">
      Back to dashboard
    </Link>
  </div>
);

export default NotFound;
