import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeApi } from '../../api/endpoints';
import { qk } from './keys';

export const useDisputes = (params, options = {}) =>
  useQuery({
    queryKey: qk.disputes.list(params),
    queryFn: () => disputeApi.getAll(params).then((r) => r.data.disputes),
    ...options,
  });

export const useDispute = (id, options = {}) =>
  useQuery({
    queryKey: qk.disputes.detail(id),
    queryFn: () => disputeApi.getById(id).then((r) => r.data.dispute),
    enabled: !!id,
    ...options,
  });

export const useRaiseDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gigId, formData }) => disputeApi.raise(gigId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
};

export const useReviewDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => disputeApi.review(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
};

export const useResolveDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => disputeApi.resolve(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
};
