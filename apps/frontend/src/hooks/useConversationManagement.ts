import { useState, useCallback, useMemo, useRef } from "react";
import { type Conversation } from "@iagent/chat-types";
import { generateUniqueId } from "../utils/id-generator";
import { useChats, useChat, useCreateChat, useDeleteChat, useUpdateChatName } from "../features/chats/api";
import { deduplicateMessages } from "../utils/messageUtils";

export const useConversationManagement = (
  authToken: string | null,
  userId: string | null,
  translation: (key: string) => string,
  streamingConversationId: string | null
) => {
  const [loadedConversations, setLoadedConversations] = useState<Map<string, Conversation>>(new Map());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const loadedConversationsRef = useRef<Map<string, Conversation>>(new Map());
  loadedConversationsRef.current = loadedConversations;
  const currentConversationIdRef = useRef<string | null>(null);
  currentConversationIdRef.current = currentConversationId;

  const { data: chatsData } = useChats();
  const chatList = useMemo(() => {
    if (!chatsData) return [];
    return chatsData
      .map((chat) => ({
        id: chat.chatId,
        title: chat.name,
        lastUpdated: new Date(chat.lastMessageAt),
      }))
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }, [chatsData]);

  const { data: currentChatData } = useChat(currentConversationId);
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateChatNameMutation = useUpdateChatName();

  const updateLoadedConversation = useCallback((chatId: string, updater: (conv: Conversation) => Conversation) => {
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      const conversation = updated.get(chatId);
      if (conversation) {
        updated.set(chatId, updater(conversation));
      }
      return updated;
    });
  }, []);

  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null;
    
    const loadedConv = loadedConversations.get(currentConversationId);
    if (loadedConv && (streamingConversationId === currentConversationId || loadedConv.messages.some(m => m.isStreaming))) {
      return loadedConv;
    }
    
    if (currentChatData) {
      return {
        ...currentChatData,
        messages: deduplicateMessages(currentChatData.messages),
      };
    }
    
    return loadedConv || null;
  }, [currentConversationId, currentChatData, loadedConversations, streamingConversationId]);

  const conversations = useMemo(() => {
    return chatList.map((chat) => {
      const loaded = loadedConversations.get(chat.id);
      if (loaded) {
        return loaded;
      }
      return {
        id: chat.id,
        title: chat.title,
        messages: [],
        createdAt: new Date(),
        updatedAt: chat.lastUpdated,
        lastUpdated: chat.lastUpdated,
      } as Conversation;
    });
  }, [chatList, loadedConversations]);

  const loadConversation = useCallback(async (chatId: string) => {
    if (!authToken) return;
    setCurrentConversationId(chatId);
  }, [authToken]);

  const createNewConversation = useCallback(async () => {
    const newConversation: Conversation = {
      id: generateUniqueId(),
      title: translation("sidebar.newChatTitle"),
      titleKey: "sidebar.newChatTitle",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdated: new Date(),
    };

    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      updated.set(newConversation.id, newConversation);
      return updated;
    });

    setCurrentConversationId(newConversation.id);

    if (authToken && userId) {
      try {
        await createChatMutation.mutateAsync({
          chatId: newConversation.id,
          name: newConversation.title,
        });
      } catch (error) {
        console.error("Failed to save new conversation to MongoDB:", error);
      }
    }
  }, [authToken, userId, translation, createChatMutation]);

  const deleteConversation = useCallback(async (id: string) => {
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });

    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }

    if (authToken) {
      try {
        await deleteChatMutation.mutateAsync(id);
        console.log(`✅ Deleted chat ${id} from MongoDB`);
      } catch (error) {
        console.error("Failed to delete conversation from MongoDB:", error);
      }
    }
  }, [authToken, currentConversationId, deleteChatMutation]);

  const renameConversation = useCallback(async (id: string, newTitle: string) => {
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      const conversation = updated.get(id);
      if (conversation) {
        updated.set(id, {
          ...conversation,
          title: newTitle,
          titleKey: undefined,
          lastUpdated: new Date(),
        });
      }
      return updated;
    });

    if (authToken) {
      try {
        await updateChatNameMutation.mutateAsync({ chatId: id, name: newTitle });
        console.log(`✅ Renamed chat ${id} to "${newTitle}" in MongoDB`);
      } catch (error) {
        console.error("Failed to rename conversation in MongoDB:", error);
      }
    }
  }, [authToken, updateChatNameMutation]);

  return {
    loadedConversations,
    setLoadedConversations,
    currentConversationId,
    setCurrentConversationId,
    currentConversation,
    conversations,
    chatList,
    currentChatData,
    loadedConversationsRef,
    currentConversationIdRef,
    updateLoadedConversation,
    loadConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
  };
};
