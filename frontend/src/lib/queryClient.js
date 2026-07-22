import { QueryClient } from '@tanstack/react-query';

// Exported as a plain singleton (not just via context) so that non-component
// code - specifically the Socket.IO 'notification'/'receive_message' handlers
// in context/SocketContext.jsx - can call queryClient.invalidateQueries(...)
// directly when a real-time event arrives, keeping cached server state
// (notifications, unread counts, conversation lists) in sync without a
// manual refetch button anywhere in the app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s - most marketplace data doesn't need to refetch on every focus
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
