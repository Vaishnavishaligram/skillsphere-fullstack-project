import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Send,
  Search,
  MessageSquare,
  Star,
  CreditCard,
  ShieldCheck,
  Flag,
  User,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  client: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/gigs/mine', label: 'My Gigs', icon: Briefcase },
    { to: '/gigs/create', label: 'Post a Gig', icon: PlusCircle },
    { to: '/search', label: 'Find Talent', icon: Search },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  freelancer: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/gigs', label: 'Marketplace', icon: Briefcase },
    { to: '/proposals/mine', label: 'My Proposals', icon: Send },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/gigs', label: 'Gigs', icon: Briefcase },
    { to: '/admin/disputes', label: 'Disputes', icon: ShieldCheck },
    { to: '/admin/reviews', label: 'Review moderation', icon: Flag },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ],
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = NAV_BY_ROLE[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-ink-100 bg-white shrink-0">
        <div className="px-5 py-5 border-b border-ink-100">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-ink-100">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-xs font-semibold text-ink-600 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">{user?.name}</p>
              <p className="text-xs text-ink-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full">
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-white md:bg-transparent">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
