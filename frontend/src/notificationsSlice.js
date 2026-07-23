import { createSlice } from '@reduxjs/toolkit';

// This slice only tracks the live unread count for instant UI feedback
// (e.g. the bell badge) the moment a Socket.IO 'notification' event arrives.
// The actual notification list/pagination is server state, owned by React
// Query (see hooks/useNotifications.js) and refetched alongside this.
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    latest: null, // most recent live notification, used to drive toast + query invalidation
  },
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    notificationReceived: (state, action) => {
      state.unreadCount += 1;
      state.latest = action.payload;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, incrementUnread, notificationReceived, resetUnread } = notificationsSlice.actions;
export default notificationsSlice.reducer;
