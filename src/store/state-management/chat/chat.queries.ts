import * as Constants from './constants';
import { chatServiceInstance } from './chat.service-instance';
import { MODELS } from '_types/index';
import { QUERIES } from 'rise-core-frontend';

const getConversationQueries = (args: QUERIES.QueryPayload<{ userId: string }>) => {
  return QUERIES.useCustomQuery<MODELS.Conversation1[]>({
    queryKey: [Constants.CHAT_KEYS.GET_ALL_CONVERSATIONS],
    queryFn: () => chatServiceInstance().getConversation(args?.params?.userId!),
    options: args.queryOptions,
  });
};

const getMessagesQueries = (
  args: QUERIES.QueryPayload<{
    data: {
      userId: string;
      conversationId: string;
    };
  }>,
) => {
  const { params, queryOptions } = args;
  return QUERIES.useCustomQuery<MODELS.Conversation1[]>({
    queryKey: [Constants.CHAT_KEYS.GET_MESSAGES],
    queryFn: () => chatServiceInstance().getMessages(params?.data!),
    options: {
      ...queryOptions,
      enabled: !!args.params?.data && (queryOptions?.enabled ?? true),
    },
  });
};

const createConversationMutation = (
  args: QUERIES.MutationPayload<{ recipientId: string }, any, { userId: string }>,
) => {
  return QUERIES.useCustomMutation<{ recipientId: string }, any, { userId: string }>({
    mutationKey: [Constants.CHAT_KEYS.CONVERSATION],
    mutationFn: ({ payload, params }) =>
      chatServiceInstance().createConversation(params?.userId!, payload?.recipientId!),
    options: args.mutationOptions,
  });
};

export { createConversationMutation, getConversationQueries, getMessagesQueries };
