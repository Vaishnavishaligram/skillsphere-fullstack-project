// Centralized query key factory. Keeping these in one place means an
// invalidation call anywhere in the app (e.g. after a mutation, or from the
// Socket.IO handler) always targets the exact same cache entries a component
// is reading from.
export const qk = {
  gigs: {
    list: (params) => ['gigs', 'list', params],
    detail: (id) => ['gigs', 'detail', id],
    recommendations: (id) => ['gigs', 'recommendations', id],
    mine: () => ['gigs', 'mine'],
  },
  proposals: {
    forGig: (gigId) => ['proposals', 'gig', gigId],
    mine: () => ['proposals', 'mine'],
  },
  search: {
    gigs: (params) => ['search', 'gigs', params],
    freelancers: (params) => ['search', 'freelancers', params],
    trending: () => ['search', 'trending-skills'],
  },
  reviews: {
    forUser: (userId) => ['reviews', 'user', userId],
    forGig: (gigId) => ['reviews', 'gig', gigId],
    analytics: (userId) => ['reviews', 'analytics', userId],
    flagged: () => ['reviews', 'flagged'],
  },
  notifications: {
    list: (params) => ['notifications', 'list', params],
  },
  payments: {
    history: () => ['payments', 'history'],
    all: (params) => ['payments', 'all', params],
  },
  chat: {
    inbox: () => ['chat', 'inbox'],
    conversation: (userId) => ['chat', 'conversation', userId],
  },
  profile: {
    freelancer: (id = '') => ['profile', 'freelancer', id],
    client: (id = '') => ['profile', 'client', id],
    freelancerAnalytics: () => ['profile', 'freelancer', 'analytics'],
  },
  admin: {
    users: (params) => ['admin', 'users', params],
    analytics: () => ['admin', 'analytics'],
    fraudFlags: () => ['admin', 'fraud-flags'],
    logs: () => ['admin', 'logs'],
  },
  disputes: {
    list: (params) => ['disputes', 'list', params],
    detail: (id) => ['disputes', 'detail', id],
  },
};
