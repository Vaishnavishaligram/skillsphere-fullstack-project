import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/endpoints';
import { qk } from './keys';

export const useFreelancerProfile = (id = '', options = {}) =>
  useQuery({
    queryKey: qk.profile.freelancer(id),
    queryFn: () => userApi.getFreelancerProfile(id).then((r) => r.data.profile),
    ...options,
  });

export const useClientProfile = (id = '', options = {}) =>
  useQuery({
    queryKey: qk.profile.client(id),
    queryFn: () => userApi.getClientProfile(id).then((r) => r.data.profile),
    ...options,
  });

export const useFreelancerAnalytics = (options = {}) =>
  useQuery({
    queryKey: qk.profile.freelancerAnalytics(),
    queryFn: () => userApi.getFreelancerAnalytics().then((r) => r.data.analytics),
    ...options,
  });

export const useUpdateBasicProfile = () =>
  useMutation({
    mutationFn: (formData) => userApi.updateBasicProfile(formData).then((r) => r.data.user),
  });

export const useUpdateFreelancerProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => userApi.updateFreelancerProfile(data).then((r) => r.data.profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'freelancer'] }),
  });
};

export const useUpdateClientProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => userApi.updateClientProfile(data).then((r) => r.data.profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'client'] }),
  });
};

export const useUploadFreelancerFile = () =>
  useMutation({
    mutationFn: (formData) => userApi.uploadFreelancerFile(formData).then((r) => r.data),
  });
