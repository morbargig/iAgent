// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { useTranslation } from '../contexts/TranslationContext';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { InputArea } from '../components/InputArea';
import { StreamingClient, createMessage, createStreamingMessage, updateMessageContent, type Message, type Conversation } from '@chatbot-app/stream-mocks';
import { useMockMode } from '../hooks/useMockMode';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { TranslationProvider } from '../contexts/TranslationContext';
import { generateUniqueId } from '../utils/id-generator';

// iagent-inspired Design System
// Philosophy: Clean, minimal, muted aesthetic with subtle interactions

const iagentDesignTokens = {
  // Typography - Geist-inspired clean typography
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
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
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  
  // Border Radius - Subtle, modern curves
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
  },
  
  // Color Philosophy: Muted, accessible, clean
  colors: {
    // Dark theme
    dark: {
      background: {
        primary: '#0a0a0a',      // Deep, clean background
        secondary: '#171717',    // Subtle elevation
        tertiary: '#262626',     // Cards, elevated surfaces
        muted: '#404040',        // Muted backgrounds
      },
      text: {
        primary: '#fafafa',      // High contrast text
        secondary: '#a3a3a3',    // Muted text
        tertiary: '#737373',     // Subtle text
      },
      border: '#262626',         // Subtle borders
      accent: '#3b82f6',         // Clean blue accent
      hover: 'rgba(255, 255, 255, 0.05)', // Gentle hover
    },
    // Light theme
    light: {
      background: {
        primary: '#ffffff',      // Pure white
        secondary: '#f9fafb',    // Subtle gray
        tertiary: '#f3f4f6',     // Muted background
        muted: '#e5e7eb',        // Muted surfaces
      },
      text: {
        primary: '#111827',      // Clean dark text
        secondary: '#6b7280',    // Muted text
        tertiary: '#9ca3af',     // Subtle text
      },
      border: '#e5e7eb',         // Light borders
      accent: '#3b82f6',         // Consistent blue
      hover: 'rgba(0, 0, 0, 0.05)', // Gentle hover
    },
  },
  
  // Shadows - Subtle, clean elevation
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  
  // Animation - Smooth, subtle
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Dark Theme - Clean, muted aesthetic
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: iagentDesignTokens.colors.dark.accent,
      light: '#60a5fa',
      dark: '#2563eb',
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
      selected: 'rgba(255, 255, 255, 0.08)',
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
          textTransform: 'none',
          borderRadius: iagentDesignTokens.borderRadius.lg,
          fontWeight: iagentDesignTokens.typography.weights.medium,
          fontSize: iagentDesignTokens.typography.sizes.sm,
          padding: `${iagentDesignTokens.spacing.md} ${iagentDesignTokens.spacing.lg}`,
          transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: iagentDesignTokens.borderRadius.lg,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
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
    mode: 'light',
    primary: {
      main: iagentDesignTokens.colors.light.accent,
      light: '#60a5fa',
      dark: '#2563eb',
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
      selected: 'rgba(0, 0, 0, 0.04)',
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
          textTransform: 'none',
          borderRadius: iagentDesignTokens.borderRadius.lg,
          fontWeight: iagentDesignTokens.typography.weights.medium,
          fontSize: iagentDesignTokens.typography.sizes.sm,
          padding: `${iagentDesignTokens.spacing.md} ${iagentDesignTokens.spacing.lg}`,
          transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: iagentDesignTokens.borderRadius.lg,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: iagentDesignTokens.borderRadius.lg,
            transition: `all ${iagentDesignTokens.animation.duration.normal} ${iagentDesignTokens.animation.easing}`,
          },
        },
      },
    },
  },
});

const App = () => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null);
  const streamingClient = useRef(new StreamingClient());

  const currentConversation = useMemo(() => {
    return conversations.find(conv => conv.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const userMessage = createMessage('user', content);
      const assistantMessage = createStreamingMessage('assistant');

      // Update conversation with new messages
      const updatedConversation: Conversation = currentConversation
        ? {
            ...currentConversation,
            messages: [...currentConversation.messages, userMessage, assistantMessage],
            lastUpdated: new Date(),
          }
        : {
            id: generateUniqueId(),
            title: content.slice(0, 30) + '...',
            messages: [userMessage, assistantMessage],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUpdated: new Date(),
          };

      setConversations(prev =>
        currentConversation
          ? prev.map(conv =>
              conv.id === currentConversationId ? updatedConversation : conv
            )
          : [...prev, updatedConversation]
      );

      if (!currentConversation) {
        setCurrentConversationId(updatedConversation.id);
      }

      // Stream the response
      await streamingClient.current.streamChat(
        updatedConversation.messages,
        (token: string, metadata?: Record<string, any>) => {
          setConversations(prev =>
            prev.map(conv => {
              if (conv.id === updatedConversation.id) {
                const lastMessage = conv.messages[conv.messages.length - 1];
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    updateMessageContent(lastMessage, lastMessage.content + token, true),
                  ],
                  lastUpdated: new Date(),
                };
              }
              return conv;
            })
          );
        },
        () => {
          setConversations(prev =>
            prev.map(conv => {
              if (conv.id === updatedConversation.id) {
                const lastMessage = conv.messages[conv.messages.length - 1];
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    updateMessageContent(lastMessage, lastMessage.content, false),
                  ],
                  lastUpdated: new Date(),
                };
              }
              return conv;
            })
          );
          setIsLoading(false);
        },
        (error: Error) => {
          setError(error.message);
          setConversations(prev =>
            prev.map(conv => {
              if (conv.id === updatedConversation.id) {
                const lastMessage = conv.messages[conv.messages.length - 1];
                return {
                  ...conv,
                  messages: [
                    ...conv.messages.slice(0, -1),
                    updateMessageContent(
                      lastMessage,
                      t('errors.streaming', { error: error.message }),
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
        },
        true, // useMock
        'http://localhost:3000',
        t
      );

      setInput('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
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

  // Load conversations, theme preference, and sidebar state from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatbot-conversations');
    const savedCurrentId = localStorage.getItem('chatbot-current-conversation-id');
    const savedTheme = localStorage.getItem('chatbot-theme');
    const savedSidebarOpen = localStorage.getItem('chatbot-sidebar-open');
    
    if (savedConversations) {
      try {
        const parsedConversations = JSON.parse(savedConversations).map((conv: any) => ({
          ...conv,
          id: conv.id.includes('-') ? conv.id : generateUniqueId(), // Ensure unique ID format
          lastUpdated: new Date(conv.lastUpdated),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            id: msg.id.includes('-') ? msg.id : generateUniqueId(), // Ensure unique message IDs
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
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
        console.error('Failed to load conversations from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('chatbot-conversations');
        localStorage.removeItem('chatbot-current-conversation-id');
      }
    }
    
    if (savedCurrentId) {
      setCurrentConversationId(savedCurrentId);
    }
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    
    // Responsive sidebar state - hidden on mobile, visible on desktop
    if (savedSidebarOpen !== null) {
      setIsSidebarOpen(savedSidebarOpen === 'true');
    } else {
      const isMobile = window.innerWidth < 768; // Mobile breakpoint
      const defaultSidebarState = !isMobile;
      setIsSidebarOpen(defaultSidebarState);
      localStorage.setItem('chatbot-sidebar-open', defaultSidebarState.toString());
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chatbot-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save current conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('chatbot-current-conversation-id', currentConversationId);
    } else {
      localStorage.removeItem('chatbot-current-conversation-id');
    }
  }, [currentConversationId]);

  // Save theme preference to localStorage with smooth transitions
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('chatbot-theme', newTheme ? 'dark' : 'light');
  };

  // Toggle sidebar with smooth slide animation (300ms)
  const toggleSidebar = () => {
    const newSidebarState = !isSidebarOpen;
    setIsSidebarOpen(newSidebarState);
    localStorage.setItem('chatbot-sidebar-open', newSidebarState.toString());
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateUniqueId(),
      title: t('sidebar.newChatTitle'),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdated: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
    
    // Clear localStorage if no conversations remain
    if (updatedConversations.length === 0) {
      localStorage.removeItem('chatbot-conversations');
      localStorage.removeItem('chatbot-current-conversation-id');
    }
  };

  const refreshMessage = async (messageId: string) => {
    const conversation = currentConversation;
    if (!conversation || isLoading) return;

    // Find the message and get the conversation history up to that point
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const targetMessage = conversation.messages[messageIndex];

    let messagesToSend: Message[];
    let messagesToKeep: Message[];

    if (targetMessage.role === 'user') {
      // For user messages: regenerate from this user message
      messagesToSend = conversation.messages.slice(0, messageIndex + 1);
      messagesToKeep = conversation.messages.slice(0, messageIndex + 1);
    } else {
      // For assistant messages: find the previous user message and regenerate from there
      const previousUserMessageIndex = conversation.messages.slice(0, messageIndex)
        .reverse()
        .findIndex(m => m.role === 'user');
      
      if (previousUserMessageIndex === -1) return; // No previous user message found
      
      const actualUserIndex = messageIndex - 1 - previousUserMessageIndex;
      messagesToSend = conversation.messages.slice(0, actualUserIndex + 1);
      messagesToKeep = conversation.messages.slice(0, actualUserIndex + 1);
    }
    
    // Create a new assistant message placeholder for streaming
    const newAssistantMessageId = generateUniqueId();
    const newAssistantMessage: Message = {
      id: newAssistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    // Update conversation with messages up to user message + new assistant placeholder
    setConversations(prev => prev.map(c => 
      c.id === conversation.id 
        ? { 
            ...c, 
            messages: [...messagesToKeep, newAssistantMessage],
            lastUpdated: new Date() 
          }
        : c
    ));

    setIsLoading(true);

    try {
      const streamingClient = streamingClientRef.current;
      if (!streamingClient) {
        throw new Error('Streaming client not initialized');
      }

      console.log(`🔄 Regenerating ${isMockMode ? 'with MOCK' : 'with API'}...`);

      // Store the streaming client for abort functionality
      setCurrentAbortController({ abort: () => streamingClient.abort() } as AbortController);

      let currentContent = '';

      await streamingClient.streamChat(
        messagesToSend,
        // onToken callback
        (token: string, metadata?: any) => {
          currentContent += token;

          // Update the message content with metadata
          setConversations(prev => prev.map(c => 
            c.id === conversation.id 
              ? { 
                  ...c, 
                  messages: c.messages.map(m => 
                    m.id === newAssistantMessageId 
                      ? { 
                          ...m, 
                          content: currentContent,
                          metadata: metadata,
                          isStreaming: true 
                        }
                      : m
                  ),
                  lastUpdated: new Date() 
                }
              : c
          ));
        },
        // onComplete callback
        () => {
          // Mark streaming as complete
          setConversations(prev => prev.map(c => 
            c.id === conversation.id 
              ? { 
                  ...c, 
                  messages: c.messages.map(m => 
                    m.id === newAssistantMessageId 
                      ? { ...m, content: currentContent, isStreaming: false }
                      : m
                  ),
                  lastUpdated: new Date() 
                }
              : c
          ));
          console.log(`✅ Regeneration completed using ${isMockMode ? 'Mock' : 'API'} mode`);
        },
        // onError callback
        (error: Error) => {
          console.error('Failed to refresh message:', error);
          throw error;
        },
        // useMock flag
        isMockMode,
        // baseUrl for API mode
        'http://localhost:3000'
      );
    } catch (error) {
      console.error('Failed to refresh message:', error);
      // Add error message
      const errorMessage: Message = {
        id: newAssistantMessageId,
        role: 'assistant',
        content: 'Sorry, I encountered an error while regenerating. Please try again.',
        timestamp: new Date(),
      };

      setConversations(prev => prev.map(c => 
        c.id === conversation.id 
          ? { 
              ...c, 
              messages: c.messages.map(m => 
                m.id === newAssistantMessageId ? errorMessage : m
              ),
              lastUpdated: new Date() 
            }
          : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const [editingState, setEditingState] = React.useState<{
    messageId: string;
    originalContent: string;
    originalMessages: Message[];
  } | null>(null);

  const editMessage = (messageId: string) => {
    const conversation = currentConversation;
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || conversation.messages[messageIndex].role !== 'user') return;

    const messageToEdit = conversation.messages[messageIndex];
    
    // Store the original state for potential discard
    setEditingState({
      messageId,
      originalContent: messageToEdit.content,
      originalMessages: [...conversation.messages]
    });
    
    // Set the input to the message content for editing
    setInput(messageToEdit.content);
    
    // Remove all messages after this one (including this one) for regeneration
    const messagesToKeep = conversation.messages.slice(0, messageIndex);
    
    setConversations(prev => prev.map(c => 
      c.id === conversation.id 
        ? {
            ...c, 
            messages: messagesToKeep,
            lastUpdated: new Date()
          }
        : c
    ));
    
    console.log(`Editing message: "${messageToEdit.content}"`);
  };

  const discardEdit = () => {
    if (!editingState || !currentConversation) return;

    // Restore the original messages
    setConversations(prev => prev.map(c => 
      c.id === currentConversation.id 
        ? {
            ...c, 
            messages: editingState.originalMessages,
            lastUpdated: new Date()
          }
        : c
    ));

    // Clear the input and editing state
    setInput('');
    setEditingState(null);
    
    console.log('Edit discarded, messages restored');
  };

  const deleteMessage = (messageId: string) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === currentConversationId 
          ? {
              ...conv,
              messages: conv.messages.filter(msg => msg.id !== messageId),
              lastUpdated: new Date()
            }
          : conv
      )
    );
    console.log('Message deleted:', messageId);
  };

  const shareMessage = (messageId: string) => {
    console.log('Sharing message:', messageId);
    // Additional share tracking or analytics could go here
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Sidebar
            open={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={setCurrentConversationId}
            onNewConversation={createNewConversation}
            onDeleteConversation={deleteConversation}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <ChatArea
              messages={currentConversation?.messages || []}
              isLoading={isLoading}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              useMockMode={isMockMode}
              onToggleMockMode={handleMockModeToggle}
              onRefreshMessage={refreshMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onShareMessage={shareMessage}
            />
            <InputArea
              value={input}
              onChange={setInput}
              onSend={() => handleSendMessage(input)}
              onStop={() => {
                if (currentAbortController) {
                  currentAbortController.abort();
                  setCurrentAbortController(null);
                }
                setIsLoading(false);
              }}
              disabled={isLoading}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
              sidebarOpen={isSidebarOpen}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;

