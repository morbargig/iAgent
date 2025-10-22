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
import { FileManagerDialog } from "../components/FileManagerDialog";
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
} from "@iagent/stream-mocks";
import { useMockMode } from "../hooks/useMockMode";
import { useSidebarState, useThemeMode } from "../hooks/useLocalStorage";

import { generateUniqueId } from "../utils/id-generator";

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
  const [isDarkMode, setIsDarkMode] = useThemeMode();
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  // This variable is used in the component logic
  const [userId, setUserId] = useState<string | null>(null);

  // Explicit usage to satisfy TypeScript strict mode
  if (userId !== null) console.log("User ID:", userId);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Report panel state
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportPanelWidth, setReportPanelWidth] = useState(350);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // File management state
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);

  // Stop generation function
  const stopGeneration = () => {
    if (streamingClient.current) {
      streamingClient.current.abort();

      // Mark the current streaming message as interrupted
      if (streamingConversationId) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === streamingConversationId) {
              const lastMessage = conv.messages[conv.messages.length - 1];
              if (lastMessage && lastMessage.isStreaming) {
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    updateMessageContent(
                      lastMessage,
                      lastMessage.content,
                      false,
                      true
                    ), // Mark as interrupted
                  ],
                  lastUpdated: new Date(),
                };
              }
            }
            return conv;
          })
        );
      }

      setIsLoading(false);
      setStreamingConversationId(null);
    }
  };

  const currentConversation = useMemo(() => {
    return (
      conversations.find((conv) => conv.id === currentConversationId) || null
    );
  }, [conversations, currentConversationId]);

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

      setConversations((prev) =>
        currentConversation
          ? prev.map((conv) =>
              conv.id === currentConversationId ? updatedConversation : conv
            )
          : [...prev, updatedConversation]
      );

      if (!currentConversation) {
        setCurrentConversationId(updatedConversation.id);
        setStreamingConversationId(updatedConversation.id); // Update streaming ID for new conversation

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

      // Stream the response
      await streamingClient.current.streamChat(
        updatedConversation.messages,
        (token: string, metadata?: Record<string, any>) => {
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === updatedConversation.id) {
                const lastMessage = conv.messages[conv.messages.length - 1];
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    updateMessageContent(
                      lastMessage,
                      lastMessage.content + token,
                      true
                    ),
                  ],
                  lastUpdated: new Date(),
                };
              }
              return conv;
            })
          );
        },
        () => {
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === updatedConversation.id) {
                const lastMessage = conv.messages[conv.messages.length - 1];
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    updateMessageContent(
                      lastMessage,
                      lastMessage.content,
                      false
                    ),
                  ],
                  lastUpdated: new Date(),
                };
              }
              return conv;
            })
          );
          setIsLoading(false);
          setStreamingConversationId(null); // Clear streaming conversation
        },
        (error: Error) => {
          setError(error.message);
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === updatedConversation.id) {
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
              }
              return conv;
            })
          );
          setIsLoading(false);
          setStreamingConversationId(null); // Clear streaming conversation
        },
        isMockMode, // useMock
        "http://localhost:3030",
        translation,
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
    setIsAuthenticated(true);

    // Save auth to localStorage
    localStorage.setItem("chatbot-auth-token", token);
    localStorage.setItem("chatbot-user-id", userId);
    localStorage.setItem("chatbot-user-email", email);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUserId(null);
    setUserEmail(null);
    setIsAuthenticated(false);

    // Clear auth from localStorage
    localStorage.removeItem("chatbot-auth-token");
    localStorage.removeItem("chatbot-user-id");
    localStorage.removeItem("chatbot-user-email");

    // Clear conversations and other data
    setConversations([]);
    setCurrentConversationId(null);
    localStorage.removeItem("chatbot-conversations");
    localStorage.removeItem("chatbot-current-conversation-id");
  };

  // Load conversations, theme preference, sidebar state, and auth from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("chatbot-auth-token");
    const savedUserId = localStorage.getItem("chatbot-user-id");
    const savedUserEmail = localStorage.getItem("chatbot-user-email");
    const savedConversations = localStorage.getItem("chatbot-conversations");
    const savedCurrentId = localStorage.getItem(
      "chatbot-current-conversation-id"
    );
    const savedSidebarOpen = localStorage.getItem("chatbot-sidebar-open");

    // Restore authentication if available
    if (savedToken && savedUserId && savedUserEmail) {
      setAuthToken(savedToken);
      setUserId(savedUserId);
      setUserEmail(savedUserEmail);
      setIsAuthenticated(true);
    }

    if (savedConversations) {
      try {
        const parsedConversations = JSON.parse(savedConversations).map(
          (conv: any) => ({
            ...conv,
            id: conv.id.includes("-") ? conv.id : generateUniqueId(), // Ensure unique ID format
            lastUpdated: new Date(conv.lastUpdated),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              id: msg.id.includes("-") ? msg.id : generateUniqueId(), // Ensure unique message IDs
              timestamp: new Date(msg.timestamp),
              isStreaming: false, // Reset streaming state on page load
            })),
          })
        );

        // Check for duplicate IDs and fix them
        const seenIds = new Set();
        const fixedConversations = parsedConversations.map((conv: any) => {
          if (seenIds.has(conv.id)) {
            conv.id = generateUniqueId();
          }
          seenIds.add(conv.id);

          const seenMessageIds = new Set();
          conv.messages = conv.messages.map((msg: any) => {
            if (seenMessageIds.has(msg.id)) {
              msg.id = generateUniqueId();
            }
            seenMessageIds.add(msg.id);
            return msg;
          });

          return conv;
        });

        setConversations(fixedConversations);
      } catch (error) {
        console.error("Failed to load conversations from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem("chatbot-conversations");
        localStorage.removeItem("chatbot-current-conversation-id");
      }
    }

    if (savedCurrentId) {
      setCurrentConversationId(savedCurrentId);
    }

    // Theme is now handled by useThemeMode hook

    // Sidebar state is now handled by useSidebarState hook
    // Initialize responsive sidebar for new users only
    if (savedSidebarOpen === null) {
      const isMobile = window.innerWidth < 768; // Mobile breakpoint
      const defaultSidebarState = !isMobile;
      setIsSidebarOpen(defaultSidebarState);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        "chatbot-conversations",
        JSON.stringify(conversations)
      );
    }
  }, [conversations]);

  // Save current conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(
        "chatbot-current-conversation-id",
        currentConversationId
      );
    } else {
      localStorage.removeItem("chatbot-current-conversation-id");
    }
  }, [currentConversationId]);

  // Theme toggle now uses localStorage hook
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Sidebar toggle now uses localStorage hook
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    // Force immediate localStorage update for synchronization
    localStorage.setItem("chatbot-sidebar-open", newState.toString());
  };

  // Handle sidebar width changes
  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateUniqueId(),
      title: translation("sidebar.newChatTitle"),
      titleKey: "sidebar.newChatTitle", // Store the translation key
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdated: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter((c) => c.id !== id);
    setConversations(updatedConversations);

    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }

    // Clear localStorage if no conversations remain
    if (updatedConversations.length === 0) {
      localStorage.removeItem("chatbot-conversations");
      localStorage.removeItem("chatbot-current-conversation-id");
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id
          ? {
              ...conv,
              title: newTitle,
              titleKey: undefined, // Remove titleKey when setting custom title
              lastUpdated: new Date(),
            }
          : conv
      )
    );
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
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id
          ? {
              ...c,
              messages: [...messagesToKeep, newAssistantMessage],
              lastUpdated: new Date(),
            }
          : c
      )
    );

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
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversation.id
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
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
                  }
                : c
            )
          );
        },
        // onComplete callback
        () => {
          // Mark streaming as complete
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversation.id
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === newAssistantMessageId
                        ? { ...m, content: currentContent, isStreaming: false }
                        : m
                    ),
                    lastUpdated: new Date(),
                  }
                : c
            )
          );
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
        // useMock flag
        isMockMode,
        // baseUrl for API mode
        "http://localhost:3030",
        // translation function
        translation,
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

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMessageId ? errorMessage : m
                ),
                lastUpdated: new Date(),
              }
            : c
        )
      );
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

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id
          ? {
              ...c,
              messages: messagesToKeep,
              lastUpdated: new Date(),
            }
          : c
      )
    );

    // console.log(`Editing message: "${messageToEdit.content}"`);
  };

  const deleteMessage = (messageId: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: conv.messages.filter((msg) => msg.id !== messageId),
              lastUpdated: new Date(),
            }
          : conv
      )
    );
    // console.log('Message deleted:', messageId);
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
            onSelectConversation={setCurrentConversationId}
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
              attachedFiles={attachedFiles}
              onRemoveAttachedFile={handleRemoveAttachedFile}
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

        {/* File Manager Dialog */}
        <FileManagerDialog
          open={isFileManagerOpen}
          onClose={() => setIsFileManagerOpen(false)}
          onFileSelected={(file) => {
            console.log("File selected for attachment:", file);
            // You can add the file to the message or handle it as needed
          }}
          title="Attach File to Message"
          showAttachButton={true}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
