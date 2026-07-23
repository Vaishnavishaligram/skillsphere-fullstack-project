import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../hooks/queries/useNotificationQueries';
import NotificationIcon from '../../components/NotificationIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const timeAgo = (date) => {
  const diffMs = Date.now() - new Date(date);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationsPage = () => {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-ink-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={() => markAllRead.mutate()} className="text-sm text-pin font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`card p-4 flex items-start gap-3 ${!n.isRead ? 'border-pin/40' : ''}`}
            >
              <NotificationIcon type={n.type} />
              <div onClick={() => !n.isRead && markRead.mutate(n._id)} className="cursor-pointer flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900">{n.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-ink-300 mt-1 font-mono">{timeAgo(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link to={n.link} className="text-xs text-pin font-medium hover:underline">
                    View
                  </Link>
                )}
                <button onClick={() => deleteNotification.mutate(n._id)} className="text-ink-300 hover:text-rose">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
