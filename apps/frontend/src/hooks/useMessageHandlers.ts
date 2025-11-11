import { useCallback } from "react";
import { type Message, type Conversation, updateMessageContent, type StreamingCompletionPayload, buildParsedMessageContent, type ParsedMessageContent } from "@iagent/chat-types";
import { generateUniqueId } from "../utils/id-generator";
import { useSaveMessage, useDeleteMessage } from "../features/chats/api";
import { StreamingClient } from "@iagent/chat-types";
import { getBaseApiUrl } from "../config/config";
import { queryClient } from "../lib/queryClient";
import { apiKeys } from "../lib/keys";

interface UseMessageHandlersProps {
  currentConversationId: string | null;
  currentConversationIdRef: React.MutableRefObject<string | null>;
  loadedConversationsRef: React.MutableRefObject<Map<string, Conversation>>;
  updateLoadedConversation: (chatId: string, updater: (conv: Conversation) => Conversation) => void;
  streamingClientRef: React.MutableRefObject<StreamingClient | null>;
  accumulatedStreamContentRef: React.MutableRefObject<string>;
  setIsLoading: (loading: boolean) => void;
  setStreamingConversationId: (id: string | null) => void;
  authToken: string | null;
  userId: string | null;
  isLoading: boolean;
  translation: (key: string, params?: Record<string, any>) => string;
}

export const useMessageHandlers = ({
  currentConversationId,
  currentConversationIdRef,
  loadedConversationsRef,
  updateLoadedConversation,
  streamingClientRef,
  accumulatedStreamContentRef,
  setIsLoading,
  setStreamingConversationId,
  authToken,
  userId,
  isLoading,
  translation,
}: UseMessageHandlersProps) => {
  const saveMessageMutation = useSaveMessage();
  const deleteMessageMutation = useDeleteMessage();

  const refreshMessage = useCallback(async (messageId: string) => {
    const currentConvId = currentConversationIdRef.current;
    if (!currentConvId || isLoading) return;
    
    const conversation = loadedConversationsRef.current.get(currentConvId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const targetMessage = conversation.messages[messageIndex];

    let messagesToSend: Message[];
    let messagesToKeep: Message[];

    if (targetMessage.role === "user") {
      messagesToSend = conversation.messages.slice(0, messageIndex + 1);
      messagesToKeep = conversation.messages.slice(0, messageIndex + 1);
    } else {
      const previousUserMessageIndex = conversation.messages
        .slice(0, messageIndex)
        .reverse()
        .findIndex((m) => m.role === "user");

      if (previousUserMessageIndex === -1) return;

      const actualUserIndex = messageIndex - 1 - previousUserMessageIndex;
      messagesToSend = conversation.messages.slice(0, actualUserIndex + 1);
      messagesToKeep = conversation.messages.slice(0, actualUserIndex + 1);
    }

    const newAssistantMessageId = generateUniqueId();
    const newAssistantMessage: Message = {
      id: newAssistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    updateLoadedConversation(conversation.id, (conv) => ({
      ...conv,
      messages: [...messagesToKeep, newAssistantMessage],
      lastUpdated: new Date(),
    }));

    setIsLoading(true);
    setStreamingConversationId(conversation.id);

    try {
      if (!streamingClientRef.current) return;
      
      let currentContent = "";
      accumulatedStreamContentRef.current = "";

      await streamingClientRef.current.streamChat(
        messagesToSend,
        (token: string, metadata?: any) => {
          currentContent += token;
          accumulatedStreamContentRef.current = currentContent;

          updateLoadedConversation(conversation.id, (conv) => ({
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === newAssistantMessageId
                ? {
                    ...m,
                    content: currentContent,
                    metadata: metadata,
                    isStreaming: true,
                  }
                : m
            ),
            lastUpdated: new Date(),
          }));
        },
        (result: StreamingCompletionPayload) => {
          const finalContent = result.content || accumulatedStreamContentRef.current || currentContent;
          const sections = result.metadata?.sections as Record<string, { content: string; parsed: ParsedMessageContent }> | undefined;
          const currentSection = result.metadata?.currentSection as 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer' | undefined;
          
          updateLoadedConversation(conversation.id, (conv) => {
            const finalConversation = {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === newAssistantMessageId
                  ? { 
                      ...m, 
                      content: finalContent, 
                      isStreaming: false,
                      parsed: result.parsed,
                      sections: sections,
                      currentSection: currentSection,
                      metadata: {
                        ...m.metadata,
                        ...result.metadata,
                      },
                    }
                  : m
              ),
              lastUpdated: new Date(),
            };

            if (authToken && userId) {
              if (finalConversation.messages.length > 0) {
                const lastMessage = finalConversation.messages[finalConversation.messages.length - 1];
                if (!lastMessage.isStreaming) {
                  saveMessageMutation.mutate({
                    chatId: finalConversation.id,
                    message: {
                      id: lastMessage.id,
                      role: lastMessage.role,
                      content: lastMessage.content,
                      timestamp: lastMessage.timestamp,
                      metadata: {
                        ...lastMessage.metadata,
                        parsed: lastMessage.parsed,
                        sections: lastMessage.sections,
                        currentSection: lastMessage.currentSection,
                      },
                      filterId: lastMessage.filterId,
                      filterSnapshot: lastMessage.filterSnapshot,
                    },
                  });
                }
              }
            }

            return finalConversation;
          });
          setIsLoading(false);
          setStreamingConversationId(null);
          accumulatedStreamContentRef.current = "";
        },
        (error: Error) => {
          console.error("Failed to refresh message:", error);
          throw error;
        },
        getBaseApiUrl(),
        authToken || undefined,
        conversation.id,
        []
      );
    } catch (error) {
      console.error("Failed to refresh message:", error);
      const errorMessage: Message = {
        id: newAssistantMessageId,
        role: "assistant",
        content: "Sorry, I encountered an error while regenerating. Please try again.",
        timestamp: new Date(),
      };

      updateLoadedConversation(conversation.id, (conv) => ({
        ...conv,
        messages: conv.messages.map((m) =>
          m.id === newAssistantMessageId ? errorMessage : m
        ),
        lastUpdated: new Date(),
      }));
    } finally {
      setIsLoading(false);
      setStreamingConversationId(null);
    }
  }, [isLoading, authToken, userId, updateLoadedConversation, streamingClientRef, accumulatedStreamContentRef, setIsLoading, setStreamingConversationId, currentConversationIdRef, loadedConversationsRef, saveMessageMutation]);

  const editMessage = useCallback((messageId: string, setInput: (value: string) => void) => {
    const currentConvId = currentConversationIdRef.current;
    if (!currentConvId) return;
    
    const conversation = loadedConversationsRef.current.get(currentConvId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex((m) => m.id === messageId);
    if (
      messageIndex === -1 ||
      conversation.messages[messageIndex].role !== "user"
    )
      return;

    const messageToEdit = conversation.messages[messageIndex];
    setInput(messageToEdit.content);
    const messagesToKeep = conversation.messages.slice(0, messageIndex);

    updateLoadedConversation(conversation.id, (conv) => ({
      ...conv,
      messages: messagesToKeep,
      lastUpdated: new Date(),
    }));
  }, [updateLoadedConversation, currentConversationIdRef, loadedConversationsRef]);

  const deleteMessage = useCallback(async (messageId: string) => {
    const currentConvId = currentConversationIdRef.current;
    if (!currentConvId || !authToken) return;

    updateLoadedConversation(currentConvId, (conv) => {
      const messageIndex = conv.messages.findIndex((msg) => msg.id === messageId);
      
      if (messageIndex === -1) {
        return conv;
      }

      const updatedMessages = conv.messages.slice(0, messageIndex);
      
      return {
        ...conv,
        messages: updatedMessages,
        lastUpdated: new Date(),
      };
    });

    try {
      await deleteMessageMutation.mutateAsync({ chatId: currentConvId, messageId });
    } catch (error) {
      console.error("Failed to delete message from MongoDB:", error);
      if (currentConvId && authToken) {
        try {
          await queryClient.invalidateQueries({ queryKey: apiKeys.chats.detail(currentConvId) });
        } catch (reloadError) {
          console.error("Failed to reload conversation after delete error:", reloadError);
        }
      }
    }
  }, [authToken, updateLoadedConversation, deleteMessageMutation, currentConversationIdRef]);

  return {
    refreshMessage,
    editMessage,
    deleteMessage,
  };
};

