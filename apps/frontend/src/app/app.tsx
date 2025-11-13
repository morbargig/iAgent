import React, { useState, useRef, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { useTranslation } from "../contexts/TranslationContext";
import { useAuth } from "../contexts/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { ChatArea } from "../components/ChatArea";
import {
  InputArea,
  type SendMessageData,
} from "../components/InputArea/InputArea";
import { LoginForm } from "../components/LoginForm";
import {
  ReportDetailsPanel,
  type ReportData,
  fetchReportDetails,
} from "../components/ReportDetailsPanel";
import { AppDetailsDialog } from "../components/AppDetailsDialog";
import { AppFooter } from "../components/AppFooter";
import { parseReportId } from "../utils/reportLinks";

import {
  StreamingClient,
  createMessage,
  updateMessageContent,
  type Message,
  type Conversation,
  type StreamingCompletionPayload,
  type ParsedMessageContent,
  buildParsedMessageContent,
} from "@iagent/chat-types";
import { convertMongoMessageToMessage } from "../utils/chunkConverter";
import { useMockMode } from "../hooks/useMockMode";
import { useAppLocalStorage } from "../hooks/storage";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useVersionMigration } from "../hooks/useVersionMigration";
import { getBaseApiUrl } from "../config/config";
// import { environment } from "../environments/environment";

import { generateUniqueId } from "../utils/id-generator";
import { useChats, useChat, useSaveMessage, useCreateChat, useDeleteChat, useUpdateChatName, useDeleteMessage } from "../features/chats/api";
import { setAuthTokenGetter } from "../lib/http";
import { queryClient } from "../lib/queryClient";
import { apiKeys } from "../lib/keys";

// Debug: Log environment info
// console.log('🔍 Environment Check:', {
//   env: environment.env,
//   production: environment.production,
//   apiUrl: environment.apiUrl,
//   apiBaseUrl: environment.api?.baseUrl,
//   getBaseApiUrl: getBaseApiUrl()
// });

// iagent-inspired Design System
// Philosophy: Clean, minimal, muted aesthetic with subtle interactions

const iagentDesignTokens = {
  // Typography - Geist-inspired clean typography
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: 1.7, // More generous for readability
  },

  // Spacing - Clean, systematic spacing
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },

  // Border Radius - Subtle, modern curves
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    "3xl": "32px",
  },

  // Color Philosophy: Muted, accessible, clean
  colors: {
    // Dark theme
    dark: {
      background: {
        primary: "#0a0a0a", // Deep, clean background
        secondary: "#171717", // Subtle elevation
        tertiary: "#262626", // Cards, elevated surfaces
        muted: "#404040", // Muted backgrounds
      },
      text: {
        primary: "#fafafa", // High contrast text
        secondary: "#a3a3a3", // Muted text
        tertiary: "#737373", // Subtle text
      },
      border: "#262626", // Subtle borders
      accent: "#3b82f6", // Clean blue accent
      hover: "rgba(255, 255, 255, 0.05)", // Gentle hover
    },
    // Light theme
    light: {
      background: {
        primary: "#ffffff", // Pure white
        secondary: "#f9fafb", // Subtle gray
        tertiary: "#f3f4f6", // Muted background
        muted: "#e5e7eb", // Muted surfaces
      },
      text: {
        primary: "#111827", // Clean dark text
        secondary: "#6b7280", // Muted text
        tertiary: "#9ca3af", // Subtle text
      },
      border: "#e5e7eb", // Light borders
      accent: "#3b82f6", // Consistent blue
      hover: "rgba(0, 0, 0, 0.05)", // Gentle hover
    },
  },

  // Shadows - Subtle, clean elevation
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },

  // Animation - Smooth, subtle
  animation: {
    duration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Dark Theme - Clean, muted aesthetic
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: iagentDesignTokens.colors.dark.accent,
      light: "#60a5fa",
      dark: "#2563eb",
    },
    background: {
      default: iagentDesignTokens.colors.dark.background.primary,
      paper: iagentDesignTokens.colors.dark.background.secondary,
    },
    text: {
      primary: iagentDesignTokens.colors.dark.text.primary,
      secondary: iagentDesignTokens.colors.dark.text.secondary,
    },
    divider: iagentDesignTokens.colors.dark.border,
    action: {
      hover: iagentDesignTokens.colors.dark.hover,
      selected: "rgba(255, 255, 255, 0.08)",
    },
  },
  typography: {
    fontFamily: iagentDesignTokens.typography.fontFamily,
    fontSize: 16,
    h6: {
      fontWeight: iagentDesignTokens.typography.weights.semibold,
      fontSize: iagentDesignTokens.typography.sizes.lg,
      lineHeight: iagentDesignTokens.typography.lineHeight,
    },
    body1: {
      fontSize: iagentDesignTokens.typography.sizes.base,
      lineHeight: iagentDesignTokens.typography.lineHeight,
      fontWeight: iagentDesignTokens.typography.weights.normal,
    },
    body2: {
      fontSize: iagentDesignTokens.typography.sizes.sm,
      lineHeight: iagentDesignTokens.typography.lineHeight,
      fontWeight: iagentDesignTokens.typography.weights.normal,
    },
  },
  shape: {
    borderRadius: parseInt(iagentDesignTokens.borderRadius.md),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: iagentDesignTokens.borderRadius.lg,
          fontWeight: iagentDesignTokens.typography.weights.medium,
          fontSize: iagentDesignTokens.typography.sizes.sm,
          padding: `${iagentDesignTokens.spacing.md} ${iagentDesignTokens.spacing.lg}`,
          transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            transform: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: iagentDesignTokens.borderRadius.lg,
          boxShadow: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: iagentDesignTokens.borderRadius.lg,
            transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          },
        },
      },
    },
  },
});

// Light Theme - Clean, minimal aesthetic
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: iagentDesignTokens.colors.light.accent,
      light: "#60a5fa",
      dark: "#2563eb",
    },
    background: {
      default: iagentDesignTokens.colors.light.background.primary,
      paper: iagentDesignTokens.colors.light.background.secondary,
    },
    text: {
      primary: iagentDesignTokens.colors.light.text.primary,
      secondary: iagentDesignTokens.colors.light.text.secondary,
    },
    divider: iagentDesignTokens.colors.light.border,
    action: {
      hover: iagentDesignTokens.colors.light.hover,
      selected: "rgba(0, 0, 0, 0.04)",
    },
  },
  typography: {
    fontFamily: iagentDesignTokens.typography.fontFamily,
    fontSize: 16,
    h6: {
      fontWeight: iagentDesignTokens.typography.weights.semibold,
      fontSize: iagentDesignTokens.typography.sizes.lg,
      lineHeight: iagentDesignTokens.typography.lineHeight,
    },
    body1: {
      fontSize: iagentDesignTokens.typography.sizes.base,
      lineHeight: iagentDesignTokens.typography.lineHeight,
      fontWeight: iagentDesignTokens.typography.weights.normal,
    },
    body2: {
      fontSize: iagentDesignTokens.typography.sizes.sm,
      lineHeight: iagentDesignTokens.typography.lineHeight,
      fontWeight: iagentDesignTokens.typography.weights.normal,
    },
  },
  shape: {
    borderRadius: parseInt(iagentDesignTokens.borderRadius.md),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: iagentDesignTokens.borderRadius.lg,
          fontWeight: iagentDesignTokens.typography.weights.medium,
          fontSize: iagentDesignTokens.typography.sizes.sm,
          padding: `${iagentDesignTokens.spacing.md} ${iagentDesignTokens.spacing.lg}`,
          transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            transform: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: iagentDesignTokens.borderRadius.lg,
          boxShadow: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: iagentDesignTokens.borderRadius.lg,
            transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          },
        },
      },
    },
  },
});

const App = () => {
  useVersionMigration();
  
  const [isDarkMode, setIsDarkMode] = useAppLocalStorage('chatbot-theme-mode');
  const [isSidebarOpen, setIsSidebarOpen] = useAppLocalStorage('chatbot-sidebar-open');
  const [currentConversationId, setCurrentConversationId] = useAppLocalStorage('chatbot-current-conversation-id');
  
  const [loadedConversations, setLoadedConversations] = useState<Map<string, Conversation>>(new Map());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);
  
  const accumulatedStreamContentRef = useRef<string>("");
  const streamingClientRef = useRef<StreamingClient | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [inputAreaHeight, setInputAreaHeight] = useState(80); // Track input area height
  const [sidebarWidth, setSidebarWidth] = useState(250); // Track sidebar width
  const { authToken, userId, userEmail, isAuthenticated, logout } = useAuth();

  React.useEffect(() => {
    setAuthTokenGetter(() => authToken || null);
  }, [authToken]);

  const { data: chatsData } = useChats();
  const chatList = React.useMemo(() => {
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
  const saveMessageMutation = useSaveMessage();
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateChatNameMutation = useUpdateChatName();
  const deleteMessageMutation = useDeleteMessage();

  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportPanelWidth, setReportPanelWidth] = useState(350);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);

  const { useMockMode: isMockMode, toggleMockMode } = useMockMode();
  const enableAppDetails = useFeatureFlag('enableAppDetails');
  const enableDarkMode = useFeatureFlag('enableDarkMode');
  const { t: translation } = useTranslation();

  const loadedConversationsRef = useRef<Map<string, Conversation>>(new Map());
  loadedConversationsRef.current = loadedConversations;
  const currentConversationIdRef = useRef<string | null>(null);
  currentConversationIdRef.current = currentConversationId;

  const updateLoadedConversation = React.useCallback((chatId: string, updater: (conv: Conversation) => Conversation) => {
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      const conversation = updated.get(chatId);
      if (conversation) {
        updated.set(chatId, updater(conversation));
      }
      return updated;
    });
  }, []);

  const saveCurrentStreamContent = React.useCallback(async () => {
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
  }, [streamingConversationId, authToken, userId, updateLoadedConversation]);

  const stopGeneration = React.useCallback(() => {
    if (streamingClientRef.current) {
      streamingClientRef.current.abort();

      // Save current stream content to MongoDB
      saveCurrentStreamContent();

      setIsLoading(false);
      setStreamingConversationId(null);
      accumulatedStreamContentRef.current = ""; // Clear ref
    }
  }, [saveCurrentStreamContent]);

  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null;
    return loadedConversations.get(currentConversationId) || null;
  }, [loadedConversations, currentConversationId]);

  const conversations = useMemo(() => {
    return chatList.map((chat) => {
      const loaded = loadedConversations.get(chat.id);
      if (loaded) {
        return loaded;
      }
      // Return minimal conversation for sidebar if not loaded
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

  const handleSendMessage = React.useCallback(async (data: SendMessageData) => {
    const {
      content,
      dateFilter,
      selectedCountries,
      enabledTools,
      filterSnapshot,
      attachments,
    } = data;
    if (!content.trim() || isLoading) return;

    const currentConvId = currentConversationIdRef.current;
    const currentConv = loadedConversationsRef.current.get(currentConvId || '') || null;

    setIsLoading(true);
    setStreamingConversationId(currentConv?.id || null);
    setInput("");

    try {
      // Use the filter snapshot from the InputArea, or create a basic one if not provided
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
        // Update existing conversation
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(updatedConversation.id, updatedConversation);
          return updated;
        });
      } else {
        // New conversation - add to loaded conversations
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(updatedConversation.id, updatedConversation);
          return updated;
        });
        setCurrentConversationId(updatedConversation.id);
        setStreamingConversationId(updatedConversation.id);
        
        if (authToken && userId) {
          createChatMutation.mutate({
            chatId: updatedConversation.id,
            name: updatedConversation.title,
          });
        }
      }

      // Save user message immediately to MongoDB
      if (authToken && userId) {
        saveMessageMutation.mutate({
          chatId: updatedConversation.id,
          message: {
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
            metadata: userMessage.metadata || {},
            filterId: userMessage.filterId,
            filterSnapshot: userMessage.filterSnapshot,
          },
        });
      }

      const chatId = currentConv?.id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const toolsArray = enabledTools.map((toolId) => ({
        id: toolId,
        enabled: true,
        settings: {},
      }));

      let accumulatedContent = "";
      accumulatedStreamContentRef.current = "";
      let currentSections: Record<string, { content: string; parsed: ParsedMessageContent }> = {};

      if (!streamingClientRef.current) return;
      await streamingClientRef.current.streamChat(
        updatedConversation.messages,
        (token: string, metadata?: Record<string, any>) => {
          accumulatedContent += token;
          accumulatedStreamContentRef.current = accumulatedContent;
          
          // Update sections if provided in metadata
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
          
          // Ensure parsed content is available - rebuild if sections exist but parsed is missing
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
    }
  }, [isLoading, authToken, userId, translation, updateLoadedConversation, streamingClientRef]);

  const handleMockModeToggle = React.useCallback(() => {
    toggleMockMode?.();
  }, [toggleMockMode]);

  useEffect(() => {
    streamingClientRef.current = new StreamingClient();
  }, []);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const handleLogout = React.useCallback(() => {
    logout();
    setLoadedConversations(new Map());
    setCurrentConversationId(null);
  }, [logout]);

  React.useEffect(() => {
    if (currentChatData && !loadedConversationsRef.current.has(currentChatData.id)) {
      setLoadedConversations((prev) => {
        const updated = new Map(prev);
        updated.set(currentChatData.id, currentChatData);
        return updated;
      });
    }
  }, [currentChatData]);

  const streamingConversationIdRef = useRef<string | null>(null);
  streamingConversationIdRef.current = streamingConversationId;

  useEffect(() => {
    if (!streamingConversationId || !authToken || !userId) return;

    // Save streaming conversation every 5 seconds
    const interval = setInterval(() => {
      const currentStreamingId = streamingConversationIdRef.current;
      if (!currentStreamingId) return;

      const currentContent = accumulatedStreamContentRef.current;
      if (currentContent) {
        updateLoadedConversation(currentStreamingId, (conv) => {
          const lastMessage = conv.messages[conv.messages.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            return {
              ...conv,
              messages: [
                ...conv.messages.slice(0, -1),
                updateMessageContent(
                  lastMessage,
                  currentContent,
                  true
                ),
              ],
              lastUpdated: new Date(),
            };
          }
          return conv;
        });
      }

      const updatedConversation = loadedConversationsRef.current.get(currentStreamingId);
      if (updatedConversation && updatedConversation.messages.length > 0) {
        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];
        if (!lastMessage.isStreaming) {
          saveMessageMutation.mutate({
            chatId: updatedConversation.id,
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
    }, 5000);

    return () => clearInterval(interval);
  }, [streamingConversationId, authToken, userId]);

  const authTokenRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  authTokenRef.current = authToken;
  userIdRef.current = userId;

  useEffect(() => {
    return () => {
      const currentStreamingId = streamingConversationIdRef.current;
      const currentAuthToken = authTokenRef.current;
      const currentUserId = userIdRef.current;

      if (currentStreamingId && currentAuthToken && currentUserId) {
        const currentContent = accumulatedStreamContentRef.current;
        if (currentContent) {
          const conversation = loadedConversationsRef.current.get(currentStreamingId);
          if (conversation) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
              const updatedConv = {
                ...conversation,
                messages: [
                  ...conversation.messages.slice(0, -1),
                  updateMessageContent(
                    lastMessage,
                    currentContent,
                    false,
                    true // Mark as interrupted
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
            }
          }
        }
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentStreamingId = streamingConversationIdRef.current;
      const currentAuthToken = authTokenRef.current;
      const currentUserId = userIdRef.current;

      if (currentStreamingId && currentAuthToken && currentUserId) {
        const currentContent = accumulatedStreamContentRef.current;
        if (currentContent) {
          const conversation = loadedConversationsRef.current.get(currentStreamingId);
          if (conversation) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
              const updatedConv = {
                ...conversation,
                messages: [
                  ...conversation.messages.slice(0, -1),
                  updateMessageContent(
                    lastMessage,
                    currentContent,
                    false,
                    true // Mark as interrupted
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
            }
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, []);

  const toggleTheme = React.useCallback(() => {
    if (!enableDarkMode) return;
    setIsDarkMode((prev) => !prev);
  }, [enableDarkMode]);

  React.useEffect(() => {
    if (!enableDarkMode && isDarkMode) {
      setIsDarkMode(false);
    }
  }, [enableDarkMode, isDarkMode]);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarWidthChange = React.useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const loadConversation = React.useCallback(async (chatId: string) => {
    if (!authToken) return;

    // Don't reload if already loaded
    if (loadedConversationsRef.current.has(chatId)) {
      setCurrentConversationId(chatId);
      return;
    }

    try {
      const { http } = await import('../lib/http');
      const { getBaseApiUrl } = await import('../config/config');
      
      const token = sessionStorage.getItem('session-token');
      if (!token) return;

      const baseUrl = getBaseApiUrl();
      const chatResponse = await http.get(`${baseUrl}/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const messagesResponse = await http.get(`${baseUrl}/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversation: Conversation = {
        id: chatResponse.data.chatId,
        title: chatResponse.data.name,
        messages: messagesResponse.data.map((msg: any) => convertMongoMessageToMessage({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata,
          filterId: msg.filterId,
          filterSnapshot: msg.filterSnapshot,
        })),
        createdAt: new Date(chatResponse.data.createdAt),
        updatedAt: new Date(chatResponse.data.lastMessageAt),
        lastUpdated: new Date(chatResponse.data.lastMessageAt),
      };

      if (conversation) {
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(conversation.id, conversation);
          return updated;
        });
        setCurrentConversationId(chatId);
        console.log(`✅ Loaded conversation ${chatId} from MongoDB`);
      }
    } catch (error) {
      console.error(`Failed to load conversation ${chatId}:`, error);
    }
  }, [authToken]);

  const createNewConversation = React.useCallback(async () => {
    const newConversation: Conversation = {
      id: generateUniqueId(),
      title: translation("sidebar.newChatTitle"),
      titleKey: "sidebar.newChatTitle", // Store the translation key
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
  }, [authToken, userId, translation]);

  const deleteConversation = React.useCallback(async (id: string) => {
    // Remove from loaded conversations
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

  const renameConversation = React.useCallback(async (id: string, newTitle: string) => {

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

  const refreshMessage = React.useCallback(async (messageId: string) => {
    const currentConvId = currentConversationIdRef.current;
    if (!currentConvId || isLoading) return;
    
    const conversation = loadedConversationsRef.current.get(currentConvId);
    if (!conversation) return;

    // Find the message and get the conversation history up to that point
    const messageIndex = conversation.messages.findIndex(
      (m) => m.id === messageId
    );
    if (messageIndex === -1) return;

    const targetMessage = conversation.messages[messageIndex];

    let messagesToSend: Message[];
    let messagesToKeep: Message[];

    if (targetMessage.role === "user") {
      // For user messages: regenerate from this user message
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

    // Update conversation with messages up to user message + new assistant placeholder
    updateLoadedConversation(conversation.id, (conv) => ({
      ...conv,
              messages: [...messagesToKeep, newAssistantMessage],
              lastUpdated: new Date(),
    }));

    // Save to MongoDB if authenticated
    if (authToken && userId) {
      const updatedConv = {
        ...conversation,
        messages: [...messagesToKeep, newAssistantMessage],
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
    }

    setIsLoading(true);
    setStreamingConversationId(conversation.id);

    try {
      const streamingClient = streamingClientRef.current;
      if (!streamingClient) {
        throw new Error("Streaming client not initialized");
      }

      // console.log(`🔄 Regenerating ${isMockMode ? 'with MOCK' : 'with API'}...`);

      // Streaming client is stored in streamingClientRef

      let currentContent = "";
      accumulatedStreamContentRef.current = "";

      if (!streamingClientRef.current) return;
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
        // onComplete callback
        (result: StreamingCompletionPayload) => {
          // Mark streaming as complete
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
        content:
          "Sorry, I encountered an error while regenerating. Please try again.",
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
  }, [isLoading, authToken, userId, updateLoadedConversation, streamingClientRef]);

  const editMessage = React.useCallback((messageId: string) => {
    const currentConvId = currentConversationIdRef.current;
    if (!currentConvId) return;
    
    const conversation = loadedConversationsRef.current.get(currentConvId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(
      (m) => m.id === messageId
    );
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

    // Save to MongoDB if authenticated
    if (authToken && userId) {
      const updatedConv = {
        ...conversation,
        messages: messagesToKeep,
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
    }

  }, [authToken, userId, updateLoadedConversation]);

  const deleteMessage = React.useCallback(async (messageId: string) => {
    const currentConvId = currentConversationIdRef.current;
    if (!currentConvId || !authToken) return;

    // Update local state immediately for better UX
    updateLoadedConversation(currentConvId, (conv) => {
      // Find the index of the message to delete
      const messageIndex = conv.messages.findIndex((msg) => msg.id === messageId);
      
      if (messageIndex === -1) {
        // Message not found, return unchanged
        return conv;
      }

      // Delete the message and all messages after it (messages with higher index)
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
  }, [authToken, updateLoadedConversation, deleteMessageMutation]);

  const shareMessage = React.useCallback(() => {
    // Share functionality placeholder
  }, []);

  const handleVoiceInput = React.useCallback(() => {
    // Voice input functionality placeholder
  }, []);

  const handleClearInput = React.useCallback(() => {
    setInput("");
  }, []);

  const closeReportPanel = React.useCallback(() => {
    setIsReportPanelOpen(false);
    setReportData(null);
  }, []);

  const handleReportPanelWidthChange = React.useCallback((width: number) => {
    setReportPanelWidth(width);
  }, []);

  const openReportFromUrl = React.useCallback(async (url: string) => {
    const reportId = parseReportId(url);
    if (!reportId) {
      console.error("Invalid report URL:", url);
      return;
    }

    setIsReportPanelOpen(true);
    setIsReportLoading(true);
    setReportData(null);

    try {
      const data = await fetchReportDetails(reportId);
      setReportData(data);
    } catch (error) {
      console.error("Failed to load report:", error);
      setReportData(null);
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <LoginForm isDarkMode={isDarkMode} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />

      {/* Main App Container */}
      <Box
        id="iagent-app-root"
        className={`iagent-app-container ${isDarkMode ? "dark" : ""}`}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <Box
          id="iagent-main-layout"
          className="iagent-layout-horizontal"
          sx={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <Sidebar
            ref={sidebarRef}
            open={isSidebarOpen}
            onToggle={toggleSidebar}
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={loadConversation}
            onNewConversation={createNewConversation}
            onDeleteConversation={deleteConversation}
            onRenameConversation={renameConversation}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            streamingConversationId={streamingConversationId}
            onWidthChange={handleSidebarWidthChange}
            onOpenAppDetails={enableAppDetails ? () => setIsAppDetailsOpen(true) : undefined}
          />
          <Box
            id="iagent-conversation-container"
            className="iagent-conversation-area"
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <ChatArea
              messages={currentConversation?.messages || []}
              isLoading={isLoading}
              onToggleSidebar={toggleSidebar}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              useMockMode={isMockMode}
              onToggleMockMode={handleMockModeToggle}
              onRefreshMessage={refreshMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onShareMessage={shareMessage}
              inputAreaHeight={inputAreaHeight}
              onLogout={handleLogout}
              userEmail={userEmail}
              onOpenReport={openReportFromUrl}
              currentChatId={currentConversationId || undefined}
              streamingConversationId={streamingConversationId || undefined}
              onOpenAppDetails={enableAppDetails ? () => setIsAppDetailsOpen(true) : undefined}
            />

            {/* Input Area */}
            <InputArea
              value={input}
              onChange={setInput}
              onSend={handleSendMessage}
              onStop={stopGeneration}
              disabled={isLoading}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
              sidebarOpen={isSidebarOpen}
              sidebarRef={sidebarRef}
              sidebarWidth={sidebarWidth}
              reportPanelOpen={isReportPanelOpen}
              reportPanelWidth={reportPanelWidth}
              onHeightChange={setInputAreaHeight}
              // Control buttons
              onVoiceInput={handleVoiceInput}
              onClear={handleClearInput}
              showVoiceButton={false} // Enable when voice functionality is ready
              showClearButton={true} // Always show clear button
              showAttachmentButton={true} // Enable document attachment functionality
              // Filter management
              currentChatId={currentConversationId || undefined}
              authToken={authToken || undefined}
            />
            <AppFooter isDarkMode={isDarkMode} />
          </Box>
          <ReportDetailsPanel
            open={isReportPanelOpen}
            onClose={closeReportPanel}
            isDarkMode={isDarkMode}
            reportData={reportData}
            isLoading={isReportLoading}
            width={reportPanelWidth}
            onWidthChange={handleReportPanelWidthChange}
          />
          {enableAppDetails && (
            <AppDetailsDialog
              open={isAppDetailsOpen}
              onClose={() => setIsAppDetailsOpen(false)}
              isDarkMode={isDarkMode}
            />
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;

