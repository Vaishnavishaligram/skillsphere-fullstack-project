import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, adminApi } from '../../api/endpoints';
import { qk } from './keys';

export const useReviewsForUser = (userId, options = {}) =>
  useQuery({
    queryKey: qk.reviews.forUser(userId),
    queryFn: () => reviewApi.getForUser(userId).then((r) => r.data.reviews),
    enabled: !!userId,
    ...options,
  });

export const useReviewsForGig = (gigId, options = {}) =>
  useQuery({
    queryKey: qk.reviews.forGig(gigId),
    queryFn: () => reviewApi.getForGig(gigId).then((r) => r.data.reviews),
    enabled: !!gigId,
    ...options,
  });

// Weighted-reputation breakdown: rating distribution, sub-score averages,
// verified-vs-unverified counts, and a 6-month trend.
export const useReviewAnalytics = (userId, options = {}) =>
  useQuery({
    queryKey: qk.reviews.analytics(userId),
    queryFn: () => reviewApi.getAnalytics(userId).then((r) => r.data.analytics),
    enabled: !!userId,
    ...options,
  });

export const useCreateReview = (gigId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => reviewApi.create(gigId, data),
    onSuccess: (_data, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: qk.reviews.forGig(gigId) });
      qc.invalidateQueries({ queryKey: qk.gigs.detail(gigId) });
      // Reviewee's user id isn't known here without the gig payload, so also
      // broadly invalidate all "reviews.forUser"/"analytics" entries; cheap
      // since review lists are lightweight and infrequent to refetch.
      qc.invalidateQueries({ queryKey: ['reviews', 'user'] });
      qc.invalidateQueries({ queryKey: ['reviews', 'analytics'] });
    },
  });
};

// ---------- Fraud moderation (admin) ----------
export const useFlaggedReviews = (options = {}) =>
  useQuery({
    queryKey: qk.reviews.flagged(),
    queryFn: () => adminApi.getFlaggedReviews().then((r) => r.data.reviews),
    ...options,
  });

export const useModerateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }) => adminApi.moderateReview(id, { action, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reviews.flagged() });
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};
