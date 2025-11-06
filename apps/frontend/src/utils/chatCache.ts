import type { Message, Conversation } from "@iagent/chat-types";
import { buildParsedMessageContent } from "@iagent/chat-types";

const CHAT_LIST_CACHE_KEY = "chat-list-cache";
const CHAT_LIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CHAT_CACHE_PREFIX = "chat-cache-";
const CHAT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_CHAT_KEY = "current-chat-id";
const STREAMING_CHAT_KEY = "streaming-chat-id";

interface ChatListCache {
  chats: Array<{
    id: string;
    name: string;
    lastMessageAt: string;
    messageCount: number;
  }>;
  timestamp: number;
}

interface ChatCache {
  conversation: Conversation;
  timestamp: number;
}

export const chatCache = {
  getChatListCache(): ChatListCache | null {
    try {
      const cached = localStorage.getItem(CHAT_LIST_CACHE_KEY);
      if (!cached) return null;

      const data: ChatListCache = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp > CHAT_LIST_CACHE_TTL) {
        localStorage.removeItem(CHAT_LIST_CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Failed to get chat list cache:", error);
      return null;
    }
  },

  setChatListCache(chats: Array<{ id: string; name: string; lastMessageAt: string; messageCount: number }>): void {
    try {
      const cache: ChatListCache = {
        chats,
        timestamp: Date.now(),
      };
      localStorage.setItem(CHAT_LIST_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error("Failed to set chat list cache:", error);
    }
  },

  getCurrentChatId(): string | null {
    try {
      return localStorage.getItem(CURRENT_CHAT_KEY);
    } catch (error) {
      console.error("Failed to get current chat ID:", error);
      return null;
    }
  },

  setCurrentChatId(chatId: string | null): void {
    try {
      if (chatId) {
        localStorage.setItem(CURRENT_CHAT_KEY, chatId);
      } else {
        localStorage.removeItem(CURRENT_CHAT_KEY);
      }
    } catch (error) {
      console.error("Failed to set current chat ID:", error);
    }
  },

  getStreamingChatId(): string | null {
    try {
      return localStorage.getItem(STREAMING_CHAT_KEY);
    } catch (error) {
      console.error("Failed to get streaming chat ID:", error);
      return null;
    }
  },

  setStreamingChatId(chatId: string | null): void {
    try {
      if (chatId) {
        localStorage.setItem(STREAMING_CHAT_KEY, chatId);
      } else {
        localStorage.removeItem(STREAMING_CHAT_KEY);
      }
    } catch (error) {
      console.error("Failed to set streaming chat ID:", error);
    }
  },

  getChat(chatId: string): Conversation | null {
    try {
      const cached = localStorage.getItem(`${CHAT_CACHE_PREFIX}${chatId}`);
      if (!cached) return null;

      const data: ChatCache = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp > CHAT_CACHE_TTL) {
        localStorage.removeItem(`${CHAT_CACHE_PREFIX}${chatId}`);
        return null;
      }

      const conv = data.conversation;
      return {
        ...conv,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: typeof msg.timestamp === "string" ? new Date(msg.timestamp) : msg.timestamp,
        })) as Message[],
        createdAt: typeof conv.createdAt === "string" ? new Date(conv.createdAt) : conv.createdAt,
        updatedAt: typeof conv.updatedAt === "string" ? new Date(conv.updatedAt) : conv.updatedAt,
        lastUpdated: typeof conv.lastUpdated === "string" ? new Date(conv.lastUpdated) : conv.lastUpdated,
      };
    } catch (error) {
      console.error("Failed to get chat cache:", error);
      return null;
    }
  },

  setChat(conversation: Conversation): void {
    try {
      const cache: ChatCache = {
        conversation: {
          ...conversation,
          messages: conversation.messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : (msg.timestamp as any),
          })) as any,
          createdAt: conversation.createdAt instanceof Date ? conversation.createdAt.toISOString() : (conversation.createdAt as any),
          updatedAt: conversation.updatedAt instanceof Date ? conversation.updatedAt.toISOString() : (conversation.updatedAt as any),
          lastUpdated: conversation.lastUpdated instanceof Date ? conversation.lastUpdated.toISOString() : (conversation.lastUpdated as any),
        },
        timestamp: Date.now(),
      };
      localStorage.setItem(`${CHAT_CACHE_PREFIX}${conversation.id}`, JSON.stringify(cache));
    } catch (error) {
      console.error("Failed to set chat cache:", error);
    }
  },

  removeChat(chatId: string): void {
    try {
      localStorage.removeItem(`${CHAT_CACHE_PREFIX}${chatId}`);
    } catch (error) {
      console.error("Failed to remove chat cache:", error);
    }
  },

  clearCache(): void {
    try {
      localStorage.removeItem(CHAT_LIST_CACHE_KEY);
      localStorage.removeItem(CURRENT_CHAT_KEY);
      localStorage.removeItem(STREAMING_CHAT_KEY);
      
      // Clear all chat caches
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CHAT_CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear chat cache:", error);
    }
  },
};

export const convertMongoMessageToCustomMarkup = (mongoMessage: {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
  filterId?: string | null;
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, unknown>;
  } | null;
}): Message => {
  const parsed = buildParsedMessageContent(mongoMessage.content);

  return {
    id: mongoMessage.id,
    role: mongoMessage.role === "system" ? "assistant" : mongoMessage.role,
    content: mongoMessage.content,
    timestamp: typeof mongoMessage.timestamp === "string" 
      ? new Date(mongoMessage.timestamp) 
      : mongoMessage.timestamp,
    isStreaming: false,
    isInterrupted: false,
    filterId: mongoMessage.filterId || null,
    filterSnapshot: mongoMessage.filterSnapshot || null,
    metadata: mongoMessage.metadata,
    parsed,
  };
};

export const convertMongoChatToConversation = (mongoChat: {
  chatId: string;
  name: string;
  userId: string;
  createdAt: Date | string;
  lastMessageAt: Date | string;
  messageCount: number;
  messages?: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date | string;
    metadata?: Record<string, unknown>;
    filterId?: string | null;
    filterSnapshot?: {
      filterId?: string;
      name?: string;
      config?: Record<string, unknown>;
    } | null;
  }>;
}): Conversation => {
  const messages = (mongoChat.messages || []).map(convertMongoMessageToCustomMarkup);

  return {
    id: mongoChat.chatId,
    title: mongoChat.name,
    messages,
    createdAt: typeof mongoChat.createdAt === "string" 
      ? new Date(mongoChat.createdAt) 
      : mongoChat.createdAt,
    updatedAt: typeof mongoChat.lastMessageAt === "string" 
      ? new Date(mongoChat.lastMessageAt) 
      : mongoChat.lastMessageAt,
    lastUpdated: typeof mongoChat.lastMessageAt === "string" 
      ? new Date(mongoChat.lastMessageAt) 
      : mongoChat.lastMessageAt,
  };
};

