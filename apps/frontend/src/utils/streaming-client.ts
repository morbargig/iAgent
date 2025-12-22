import type {
  StreamingTokenMetadata,
  StreamingCompletionPayload,
  ParsedMessageContent,
} from '@iagent/shared-renderer';
import {
  createStreamingMarkupBuilder,
} from '@iagent/shared-renderer';
import type { Message } from '@iagent/chat-types';

export class StreamingClient {
  private abortController: AbortController | null = null;

  async streamChat(
    messages: Message[],
    onToken: (token: string, metadata?: StreamingTokenMetadata) => void,
    onComplete: (result: StreamingCompletionPayload) => void,
    onError: (error: Error) => void,
    baseUrl = 'http://localhost:3030',
    authToken?: string,
    chatId?: string,
    tools?: unknown[],
    dateFilter?: unknown,
    selectedCountries?: string[]
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      const requestChatId = chatId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const requestBody = {
        chatId: requestChatId,
        auth: {
          token: authToken || '',
          userId: 'user_123456789'
        },
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString(),
          filterId: msg.filterId,
          filterVersion: msg.filterVersion
        })),
        tools: tools || [],
        dateFilter: dateFilter || null,
        selectedCountries: selectedCountries || [],
        requestTimestamp: new Date().toISOString(),
        clientInfo: {
          userAgent: (globalThis as { navigator?: { userAgent?: string } })?.navigator?.userAgent || 'Unknown',
          timestamp: Date.now()
        }
      };

      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = '';
        const markupBuilder = createStreamingMarkupBuilder();
        let latestParsed = markupBuilder.getCurrent();
        let completionMetadata: Record<string, unknown> | undefined;
        let currentSection: 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer' | undefined;
        let sections: Record<string, { content: string; parsed: ParsedMessageContent }> = {};
        const sectionBuilders: Record<string, ReturnType<typeof createStreamingMarkupBuilder>> = {};
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              const finalSections: Record<string, { content: string; parsed: ParsedMessageContent }> = {};
              
              Object.entries(sectionBuilders).forEach(([sectionKey, builder]) => {
                const sectionParsed = builder.getCurrent();
                finalSections[sectionKey] = {
                  content: sectionParsed.plainText || '',
                  parsed: sectionParsed,
                };
              });
              
              Object.assign(sections, finalSections);
              
              onComplete({
                content: latestParsed.plainText || '',
                parsed: latestParsed,
                metadata: {
                  ...completionMetadata,
                  sections,
                  currentSection,
                },
                sessionId: completionMetadata?.sessionId as string | undefined,
              });
              this.abortController = null;
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const structuredChunk = JSON.parse(line);
                  
                  switch (structuredChunk.chunkType) {
                    case 'start':
                      markupBuilder.reset();
                      latestParsed = markupBuilder.getCurrent();
                      currentSection = undefined;
                      sections = {};
                      Object.keys(sectionBuilders).forEach(key => delete sectionBuilders[key]);
                      console.log('🚀 Stream started:', structuredChunk.data);
                      break;
                      
                    case 'metadata':
                      console.log('📊 Metadata:', structuredChunk.data);
                      break;
                      
                    case 'section':
                      const sectionData = structuredChunk.data;
                      const sectionName = sectionData.section as 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer';
                      
                      if (sectionData.action === 'start') {
                        currentSection = sectionName;
                        if (!sectionBuilders[sectionName]) {
                          sectionBuilders[sectionName] = createStreamingMarkupBuilder();
                        }
                        console.log(`📦 Section start:`, sectionName);
                      } else if (sectionData.action === 'end') {
                        if (sectionBuilders[sectionName]) {
                          const sectionParsed = sectionBuilders[sectionName].getCurrent();
                          sections[sectionName] = {
                            content: sectionParsed.plainText || '',
                            parsed: sectionParsed,
                          };
                        }
                        console.log(`📦 Section end:`, sectionName);
                        currentSection = undefined;
                      }
                      break;
                      
                    case 'token':
                      const tokenSection = structuredChunk.data.section as 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer' | undefined;
                      const tokenContentType = structuredChunk.data.contentType;
                      
                      latestParsed = markupBuilder.append({
                        token: structuredChunk.data.token,
                        cumulativeContent: structuredChunk.data.cumulativeContent,
                      });

                      if (tokenSection && sectionBuilders[tokenSection]) {
                        const sectionBuilder = sectionBuilders[tokenSection];
                        sectionBuilder.append({
                          token: structuredChunk.data.token,
                        });
                        
                        const sectionParsed = sectionBuilder.getCurrent();
                        sections[tokenSection] = {
                          content: sectionParsed.plainText || '',
                          parsed: sectionParsed,
                        };
                      }

                      onToken(structuredChunk.data.token, {
                        ...structuredChunk.data,
                        timestamp: structuredChunk.timestamp,
                        sessionId: structuredChunk.sessionId,
                        parsed: latestParsed,
                        section: tokenSection,
                        contentType: tokenContentType,
                        sectionContent: tokenSection && sectionBuilders[tokenSection] 
                          ? sectionBuilders[tokenSection].getCurrent().plainText 
                          : undefined,
                        sections: tokenSection ? { ...sections } : undefined,
                      });
                      break;
                      
                    case 'progress':
                      console.log('⏳ Progress:', structuredChunk.data.progress + '%');
                      break;
                      
                    case 'complete':
                      console.log('✅ Stream completed:', structuredChunk.data);
                      
                      Object.entries(sectionBuilders).forEach(([sectionKey, builder]) => {
                        const sectionParsed = builder.getCurrent();
                        sections[sectionKey] = {
                          content: sectionParsed.plainText || '',
                          parsed: sectionParsed,
                        };
                      });
                      
                      completionMetadata = {
                        ...structuredChunk.data,
                        timestamp: structuredChunk.timestamp,
                        sessionId: structuredChunk.sessionId,
                        sections,
                        currentSection,
                      };
                      if (typeof structuredChunk.data.finalContent === 'string') {
                        latestParsed = markupBuilder.append({
                          cumulativeContent: structuredChunk.data.finalContent,
                        });
                      }
                      break;
                      
                    case 'error':
                      throw new Error(structuredChunk.data.error.message || 'Unknown streaming error');
                      
                    default:
                      console.warn('Unknown chunk type:', structuredChunk.chunkType);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          // Memory cleanup: clear all buffers and builders to prevent memory leaks
          buffer = '';
          Object.keys(sectionBuilders).forEach(key => delete sectionBuilders[key]);
          sections = {};
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('API stream was aborted');
      } else {
        onError(error instanceof Error ? error : new Error('Unknown API streaming error'));
      }
      this.abortController = null;
    }
  }
  
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  isStreaming(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }
}

