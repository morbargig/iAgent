// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import React, { useState, useRef, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { useTranslation } from "../contexts/TranslationContext";
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
import { parseReportId } from "../utils/reportLinks";

import {
  StreamingClient,
  createMessage,
  updateMessageContent,
  type Message,
  type Conversation,
} from "@iagent/chat-types";
import { useMockMode } from "../hooks/useMockMode";
import { useAppLocalStorage, useAppSessionStorage, useMemoStorage } from "../hooks/storage";
import { getBaseApiUrl } from "../config/config";
// import { environment } from "../environments/environment";

import { generateUniqueId } from "../utils/id-generator";
import { chatService } from "../services/chatService";

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
  const [isDarkMode, setIsDarkMode] = useAppLocalStorage('chatbot-theme-mode');
  const [isSidebarOpen, setIsSidebarOpen] = useAppLocalStorage('chatbot-sidebar-open');
  const [currentConversationId, setCurrentConversationId] = useAppLocalStorage('chatbot-current-conversation-id');
  
  // Chat list (metadata only - names, IDs, etc.) for sidebar
  const [chatList, setChatList] = useState<Array<{ id: string; title: string; lastUpdated: Date }>>([]);
  
  // Loaded conversations (full with messages) - only current and streaming
  const [loadedConversations, setLoadedConversations] = useState<Map<string, Conversation>>(new Map());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);
  
  // Store accumulated stream content in a ref so it persists across renders
  const accumulatedStreamContentRef = useRef<string>("");
  // These variables are used in the component logic
  const [error, setError] = useState<string | null>(null);
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null);

  // Explicit usage to satisfy TypeScript strict mode
  if (error !== null) console.log("Error state:", error);
  if (currentAbortController !== null) console.log("AbortController active");
  const streamingClient = useRef(new StreamingClient());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [inputAreaHeight, setInputAreaHeight] = useState(80); // Track input area height
  const [sidebarWidth, setSidebarWidth] = useState(250); // Track sidebar width

  // Authentication state
  const [authToken, setAuthToken] = useAppSessionStorage('session-token');
  const [userId, setUserId] = useAppSessionStorage('user-id');
  const [userEmail, setUserEmail] = useAppSessionStorage('user-email');
  const isAuthenticated = useMemoStorage(
    () => Boolean(authToken && userId && userEmail),
    [authToken, userId, userEmail]
  );

  // Report panel state
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportPanelWidth, setReportPanelWidth] = useState(350);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // File management state
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);

  // Helper function to save current stream content to MongoDB
  const saveCurrentStreamContent = async () => {
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
              true // Mark as interrupted
            ),
          ],
          lastUpdated: new Date(),
        };

        // Save to MongoDB
        chatService.saveChatToMongo(updatedConv, authToken, userId).catch((error) => {
          console.error("Failed to save stream content to MongoDB:", error);
        });

        return updatedConv;
      }
      return conv;
    });
  };

  // Stop generation function
  const stopGeneration = () => {
    if (streamingClient.current) {
      streamingClient.current.abort();

      // Save current stream content to MongoDB
      saveCurrentStreamContent();

      setIsLoading(false);
      setStreamingConversationId(null);
      accumulatedStreamContentRef.current = ""; // Clear ref
    }
  };

  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null;
    return loadedConversations.get(currentConversationId) || null;
  }, [loadedConversations, currentConversationId]);

  // Helper function to update a loaded conversation
  const updateLoadedConversation = (chatId: string, updater: (conv: Conversation) => Conversation) => {
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      const conversation = updated.get(chatId);
      if (conversation) {
        updated.set(chatId, updater(conversation));
      }
      return updated;
    });
  };

  // Convert loaded conversations to array for sidebar (with metadata from chatList)
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

  const handleSendMessage = async (data: SendMessageData) => {
    const {
      content,
      dateFilter,
      selectedCountries,
      enabledTools,
      filterSnapshot,
      attachments,
    } = data;
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setStreamingConversationId(currentConversation?.id || null);
    setError(null);
    setInput(""); // Clear input immediately when sending

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

      // Add attachments to user message if present
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

      // Update conversation with new messages and generate title if needed
      const shouldGenerateTitle =
        currentConversation &&
        currentConversation.titleKey === "sidebar.newChatTitle";
      const conversationTitle = shouldGenerateTitle
        ? content.length > 50
          ? content.substring(0, 47) + "..."
          : content
        : currentConversation?.title;

      const updatedConversation: Conversation = currentConversation
        ? {
            ...currentConversation,
            messages: [
              ...currentConversation.messages,
              userMessage,
              assistantMessage,
            ],
            title: shouldGenerateTitle
              ? conversationTitle!
              : currentConversation.title,
            titleKey: shouldGenerateTitle
              ? undefined
              : currentConversation.titleKey, // Remove titleKey when we have a custom title
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

      if (currentConversation) {
        // Update existing conversation
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(updatedConversation.id, updatedConversation);
          return updated;
        });
      } else {
        // New conversation - add to chat list and loaded conversations
        setChatList((prev) => [
          {
            id: updatedConversation.id,
            title: updatedConversation.title,
            lastUpdated: updatedConversation.lastUpdated,
          },
          ...prev,
        ]);
        setLoadedConversations((prev) => {
          const updated = new Map(prev);
          updated.set(updatedConversation.id, updatedConversation);
          return updated;
        });
        setCurrentConversationId(updatedConversation.id);
        setStreamingConversationId(updatedConversation.id); // Update streaming ID for new conversation
      }

      // Save to MongoDB if authenticated
      if (authToken && userId) {
        chatService.saveChatToMongo(updatedConversation, authToken, userId).catch((error) => {
          console.error("Failed to save chat to MongoDB:", error);
        });
      }

      if (!currentConversation) {

        // Auto-create initial filter for new chat with current settings
        setTimeout(() => {
          const initialFilterConfig = {
            dateFilter,
            selectedCountries,
            enabledTools,
            createdAt: new Date().toISOString(),
            mode: "assistant",
            ami: { includeAMI: true, excludeAMI: false },
          };

          const initialFilter = {
            filterId: `filter_${Date.now()}_initial`,
            name: "Initial Settings",
            config: initialFilterConfig,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // Save to localStorage for new chat
          localStorage.setItem(
            `chatFilters_${updatedConversation.id}`,
            JSON.stringify([initialFilter])
          );
          console.log(
            "🎯 Auto-created initial filter for new chat:",
            updatedConversation.id
          );
        }, 100);
      }

      // Generate chat ID for this conversation - use conversation ID if available
      const chatId =
        currentConversation?.id ||
        `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare tools array from enabled tools
      const toolsArray = enabledTools.map((toolId) => ({
        id: toolId,
        enabled: true,
        settings: {}, // Add any tool-specific settings if needed
      }));

      // Track accumulated content for streaming
      let accumulatedContent = "";
      accumulatedStreamContentRef.current = ""; // Reset on new stream

      // Stream the response
      await streamingClient.current.streamChat(
        updatedConversation.messages,
        (token: string, metadata?: Record<string, any>) => {
          accumulatedContent += token;
          accumulatedStreamContentRef.current = accumulatedContent; // Update ref
          updateLoadedConversation(updatedConversation.id, (conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            return {
              ...conv,
              messages: [
                ...conv.messages.slice(0, -1),
                updateMessageContent(
                  lastMessage,
                  accumulatedContent,
                  true
                ),
              ],
              lastUpdated: new Date(),
            };
          });
        },
        () => {
          // Use the latest content from ref
          const finalContent = accumulatedStreamContentRef.current || accumulatedContent;
          updateLoadedConversation(updatedConversation.id, (conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            const finalConversation = {
              ...conv,
              messages: [
                ...conv.messages.slice(0, -1),
                updateMessageContent(
                  lastMessage,
                  finalContent,
                  false
                ),
              ],
              lastUpdated: new Date(),
            };

            // Save to MongoDB if authenticated
            if (authToken && userId) {
              chatService.saveChatToMongo(finalConversation, authToken, userId).catch((error) => {
                console.error("Failed to save chat to MongoDB:", error);
              });
            }

            return finalConversation;
          });
          setIsLoading(false);
          setStreamingConversationId(null); // Clear streaming conversation
          accumulatedStreamContentRef.current = ""; // Clear ref
        },
        (error: Error) => {
          setError(error.message);
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
          setStreamingConversationId(null); // Clear streaming conversation
        },
        getBaseApiUrl(), // baseUrl
        authToken || undefined, // authToken
        chatId, // chatId
        toolsArray, // tools
        dateFilter, // dateFilter
        selectedCountries // selectedCountries
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setIsLoading(false);
    }
  };

  // Mock mode hook
  const mockModeHook = useMockMode();
  const isMockMode = mockModeHook.useMockMode;
  const toggleMockMode = mockModeHook.toggleMockMode;

  // Translation hook
  const { t: translation } = useTranslation();

  // Safe toggle function
  const handleMockModeToggle = React.useCallback(() => {
    if (toggleMockMode) {
      toggleMockMode();
    }
  }, [toggleMockMode]);

  // Streaming client for both API and mock modes
  const streamingClientRef = useRef<StreamingClient | null>(null);

  useEffect(() => {
    streamingClientRef.current = new StreamingClient();
  }, []);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Authentication handlers
  const handleLogin = (token: string, userId: string, email: string) => {
    setAuthToken(token);
    setUserId(userId);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setAuthToken('');
    setUserId(null);
    setUserEmail(null);
    setChatList([]);
    setLoadedConversations(new Map());
    setCurrentConversationId(null);
  };

  // Load chat list from MongoDB on mount and when auth changes
  useEffect(() => {
    const loadChatList = async () => {
      if (!authToken || !userId) {
        setChatList([]);
        return;
      }

      try {
        const chats = await chatService.listChats(authToken);
        const chatListData = chats.map((chat) => ({
          id: chat.chatId,
          title: chat.name,
          lastUpdated: new Date(chat.lastMessageAt),
        }));

        // Sort by lastMessageAt descending
        chatListData.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

        setChatList(chatListData);
        console.log(`✅ Loaded ${chatListData.length} chat names from MongoDB`);
      } catch (error) {
        console.error("Failed to load chat list from MongoDB:", error);
        setChatList([]);
      }
    };

    loadChatList();
  }, [authToken, userId]);

  // Load current conversation messages on mount and when currentConversationId changes
  useEffect(() => {
    const loadCurrentConversation = async () => {
      if (!authToken || !currentConversationId) {
        return;
      }

      // Don't reload if already loaded
      if (loadedConversations.has(currentConversationId)) {
        return;
      }

      try {
        const conversation = await chatService.loadChatFromMongo(currentConversationId, authToken);
        if (conversation) {
          setLoadedConversations((prev) => {
            const updated = new Map(prev);
            updated.set(conversation.id, conversation);
            return updated;
          });
          console.log(`✅ Loaded current conversation ${currentConversationId} from MongoDB`);
        }
      } catch (error) {
        console.error(`Failed to load current conversation ${currentConversationId}:`, error);
      }
    };

    loadCurrentConversation();
  }, [authToken, currentConversationId, loadedConversations]);

  // Save streaming conversation periodically
  useEffect(() => {
    if (!streamingConversationId || !authToken || !userId) return;

    const conversation = loadedConversations.get(streamingConversationId);
    if (!conversation) return;

    // Save streaming conversation every 5 seconds
    const interval = setInterval(() => {
      // Get the latest content from ref and update conversation before saving
      const currentContent = accumulatedStreamContentRef.current;
      if (currentContent) {
        updateLoadedConversation(streamingConversationId, (conv) => {
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

      const updatedConversation = loadedConversations.get(streamingConversationId);
      if (updatedConversation) {
        chatService.saveChatToMongo(updatedConversation, authToken, userId).catch((error) => {
          console.error("Failed to save streaming conversation to MongoDB:", error);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [streamingConversationId, loadedConversations, authToken, userId]);

  // Save stream content on component unmount
  useEffect(() => {
    return () => {
      // Cleanup: save current stream content when component unmounts
      if (streamingConversationId && authToken && userId) {
        const currentContent = accumulatedStreamContentRef.current;
        if (currentContent) {
          const conversation = loadedConversations.get(streamingConversationId);
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

              // Save to MongoDB
              chatService.saveChatToMongo(updatedConv, authToken, userId).catch((error) => {
                console.error("Failed to save stream content on unmount:", error);
              });
            }
          }
        }
      }
    };
  }, [streamingConversationId, loadedConversations, authToken, userId]);

  // Save stream content on page reload/unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Save current stream content before page unloads
      if (streamingConversationId && authToken && userId) {
        const currentContent = accumulatedStreamContentRef.current;
        if (currentContent) {
          const conversation = loadedConversations.get(streamingConversationId);
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

              // Try to save synchronously (might not work, but attempt it)
              chatService.saveChatToMongo(updatedConv, authToken, userId).catch((error) => {
                console.error("Failed to save stream content on page unload:", error);
              });
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
  }, [streamingConversationId, loadedConversations, authToken, userId]);

  // Initialize responsive sidebar for new users only
  useEffect(() => {
    if (!isSidebarOpen && window.innerWidth >= 768) {
      const isMobile = window.innerWidth < 768;
      setIsSidebarOpen(!isMobile);
    }
  }, []);


  // Theme toggle now uses localStorage hook
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

    // Sidebar toggle now uses localStorage hook
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle sidebar width changes
  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
  };

  // Load conversation when selected from sidebar
  const loadConversation = async (chatId: string) => {
    if (!authToken) return;

    // Don't reload if already loaded
    if (loadedConversations.has(chatId)) {
      setCurrentConversationId(chatId);
      return;
    }

    try {
      const conversation = await chatService.loadChatFromMongo(chatId, authToken);
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
  };

  const createNewConversation = async () => {
    const newConversation: Conversation = {
      id: generateUniqueId(),
      title: translation("sidebar.newChatTitle"),
      titleKey: "sidebar.newChatTitle", // Store the translation key
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdated: new Date(),
    };

    // Add to chat list
    setChatList((prev) => [
      {
        id: newConversation.id,
        title: newConversation.title,
        lastUpdated: newConversation.lastUpdated,
      },
      ...prev,
    ]);

    // Add to loaded conversations
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      updated.set(newConversation.id, newConversation);
      return updated;
    });

    setCurrentConversationId(newConversation.id);

    // Save to MongoDB if authenticated
    if (authToken && userId) {
      try {
        await chatService.saveChatToMongo(newConversation, authToken, userId);
      } catch (error) {
        console.error("Failed to save new conversation to MongoDB:", error);
      }
    }
  };

  const deleteConversation = async (id: string) => {
    // Remove from chat list
    setChatList((prev) => prev.filter((chat) => chat.id !== id));

    // Remove from loaded conversations
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });

    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }

    // Delete from MongoDB if authenticated
    if (authToken) {
      try {
        await chatService.deleteChat(id, authToken);
        console.log(`✅ Deleted chat ${id} from MongoDB`);
      } catch (error) {
        console.error("Failed to delete conversation from MongoDB:", error);
      }
    }
  };

  const renameConversation = async (id: string, newTitle: string) => {
    // Update chat list
    setChatList((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    );

    // Update loaded conversation if it exists
    setLoadedConversations((prev) => {
      const updated = new Map(prev);
      const conversation = updated.get(id);
      if (conversation) {
        updated.set(id, {
          ...conversation,
          title: newTitle,
          titleKey: undefined, // Remove titleKey when setting custom title
          lastUpdated: new Date(),
        });
      }
      return updated;
    });

    // Update in MongoDB if authenticated
    if (authToken) {
      try {
        await chatService.updateChatName(id, newTitle, authToken);
        console.log(`✅ Renamed chat ${id} to "${newTitle}" in MongoDB`);
      } catch (error) {
        console.error("Failed to rename conversation in MongoDB:", error);
      }
    }
  };

  const refreshMessage = async (messageId: string) => {
    const conversation = currentConversation;
    if (!conversation || isLoading) return;

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
      // For assistant messages: find the previous user message and regenerate from there
      const previousUserMessageIndex = conversation.messages
        .slice(0, messageIndex)
        .reverse()
        .findIndex((m) => m.role === "user");

      if (previousUserMessageIndex === -1) return; // No previous user message found

      const actualUserIndex = messageIndex - 1 - previousUserMessageIndex;
      messagesToSend = conversation.messages.slice(0, actualUserIndex + 1);
      messagesToKeep = conversation.messages.slice(0, actualUserIndex + 1);
    }

    // Create a new assistant message placeholder for streaming
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
      chatService.saveChatToMongo(updatedConv, authToken, userId).catch((error) => {
        console.error("Failed to save conversation before refresh to MongoDB:", error);
      });
    }

    setIsLoading(true);
    setStreamingConversationId(conversation.id);

    try {
      const streamingClient = streamingClientRef.current;
      if (!streamingClient) {
        throw new Error("Streaming client not initialized");
      }

      // console.log(`🔄 Regenerating ${isMockMode ? 'with MOCK' : 'with API'}...`);

      // Store the streaming client for abort functionality
      setCurrentAbortController({
        abort: () => streamingClient.abort(),
      } as AbortController);

      let currentContent = "";

      await streamingClient.streamChat(
        messagesToSend,
        // onToken callback
        (token: string, metadata?: any) => {
          currentContent += token;

          // Update the message content with metadata
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
        () => {
          // Mark streaming as complete
          updateLoadedConversation(conversation.id, (conv) => {
            const finalConversation = {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === newAssistantMessageId
                  ? { ...m, content: currentContent, isStreaming: false }
                  : m
              ),
              lastUpdated: new Date(),
            };

            // Save to MongoDB if authenticated
            if (authToken && userId) {
              chatService.saveChatToMongo(finalConversation, authToken, userId).catch((error) => {
                console.error("Failed to save refreshed conversation to MongoDB:", error);
              });
            }

            return finalConversation;
          });
          setIsLoading(false);
          setStreamingConversationId(null);
          setCurrentAbortController(null);
          // console.log(`✅ Regeneration completed using ${isMockMode ? 'Mock' : 'API'} mode`);
        },
        // onError callback
        (error: Error) => {
          console.error("Failed to refresh message:", error);
          throw error;
        },
        // baseUrl for API mode
        getBaseApiUrl(),
        // authToken for API mode
        authToken || undefined,
        // chatId for API mode
        conversation.id,
        // tools for API mode
        []
      );
    } catch (error) {
      console.error("Failed to refresh message:", error);
      // Add error message
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
  };

  const editMessage = (messageId: string) => {
    const conversation = currentConversation;
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

    // Set the input to the message content for editing
    setInput(messageToEdit.content);

    // Remove all messages after this one (including this one) for regeneration
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
      chatService.saveChatToMongo(updatedConv, authToken, userId).catch((error) => {
        console.error("Failed to save edited conversation to MongoDB:", error);
      });
    }

    // console.log(`Editing message: "${messageToEdit.content}"`);
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentConversationId || !authToken) return;

    // Update local state immediately for better UX
    updateLoadedConversation(currentConversationId, (conv) => {
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

    // Delete from MongoDB via backend API
    try {
      await chatService.deleteMessage(currentConversationId, messageId, authToken);
      console.log(`✅ Message ${messageId} and subsequent messages deleted`);
    } catch (error) {
      console.error("Failed to delete message from MongoDB:", error);
      // Reload conversation from MongoDB to sync state
      if (currentConversationId && authToken) {
        try {
          const reloaded = await chatService.loadChatFromMongo(currentConversationId, authToken);
          if (reloaded) {
            updateLoadedConversation(currentConversationId, () => reloaded);
          }
        } catch (reloadError) {
          console.error("Failed to reload conversation after delete error:", reloadError);
        }
      }
    }
  };

  const shareMessage = (messageId: string) => {
    // console.log('Sharing message:', messageId);
    // Additional share tracking or analytics could go here
  };

  // Control button handlers
  const handleVoiceInput = () => {
    // TODO: Implement voice input functionality
    console.log("Voice input clicked");
    // You can implement Web Speech API here
  };

  const handleClearInput = () => {
    setInput("");
    console.log("Input cleared");
  };

  const handleAttachment = () => {
    setIsFileManagerOpen(true);
  };

  const handleFileUploaded = (file: any) => {
    console.log("File uploaded:", file);
    setAttachedFiles((prev) => [...prev, file]);
  };

  const handleRemoveAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Report panel handlers

  const closeReportPanel = () => {
    setIsReportPanelOpen(false);
    setReportData(null);
  };

  const handleReportPanelWidthChange = (width: number) => {
    setReportPanelWidth(width);
  };

  // Function to open report from URL (for links in messages)
  const openReportFromUrl = async (url: string) => {
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
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <LoginForm onLogin={handleLogin} isDarkMode={isDarkMode} />
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
        {/* Main Layout Container */}
        <Box
          id="iagent-main-layout"
          className="iagent-layout-horizontal"
          sx={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* Sidebar Container */}
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
          />

          {/* Conversation Area Container */}
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
            {/* Chat Messages Area */}
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
              onAttachment={handleAttachment}
              onFileUploaded={handleFileUploaded}
              showVoiceButton={false} // Enable when voice functionality is ready
              showClearButton={true} // Always show clear button
              showAttachmentButton={true} // Enable document attachment functionality
              // Filter management
              currentChatId={currentConversationId || undefined}
              authToken={authToken || undefined}
            />
          </Box>

          {/* Report Details Panel */}
          <ReportDetailsPanel
            open={isReportPanelOpen}
            onClose={closeReportPanel}
            isDarkMode={isDarkMode}
            reportData={reportData}
            isLoading={isReportLoading}
            width={reportPanelWidth}
            onWidthChange={handleReportPanelWidthChange}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;

