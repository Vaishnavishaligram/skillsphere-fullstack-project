import { Outlet, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const AuthLayout = () => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 py-12">
        <Link to="/" className="mb-10 inline-block w-fit">
          <Logo />
        </Link>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>

      {/* Right: signature node-network panel */}
      <div className="hidden lg:flex relative bg-ink-900 items-center justify-center overflow-hidden">
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-40" fill="none">
          <circle cx="80" cy="320" r="5" fill="#0F8A8A" />
          <circle cx="200" cy="120" r="5" fill="#FFB100" />
          <circle cx="320" cy="280" r="5" fill="#FFFFFF" />
          <circle cx="120" cy="140" r="4" fill="#0F8A8A" opacity="0.6" />
          <circle cx="300" cy="100" r="4" fill="#FFB100" opacity="0.6" />
          <line x1="80" y1="320" x2="200" y2="120" stroke="#2B3B5C" strokeWidth="1" />
          <line x1="200" y1="120" x2="320" y2="280" stroke="#2B3B5C" strokeWidth="1" />
          <line x1="80" y1="320" x2="320" y2="280" stroke="#2B3B5C" strokeWidth="1" />
          <line x1="120" y1="140" x2="200" y2="120" stroke="#2B3B5C" strokeWidth="1" />
          <line x1="300" y1="100" x2="200" y2="120" stroke="#2B3B5C" strokeWidth="1" />
        </svg>
        <div className="relative z-10 max-w-sm px-10 text-center">
          <p className="eyebrow text-ink-200 mb-3">Hyperlocal • AI-matched • Escrow-secured</p>
          <h2 className="text-3xl font-display font-semibold text-white leading-tight">
            Local talent, matched by what your project actually needs.
          </h2>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
