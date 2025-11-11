export const keys = {
  auth: {
    all: ['auth'] as const,
    login: () => ['auth', 'login'] as const,
  },
  documents: {
    all: ['documents'] as const,
    lists: () => ['documents', 'list'] as const,
    list: (page = 1, limit = 10, filters?: { query?: string; type?: string; status?: string[] }) =>
      ['documents', 'list', { page, limit, filters }] as const,
    detail: (id: string | number) => ['documents', 'detail', { id }] as const,
    count: (filters?: { query?: string }) => ['documents', 'count', { filters }] as const,
    stats: () => ['documents', 'stats'] as const,
  },
  chats: {
    all: ['chats'] as const,
    lists: () => ['chats', 'list'] as const,
    list: () => ['chats', 'list'] as const,
    detail: (id: string | number) => ['chats', 'detail', { id }] as const,
    messages: (chatId: string | number) => ['chats', 'messages', { chatId }] as const,
  },
  filters: {
    all: ['filters'] as const,
    lists: () => ['filters', 'list'] as const,
    list: (chatId: string | number) => ['filters', 'list', { chatId }] as const,
    detail: (id: string | number) => ['filters', 'detail', { id }] as const,
    active: (chatId: string | number) => ['filters', 'active', { chatId }] as const,
  },
  tools: {
    all: ['tools'] as const,
    pages: () => ['tools', 'pages'] as const,
  },
};

