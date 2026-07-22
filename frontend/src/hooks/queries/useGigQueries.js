import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gigApi, proposalApi, searchApi } from '../../api/endpoints';
import { qk } from './keys';

// ---------- Gigs ----------
export const useGigsList = (params, options = {}) =>
  useQuery({
    queryKey: qk.gigs.list(params),
    queryFn: () => gigApi.getGigs(params).then((r) => r.data),
    ...options,
  });

export const useGig = (id, options = {}) =>
  useQuery({
    queryKey: qk.gigs.detail(id),
    queryFn: () => gigApi.getGigById(id).then((r) => r.data.gig),
    enabled: !!id,
    ...options,
  });

export const useGigRecommendations = (id, options = {}) =>
  useQuery({
    queryKey: qk.gigs.recommendations(id),
    queryFn: () => gigApi.getRecommendations(id).then((r) => r.data.recommendations),
    enabled: !!id,
    ...options,
  });

export const useCreateGig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => gigApi.createGig(data).then((r) => r.data.gig),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gigs'] }),
  });
};

export const useUpdateGig = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => gigApi.updateGig(id, data).then((r) => r.data.gig),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.gigs.detail(id) });
      qc.invalidateQueries({ queryKey: ['gigs', 'list'] });
    },
  });
};

export const useDeleteGig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => gigApi.deleteGig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gigs'] }),
  });
};

export const useInviteFreelancer = (gigId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (freelancerUserId) => gigApi.inviteFreelancer(gigId, freelancerUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.gigs.detail(gigId) }),
  });
};

export const useUpdateMilestone = (gigId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, data }) => gigApi.updateMilestone(gigId, milestoneId, data).then((r) => r.data.gig),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.gigs.detail(gigId) }),
  });
};

// ---------- Proposals ----------
export const useProposalsForGig = (gigId, options = {}) =>
  useQuery({
    queryKey: qk.proposals.forGig(gigId),
    queryFn: () => proposalApi.getForGig(gigId).then((r) => r.data.proposals),
    enabled: !!gigId,
    ...options,
  });

export const useMyProposals = (options = {}) =>
  useQuery({
    queryKey: qk.proposals.mine(),
    queryFn: () => proposalApi.getMine().then((r) => r.data.proposals),
    ...options,
  });

export const useSubmitProposal = (gigId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => proposalApi.submit(gigId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.gigs.detail(gigId) });
      qc.invalidateQueries({ queryKey: qk.proposals.mine() });
    },
  });
};

export const useAcceptProposal = (gigId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId) => proposalApi.accept(proposalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.gigs.detail(gigId) });
      qc.invalidateQueries({ queryKey: qk.proposals.forGig(gigId) });
    },
  });
};

export const useRejectProposal = (gigId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId) => proposalApi.reject(proposalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.proposals.forGig(gigId) }),
  });
};

export const useWithdrawProposal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId) => proposalApi.withdraw(proposalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.proposals.mine() }),
  });
};

// ---------- Search ----------
export const useSearchGigs = (params, options = {}) =>
  useQuery({
    queryKey: qk.search.gigs(params),
    queryFn: () => searchApi.gigs(params).then((r) => r.data),
    ...options,
  });

export const useSearchFreelancers = (params, options = {}) =>
  useQuery({
    queryKey: qk.search.freelancers(params),
    queryFn: () => searchApi.freelancers(params).then((r) => r.data.freelancers),
    ...options,
  });

export const useTrendingSkills = (options = {}) =>
  useQuery({
    queryKey: qk.search.trending(),
    queryFn: () => searchApi.trendingSkills().then((r) => r.data.trending),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
