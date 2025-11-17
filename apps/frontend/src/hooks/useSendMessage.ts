import { useCallback } from "react";
import { createMessage, updateMessageContent, type Message, type Conversation, buildParsedMessageContent, type ParsedMessageContent } from "@iagent/chat-types";
import type { StreamingCompletionPayload } from "@iagent/shared-renderer";
import { StreamingClient } from "../utils/streaming-client";
import { generateUniqueId } from "../utils/id-generator";
import { useSaveMessage, useCreateChat } from "../features/chats/api";
import { getBaseApiUrl } from "../config/config";
import type { SendMessageData } from "../components/InputArea/InputArea";

interface UseSendMessageProps {
  currentConversationIdRef: React.MutableRefObject<string | null>;
  loadedConversationsRef: React.MutableRefObject<Map<string, Conversation>>;
  setLoadedConversations: React.Dispatch<React.SetStateAction<Map<string, Conversation>>>;
  setCurrentConversationId: (id: string | null) => void;
  updateLoadedConversation: (chatId: string, updater: (conv: Conversation) => Conversation) => void;
  streamingClientRef: React.MutableRefObject<StreamingClient | null>;
  accumulatedStreamContentRef: React.MutableRefObject<string>;
  streamingConversationId: string | null;
  setIsLoading: (loading: boolean) => void;
  setStreamingConversationId: (id: string | null) => void;
  setInput: (value: string) => void;
  authToken: string | null;
  userId: string | null;
  translation: (key: string, params?: Record<string, any>) => string;
}

export const useSendMessage = ({
  currentConversationIdRef,
  loadedConversationsRef,
  setLoadedConversations,
  setCurrentConversationId,
  updateLoadedConversation,
  streamingClientRef,
  accumulatedStreamContentRef,
  streamingConversationId,
  setIsLoading,
  setStreamingConversationId,
  setInput,
  authToken,
  userId,
  translation,
}: UseSendMessageProps) => {
  const saveMessageMutation = useSaveMessage();
  const createChatMutation = useCreateChat();

  const handleSendMessage = useCallback(async (data: SendMessageData) => {
    const {
      content,
      dateFilter,
      selectedCountries,
      enabledTools,
      filterSnapshot,
      attachments,
    } = data;
    if (!content.trim()) return;

    const currentConvId = currentConversationIdRef.current;
    const currentConv = loadedConversationsRef.current.get(currentConvId || '') || null;

    const isOtherChatStreaming = streamingConversationId && 
      streamingConversationId !== currentConvId &&
      streamingClientRef.current?.isStreaming();
    
    if (isOtherChatStreaming) {
      if (streamingClientRef.current) {
        streamingClientRef.current.abort();
      }
      setIsLoading(false);
      setStreamingConversationId(null);
    }

    const isCurrentChatStreaming = streamingClientRef.current?.isStreaming() && 
      streamingConversationId === currentConvId;
    
    if (isCurrentChatStreaming) {
      return;
    }

    if (streamingClientRef.current?.isStreaming()) {
      streamingClientRef.current.abort();
      setIsLoading(false);
      setStreamingConversationId(null);
    }

    setIsLoading(true);
    setInput("");

    try {
      const messageFilterSnapshot = filterSnapshot || {
        filterId: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Filter ${new Date().toLocaleString()}`,
        config: {
          dateFilter,
          selectedCountries,
          enabledTools,
          toolConfigurations: {},
        },
      };

      const userMessage = createMessage(
        "user",
        content,
        false,
        messageFilterSnapshot.filterId,
        messageFilterSnapshot
      );

      if (attachments && attachments.length > 0) {
        (userMessage as any).attachments = attachments;
      }
      
      const assistantMessage = createMessage(
        "assistant",
        "",
        true,
        messageFilterSnapshot.filterId,
        messageFilterSnapshot
      );
      
      assistantMessage.timestamp = new Date(userMessage.timestamp.getTime() + 1);

      const shouldGenerateTitle =
        currentConv &&
        currentConv.titleKey === "sidebar.newChatTitle";
      const conversationTitle = shouldGenerateTitle
        ? content.length > 50
          ? content.substring(0, 47) + "..."
          : content
        : currentConv?.title;

      const updatedConversation: Conversation = currentConv
        ? {
            ...currentConv,
            messages: [
              ...currentConv.messages,
              userMessage,
              assistantMessage,
            ],
            title: shouldGenerateTitle ? conversationTitle! : currentConv.title,
            titleKey: shouldGenerateTitle ? undefined : currentConv.titleKey,
            lastUpdated: new Date(),
          }
        : {
            id: generateUniqueId(),
            title: content.slice(0, 30) + "...",
            messages: [userMessage, assistantMessage],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUpdated: new Date(),
          };

      if (currentConv) {
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(updatedConversation.id, updatedConversation);
          return updated;
        });
      } else {
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(updatedConversation.id, updatedConversation);
          return updated;
        });
        setCurrentConversationId(updatedConversation.id);
        
        if (authToken && userId) {
          createChatMutation.mutate({
            chatId: updatedConversation.id,
            name: updatedConversation.title,
          });
        }
      }

      setStreamingConversationId(updatedConversation.id);

      if (authToken && userId) {
        saveMessageMutation.mutate({
          chatId: updatedConversation.id,
          message: {
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
            metadata: userMessage.metadata,
            filterId: userMessage.filterId,
            filterSnapshot: userMessage.filterSnapshot,
          },
        });
      }

      const chatId = currentConv?.id || updatedConversation.id;
      const toolsArray = enabledTools.map((toolId) => ({
        id: toolId,
        enabled: true,
        settings: {},
      }));

      let accumulatedContent = "";
      accumulatedStreamContentRef.current = "";
      let currentSections: Record<string, { content: string; parsed: ParsedMessageContent }> = {};

      if (!streamingClientRef.current) {
        setIsLoading(false);
        setStreamingConversationId(null);
        return;
      }
      
      if (streamingClientRef.current.isStreaming()) {
        streamingClientRef.current.abort();
      }
      
      await streamingClientRef.current.streamChat(
        updatedConversation.messages,
        (token: string, metadata?: Record<string, any>) => {
          accumulatedContent += token;
          accumulatedStreamContentRef.current = accumulatedContent;
          
          if (metadata?.sections) {
            currentSections = metadata.sections as Record<string, { content: string; parsed: ParsedMessageContent }>;
          }
          
          updateLoadedConversation(updatedConversation.id, (conv) => {
                const lastMessage = conv.messages[conv.messages.length - 1];
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    {
                      ...updateMessageContent(
                        lastMessage,
                        accumulatedContent,
                        true
                      ),
                      parsed: metadata?.parsed,
                      sections: Object.keys(currentSections).length > 0 ? currentSections : undefined,
                      currentSection: metadata?.section as 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer' | undefined,
                      metadata: {
                        ...lastMessage.metadata,
                        ...metadata,
                      },
                    },
                  ],
                  lastUpdated: new Date(),
                };
          });
        },
        (result: StreamingCompletionPayload) => {
          const finalContent = result.content || accumulatedStreamContentRef.current || accumulatedContent;
          const sections = result.metadata?.sections as Record<string, { content: string; parsed: ParsedMessageContent }> | undefined;
          const currentSection = result.metadata?.currentSection as 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer' | undefined;
          
          let finalParsed = result.parsed;
          if (!finalParsed && finalContent) {
            finalParsed = buildParsedMessageContent(finalContent);
          }
          
          updateLoadedConversation(updatedConversation.id, (conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            const finalConversation = {
              ...conv,
              messages: [
                ...conv.messages.slice(0, -1),
                {
                  ...updateMessageContent(
                    lastMessage,
                    finalContent,
                    false
                  ),
                  parsed: finalParsed,
                  sections: sections,
                  currentSection: currentSection,
                  metadata: {
                    ...lastMessage.metadata,
                    ...result.metadata,
                  },
                },
              ],
              lastUpdated: new Date(),
            };

            if (authToken && userId && finalConversation.messages.length > 0) {
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

            return finalConversation;
          });
          setIsLoading(false);
          setStreamingConversationId(null);
          accumulatedStreamContentRef.current = "";
        },
        (error: Error) => {
          console.error("Streaming error:", error);
          updateLoadedConversation(updatedConversation.id, (conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            return {
              ...conv,
              messages: [
                ...conv.messages.slice(0, -1),
                updateMessageContent(
                  lastMessage,
                  translation("errors.streaming", { error: error.message }),
                  false
                ),
              ],
              lastUpdated: new Date(),
            };
          });
          setIsLoading(false);
          setStreamingConversationId(null);
        },
        getBaseApiUrl(),
        authToken || undefined,
        chatId,
        toolsArray,
        dateFilter,
        selectedCountries
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);
      setStreamingConversationId(null);
      accumulatedStreamContentRef.current = "";
      if (streamingClientRef.current?.isStreaming()) {
        streamingClientRef.current.abort();
      }
    }
  }, [authToken, userId, translation, updateLoadedConversation, streamingClientRef, streamingConversationId, currentConversationIdRef, loadedConversationsRef, setLoadedConversations, setCurrentConversationId, setIsLoading, setStreamingConversationId, setInput, accumulatedStreamContentRef, saveMessageMutation, createChatMutation]);

  return { handleSendMessage };
};

