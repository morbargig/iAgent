import { useState, useRef, useEffect, useCallback } from "react";
import { updateMessageContent, type Conversation, buildParsedMessageContent, type ParsedMessageContent } from "@iagent/chat-types";
import type { StreamingCompletionPayload } from "@iagent/shared-renderer";
import { StreamingClient } from "../utils/streaming-client";
import { useSaveMessage } from "../features/chats/api";

interface UseStreamingManagementProps {
  loadedConversations: Map<string, Conversation>;
  updateLoadedConversation: (chatId: string, updater: (conv: Conversation) => Conversation) => void;
  authToken: string | null;
  userId: string | null;
  translation: (key: string, params?: Record<string, any>) => string;
}

export const useStreamingManagement = ({
  loadedConversations,
  updateLoadedConversation,
  authToken,
  userId,
  translation,
}: UseStreamingManagementProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);
  
  const accumulatedStreamContentRef = useRef<string>("");
  const streamingClientRef = useRef<StreamingClient | null>(null);
  const loadedConversationsRef = useRef<Map<string, Conversation>>(new Map());
  loadedConversationsRef.current = loadedConversations;

  const saveMessageMutation = useSaveMessage();

  useEffect(() => {
    streamingClientRef.current = new StreamingClient();
  }, []);

  useEffect(() => {
    if (isLoading && !streamingClientRef.current?.isStreaming()) {
      const timer = setTimeout(() => {
        if (!streamingClientRef.current?.isStreaming()) {
          setIsLoading(false);
          if (!streamingConversationId) {
            setStreamingConversationId(null);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, streamingConversationId]);

  const saveCurrentStreamContent = useCallback(async () => {
    if (!streamingConversationId || !authToken || !userId) return;

    const currentContent = accumulatedStreamContentRef.current;
    if (!currentContent) return;

    updateLoadedConversation(streamingConversationId, (conv) => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        const updatedConv = {
          ...conv,
          messages: [
            ...conv.messages.slice(0, -1),
            updateMessageContent(
              lastMessage,
              currentContent,
              false,
              true
            ),
          ],
          lastUpdated: new Date(),
        };

        if (updatedConv.messages.length > 0) {
          const lastMessage = updatedConv.messages[updatedConv.messages.length - 1];
          if (!lastMessage.isStreaming) {
            saveMessageMutation.mutate({
              chatId: updatedConv.id,
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

        return updatedConv;
      }
      return conv;
    });
  }, [streamingConversationId, authToken, userId, updateLoadedConversation, saveMessageMutation]);

  const stopGeneration = useCallback(() => {
    if (streamingClientRef.current) {
      streamingClientRef.current.abort();
      saveCurrentStreamContent();
      setIsLoading(false);
      setStreamingConversationId(null);
      accumulatedStreamContentRef.current = "";
    }
  }, [saveCurrentStreamContent]);

  const abortStreamIfActive = useCallback(() => {
    if (streamingClientRef.current?.isStreaming()) {
      streamingClientRef.current.abort();
      setIsLoading(false);
      setStreamingConversationId(null);
      accumulatedStreamContentRef.current = "";
    }
  }, []);

  return {
    isLoading,
    setIsLoading,
    streamingConversationId,
    setStreamingConversationId,
    streamingClientRef,
    accumulatedStreamContentRef,
    stopGeneration,
    abortStreamIfActive,
    saveCurrentStreamContent,
  };
};

