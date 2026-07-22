import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, gigApi } from '../../api/endpoints';
import { qk } from './keys';

export const useAdminUsers = (params, options = {}) =>
  useQuery({
    queryKey: qk.admin.users(params),
    queryFn: () => adminApi.getUsers(params).then((r) => r.data.users),
    ...options,
  });

export const useSuspendUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.suspendUser(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

export const useReinstateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.reinstateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

export const useVerifyFreelancerAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.verifyFreelancer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

export const useApproveGigAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.approveGig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gigs'] });
      qc.invalidateQueries({ queryKey: ['admin', 'gigs'] });
    },
  });
};

export const useRejectGigAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectGig(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gigs'] });
      qc.invalidateQueries({ queryKey: ['admin', 'gigs'] });
    },
  });
};

export const useAdminAnalytics = (options = {}) =>
  useQuery({
    queryKey: qk.admin.analytics(),
    queryFn: () => adminApi.getAnalytics().then((r) => r.data.analytics),
    ...options,
  });

export const useFraudFlags = (options = {}) =>
  useQuery({
    queryKey: qk.admin.fraudFlags(),
    queryFn: () => adminApi.getFraudFlags().then((r) => r.data.flags),
    ...options,
  });

export const useAdminLogs = (options = {}) =>
  useQuery({
    queryKey: qk.admin.logs(),
    queryFn: () => adminApi.getLogs().then((r) => r.data.logs),
    ...options,
  });

// The public gig list endpoint defaults to status=open, so the admin gig
// management table (which needs every status) fetches each status in
// parallel inside one query function rather than calling the gigs hook in a
// loop (which would break the rules of hooks for a variable-length list).
const ADMIN_GIG_STATUSES = ['open', 'in_progress', 'completed', 'cancelled', 'disputed', 'draft'];

export const useAdminGigsList = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'gigs', 'all'],
    queryFn: async () => {
      const results = await Promise.all(ADMIN_GIG_STATUSES.map((s) => gigApi.getGigs({ status: s, limit: 30 })));
      return results.flatMap((r) => r.data.gigs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    ...options,
  });
};
