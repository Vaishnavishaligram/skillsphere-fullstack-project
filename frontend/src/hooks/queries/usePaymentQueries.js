import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi, adminApi } from '../../api/endpoints';
import { qk } from './keys';

export const usePaymentHistory = (options = {}) =>
  useQuery({
    queryKey: qk.payments.history(),
    queryFn: () => paymentApi.getHistory().then((r) => r.data.payments),
    ...options,
  });

export const useCreateRazorpayOrder = () =>
  useMutation({
    mutationFn: (data) => paymentApi.createRazorpayOrder(data).then((r) => r.data),
  });

export const useVerifyRazorpayPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => paymentApi.verifyRazorpay(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.payments.history() }),
  });
};

export const useReleasePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId) => paymentApi.release(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.payments.history() });
      qc.invalidateQueries({ queryKey: ['gigs', 'detail'] });
    },
  });
};

export const useAdminAllPayments = (params, options = {}) =>
  useQuery({
    queryKey: qk.payments.all(params),
    queryFn: () => adminApi.getAllPayments(params).then((r) => r.data.payments),
    ...options,
  });
