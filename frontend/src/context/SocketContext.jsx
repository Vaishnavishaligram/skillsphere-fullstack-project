import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { notificationReceived } from '../store/notificationsSlice';
import { queryClient } from '../lib/queryClient';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://skillsphere-backend-gwul.onrender.com/";

// Maps each real-time notification type to where its cached server data
// lives, so a live event invalidates exactly the React Query caches a
// component might currently be reading - e.g. a freelancer sees a new
// matching gig show up in the marketplace list without refreshing.
const invalidateForNotificationType = (type) => {
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  switch (type) {
    case 'new_gig_posted':
      queryClient.invalidateQueries({ queryKey: ['gigs', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['search', 'gigs'] });
      break;
    case 'proposal_received':
    case 'proposal_accepted':
    case 'proposal_rejected':
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['gigs', 'detail'] });
      break;
    case 'payment_received':
    case 'payment_released':
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      break;
    case 'review_received':
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      break;
    case 'review_flagged':
      queryClient.invalidateQueries({ queryKey: ['reviews', 'flagged'] });
      break;
    case 'milestone_update':
    case 'gig_invitation':
      queryClient.invalidateQueries({ queryKey: ['gigs', 'detail'] });
      break;
    case 'dispute_raised':
    case 'dispute_resolved':
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      break;
    default:
      break;
  }
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!user || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Central real-time notification handler (emitted by the backend's
    // utils/notify.js for every notification type - new gig posted,
    // proposal accepted, payment received, review added, etc). Updates the
    // Redux unread badge instantly, refreshes the relevant React Query
    // caches, and surfaces a toast so the person sees it without opening
    // the bell dropdown.
    socket.on('notification', (notification) => {
      dispatch(notificationReceived(notification));
      invalidateForNotificationType(notification.type);
      toast(notification.title, { icon: '🔔' });
    });

    socket.on('new_message_notification', () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'inbox'] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, dispatch]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
