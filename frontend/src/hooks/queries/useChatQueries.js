import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../api/endpoints';
import { qk } from './keys';

export const useInbox = (options = {}) =>
  useQuery({
    queryKey: qk.chat.inbox(),
    queryFn: () => chatApi.getInbox().then((r) => r.data.conversations),
    ...options,
  });

export const useConversation = (userId, options = {}) =>
  useQuery({
    queryKey: qk.chat.conversation(userId),
    queryFn: () => chatApi.getConversation(userId).then((r) => r.data.messages),
    enabled: !!userId,
    ...options,
  });

export const useMarkConversationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => chatApi.markRead(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  });
};
