import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';
import type { Conversation } from '@iagent/chat-types';
import { getBaseApiUrl } from '../../config/config';
import { convertMongoMessageToMessage } from '../../utils/chunkConverter';

export interface ChatDocument {
  chatId: string;
  name: string;
  userId: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  archived: boolean;
}

export interface ChatMessageDocument {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  chatId: string;
  userId: string;
  metadata?: Record<string, unknown>;
  filterId?: string | null;
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, unknown>;
  } | null;
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('session-token');
};

const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('user-id');
};

const mapChatDocumentToConversation = (chat: ChatDocument, messages: ChatMessageDocument[]): Conversation => {
  return {
    id: chat.chatId,
    title: chat.name,
    messages: messages.map((msg) => convertMongoMessageToMessage({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
      filterId: msg.filterId,
      filterSnapshot: msg.filterSnapshot,
    })),
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.lastMessageAt),
    lastUpdated: new Date(chat.lastMessageAt),
  };
};

export const useChats = () => {
  return useQuery({
    queryKey: apiKeys.chats.list(),
    queryFn: async (): Promise<ChatDocument[]> => {
      const token = getAuthToken();
      if (!token) return [];

      const baseUrl = getBaseApiUrl();
      const response = await http.get<ChatDocument[]>(`${baseUrl}/api/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!getAuthToken(),
  });
};

export const useChat = (chatId: string | number | null) => {
  return useQuery({
    queryKey: apiKeys.chats.detail(chatId || ''),
    queryFn: async (): Promise<Conversation | null> => {
      if (!chatId) return null;

      const token = getAuthToken();
      if (!token) return null;

      const baseUrl = getBaseApiUrl();

      const chatResponse = await http.get<ChatDocument>(`${baseUrl}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const messagesResponse = await http.get<ChatMessageDocument[]>(
        `${baseUrl}/api/chats/${chatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return mapChatDocumentToConversation(chatResponse.data, messagesResponse.data);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!chatId && !!getAuthToken(),
  });
};

export const useChatMessages = (chatId: string | number | null) => {
  return useQuery({
    queryKey: apiKeys.chats.messages(chatId || ''),
    queryFn: async (): Promise<ChatMessageDocument[]> => {
      if (!chatId) return [];

      const token = getAuthToken();
      if (!token) return [];

      const baseUrl = getBaseApiUrl();
      const response = await http.get<ChatMessageDocument[]>(`${baseUrl}/api/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!chatId && !!getAuthToken(),
  });
};

export const useCreateChat = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, name }: { chatId: string; name: string }): Promise<ChatDocument> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const baseUrl = getBaseApiUrl();
      const response = await http.post<ChatDocument>(
        `${baseUrl}/api/chats`,
        { chatId, name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: apiKeys.chats.list() });
    },
  });
};

export const useUpdateChatName = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, name }: { chatId: string; name: string }): Promise<void> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const baseUrl = getBaseApiUrl();
      await http.put(
        `${baseUrl}/api/chats/${chatId}/name`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onMutate: async ({ chatId, name }) => {
      await qc.cancelQueries({ queryKey: apiKeys.chats.detail(chatId) });
      await qc.cancelQueries({ queryKey: apiKeys.chats.list() });

      const prevChat = qc.getQueryData<Conversation | null>(apiKeys.chats.detail(chatId));
      const prevList = qc.getQueryData<ChatDocument[]>(apiKeys.chats.list());

      if (prevChat) {
        qc.setQueryData(apiKeys.chats.detail(chatId), {
          ...prevChat,
          title: name,
        });
      }

      if (prevList) {
        qc.setQueryData(
          apiKeys.chats.list(),
          prevList.map((chat) => (chat.chatId === chatId ? { ...chat, name } : chat))
        );
      }

      return { prevChat, prevList };
    },
    onError: (_error, { chatId }, context) => {
      if (context?.prevChat) {
        qc.setQueryData(apiKeys.chats.detail(chatId), context.prevChat);
      }
      if (context?.prevList) {
        qc.setQueryData(apiKeys.chats.list(), context.prevList);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: apiKeys.chats.list() });
    },
  });
};

export const useDeleteChat = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string): Promise<void> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const baseUrl = getBaseApiUrl();
      await http.delete(`${baseUrl}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onMutate: async (chatId) => {
      await qc.cancelQueries({ queryKey: apiKeys.chats.detail(chatId) });
      await qc.cancelQueries({ queryKey: apiKeys.chats.list() });

      const prevChat = qc.getQueryData<Conversation | null>(apiKeys.chats.detail(chatId));
      const prevList = qc.getQueryData<ChatDocument[]>(apiKeys.chats.list());

      qc.setQueryData(apiKeys.chats.detail(chatId), null);

      if (prevList) {
        qc.setQueryData(
          apiKeys.chats.list(),
          prevList.filter((chat) => chat.chatId !== chatId)
        );
      }

      return { prevChat, prevList };
    },
    onError: (_error, chatId, context) => {
      if (context?.prevChat) {
        qc.setQueryData(apiKeys.chats.detail(chatId), context.prevChat);
      }
      if (context?.prevList) {
        qc.setQueryData(apiKeys.chats.list(), context.prevList);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: apiKeys.chats.list() });
    },
  });
};

export const useSaveMessage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      message,
    }: {
      chatId: string;
      message: {
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        metadata?: Record<string, unknown>;
        filterId?: string | null;
        filterSnapshot?: unknown;
      };
    }): Promise<void> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const baseUrl = getBaseApiUrl();
      await http.post(
        `${baseUrl}/api/chats/${chatId}/messages`,
        {
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          metadata: message.metadata || {},
          filterId: message.filterId || null,
          filterSnapshot: message.filterSnapshot || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onMutate: async ({ chatId, message }) => {
      await qc.cancelQueries({ queryKey: apiKeys.chats.messages(chatId) });
      await qc.cancelQueries({ queryKey: apiKeys.chats.detail(chatId) });

      const prevMessages = qc.getQueryData<ChatMessageDocument[]>(apiKeys.chats.messages(chatId));
      const prevChat = qc.getQueryData<Conversation | null>(apiKeys.chats.detail(chatId));

      const userId = prevMessages?.[0]?.userId || getUserId() || '';

      const messageDocument: ChatMessageDocument = {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        chatId,
        userId,
        metadata: message.metadata,
        filterId: message.filterId || null,
        filterSnapshot: message.filterSnapshot as ChatMessageDocument['filterSnapshot'] || null,
      };

      if (prevMessages) {
        const existingIndex = prevMessages.findIndex((msg) => msg.id === message.id);
        if (existingIndex >= 0) {
          qc.setQueryData(apiKeys.chats.messages(chatId), [
            ...prevMessages.slice(0, existingIndex),
            messageDocument,
            ...prevMessages.slice(existingIndex + 1),
          ]);
        } else {
          qc.setQueryData(apiKeys.chats.messages(chatId), [...prevMessages, messageDocument]);
        }
      }

      if (prevChat) {
        const existingMessageIndex = prevChat.messages.findIndex((msg) => msg.id === message.id);
        const conversationMessage = {
          id: message.id,
          role: message.role === 'system' ? 'assistant' : message.role,
          content: message.content,
          timestamp: message.timestamp,
          isStreaming: false,
          isInterrupted: false,
          filterId: message.filterId || null,
          filterSnapshot: message.filterSnapshot as Conversation['messages'][0]['filterSnapshot'] || null,
          metadata: message.metadata,
        };

        if (existingMessageIndex >= 0) {
          qc.setQueryData(apiKeys.chats.detail(chatId), {
            ...prevChat,
            messages: [
              ...prevChat.messages.slice(0, existingMessageIndex),
              conversationMessage,
              ...prevChat.messages.slice(existingMessageIndex + 1),
            ],
            lastUpdated: message.timestamp,
            updatedAt: message.timestamp,
          });
        } else {
          qc.setQueryData(apiKeys.chats.detail(chatId), {
            ...prevChat,
            messages: [...prevChat.messages, conversationMessage],
            lastUpdated: message.timestamp,
            updatedAt: message.timestamp,
          });
        }
      }

      return { prevMessages, prevChat };
    },
    onError: (_error, { chatId }, context) => {
      if (context?.prevMessages) {
        qc.setQueryData(apiKeys.chats.messages(chatId), context.prevMessages);
      }
      if (context?.prevChat) {
        qc.setQueryData(apiKeys.chats.detail(chatId), context.prevChat);
      }
    },
  });
};

export const useDeleteMessage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, messageId }: { chatId: string; messageId: string }): Promise<void> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const baseUrl = getBaseApiUrl();
      await http.delete(`${baseUrl}/api/chats/${chatId}/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onMutate: async ({ chatId, messageId }) => {
      await qc.cancelQueries({ queryKey: apiKeys.chats.messages(chatId) });
      await qc.cancelQueries({ queryKey: apiKeys.chats.detail(chatId) });

      const prevMessages = qc.getQueryData<ChatMessageDocument[]>(apiKeys.chats.messages(chatId));
      const prevChat = qc.getQueryData<Conversation | null>(apiKeys.chats.detail(chatId));

      if (prevMessages) {
        const messageIndex = prevMessages.findIndex((msg) => msg.id === messageId);
        if (messageIndex >= 0) {
          qc.setQueryData(apiKeys.chats.messages(chatId), prevMessages.slice(0, messageIndex));
        }
      }

      if (prevChat) {
        const messageIndex = prevChat.messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex >= 0) {
          qc.setQueryData(apiKeys.chats.detail(chatId), {
            ...prevChat,
            messages: prevChat.messages.slice(0, messageIndex),
          });
        }
      }

      return { prevMessages, prevChat };
    },
    onError: (_error, { chatId }, context) => {
      if (context?.prevMessages) {
        qc.setQueryData(apiKeys.chats.messages(chatId), context.prevMessages);
      }
      if (context?.prevChat) {
        qc.setQueryData(apiKeys.chats.detail(chatId), context.prevChat);
      }
    },
    onSettled: (_data, _error, { chatId }) => {
      qc.invalidateQueries({ queryKey: apiKeys.chats.messages(chatId) });
      qc.invalidateQueries({ queryKey: apiKeys.chats.detail(chatId) });
    },
  });
};

