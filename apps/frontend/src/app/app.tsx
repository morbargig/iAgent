// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { InputArea } from '../components/InputArea';

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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    index?: number;
    total_tokens?: number;
    timestamp?: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    processing_time_ms?: number;
    confidence?: number;
    categories?: string[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode like ChatGPT

  const currentConversation = conversations.find(c => c.id === currentConversationId);
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
          lastUpdated: new Date(conv.lastUpdated),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(parsedConversations);
      } catch (error) {
        console.error('Failed to load conversations from localStorage:', error);
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
      setSidebarOpen(savedSidebarOpen === 'true');
    } else {
      const isMobile = window.innerWidth < 768; // Mobile breakpoint
      const defaultSidebarState = !isMobile;
      setSidebarOpen(defaultSidebarState);
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
    const newSidebarState = !sidebarOpen;
    setSidebarOpen(newSidebarState);
    localStorage.setItem('chatbot-sidebar-open', newSidebarState.toString());
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastUpdated: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let conversation = currentConversation;
    
    // Create new conversation if none exists
    if (!conversation) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        lastUpdated: new Date(),
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      conversation = newConversation;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Add user message
    setConversations(prev => prev.map(c => 
      c.id === conversation!.id 
        ? { ...c, messages: [...c.messages, userMessage], lastUpdated: new Date() }
        : c
    ));

    const messageInput = input;
    setInput('');
    setIsLoading(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    // Add assistant message placeholder
    setConversations(prev => prev.map(c => 
      c.id === conversation!.id 
        ? { ...c, messages: [...c.messages, assistantMessage], lastUpdated: new Date() }
        : c
    ));

    try {
      // Use streaming endpoint
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...conversation.messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let currentContent = '';
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Mark streaming as complete
              setConversations(prev => prev.map(c => 
                c.id === conversation!.id 
                  ? { 
                      ...c, 
                      messages: c.messages.map(m => 
                        m.id === assistantMessageId 
                          ? { ...m, isStreaming: false }
                          : m
                      ),
                      lastUpdated: new Date() 
                    }
                  : c
              ));
              break;
            }

            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete JSON lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const jsonChunk = JSON.parse(line);
                  const { token, done, metadata } = jsonChunk;
                  
                  currentContent += token;

                  // Update the message content with metadata
                  setConversations(prev => prev.map(c => 
                    c.id === conversation!.id 
                      ? { 
                          ...c, 
                          messages: c.messages.map(m => 
                            m.id === assistantMessageId 
                              ? { 
                                  ...m, 
                                  content: currentContent,
                                  metadata: metadata,
                                  isStreaming: !done 
                                }
                              : m
                          ),
                          lastUpdated: new Date() 
                        }
                      : c
                  ));

                  if (metadata) {
                    console.log(`Progress: ${metadata.index}/${metadata.total_tokens}`, {
                      confidence: metadata.confidence,
                      categories: metadata.categories,
                      usage: metadata.usage
                    });
                  }

                  if (done) break;
                } catch (parseError) {
                  console.warn('Failed to parse JSON chunk:', line, parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setConversations(prev => prev.map(c => 
        c.id === conversation!.id 
          ? { 
              ...c, 
              messages: c.messages.map(m => 
                m.id === assistantMessageId ? errorMessage : m
              ),
              lastUpdated: new Date() 
            }
          : c
      ));
    } finally {
      setIsLoading(false);
    }
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

    // Find the user message and get the conversation history up to that point
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || conversation.messages[messageIndex].role !== 'user') return;

    // Get messages up to and including the user message to regenerate from
    const messagesToSend = conversation.messages.slice(0, messageIndex + 1);
    
    // Remove all assistant messages after this user message
    const messagesToKeep = conversation.messages.slice(0, messageIndex + 1);
    
    // Create a new assistant message placeholder for streaming
    const newAssistantMessageId = Date.now().toString();
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
      // Use streaming endpoint
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let currentContent = '';
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Mark streaming as complete
              setConversations(prev => prev.map(c => 
                c.id === conversation.id 
                  ? { 
                      ...c, 
                      messages: c.messages.map(m => 
                        m.id === newAssistantMessageId 
                          ? { ...m, isStreaming: false }
                          : m
                      ),
                      lastUpdated: new Date() 
                    }
                  : c
              ));
              break;
            }

            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete JSON lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const jsonChunk = JSON.parse(line);
                  const { token, done, metadata } = jsonChunk;
                  
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
                                  isStreaming: !done 
                                }
                              : m
                          ),
                          lastUpdated: new Date() 
                        }
                      : c
                  ));

                  if (done) break;
                } catch (parseError) {
                  console.warn('Failed to parse JSON chunk:', line, parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
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

  const editMessage = (messageId: string) => {
    const conversation = currentConversation;
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || conversation.messages[messageIndex].role !== 'user') return;

    const messageToEdit = conversation.messages[messageIndex];
    
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

  const shareMessage = (messageId: string, content: string) => {
    console.log('Message shared:', { messageId, content });
    // Additional share tracking or analytics could go here
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          height: '100vh', 
          backgroundColor: currentTheme.palette.background.default,
          overflow: 'hidden',
          width: '100vw',
        }}
      >
        {/* Sidebar with smooth slide animation (300ms) */}
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          open={sidebarOpen}
          onToggle={toggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        
        {/* Main Content Area - Centered container max width 768px-1024px */}
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            minWidth: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <ChatArea 
            messages={currentConversation?.messages || []}
            isLoading={isLoading}
            onToggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onRefreshMessage={refreshMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onShareMessage={shareMessage}
          />
          
          {/* Sticky input at bottom of screen */}
          <InputArea
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            onStop={() => setIsLoading(false)}
            disabled={isLoading}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;

