import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications, useMarkAllNotificationsRead } from '../hooks/queries/useNotificationQueries';
import NotificationIcon from './NotificationIcon';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Live badge count: driven by Redux, updated instantly on every Socket.IO
  // 'notification' event (see context/SocketContext.jsx) without waiting on
  // a refetch, and reconciled with the server's authoritative count whenever
  // the list below is fetched.
  const unreadCount = useSelector((s) => s.notifications.unreadCount);

  const { data, isLoading } = useNotifications({ limit: 8 });
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-md hover:bg-ink-50 text-ink-600"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose rounded-full" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-ink-100 rounded-card shadow-pin z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <span className="font-semibold text-sm text-ink-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-pin font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-ink-400 text-center py-8">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">You're all caught up</p>
            ) : (
              notifications.map((n) => (
                <Link
                  to={n.link || '/notifications'}
                  key={n._id}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50 ${
                    !n.isRead ? 'bg-pin/5' : ''
                  }`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-pin py-3 border-t border-ink-100 hover:bg-ink-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
