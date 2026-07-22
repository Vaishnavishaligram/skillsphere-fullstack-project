import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { notificationApi } from '../../api/endpoints';
import { qk } from './keys';
import { setUnreadCount } from '../../store/notificationsSlice';

export const useNotifications = (params, options = {}) => {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: qk.notifications.list(params),
    queryFn: async () => {
      const { data } = await notificationApi.getAll(params);
      // Keep the Redux live-badge counter in sync with the authoritative
      // server count every time the list is (re)fetched.
      dispatch(setUnreadCount(data.unreadCount));
      return data;
    },
    ...options,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      dispatch(setUnreadCount(0));
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
