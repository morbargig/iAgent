import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

@Injectable()
export class StreamingService {
  tokenizeResponse(text: string): string[] {
    const tokens: string[] = [];

    const parts = text.split(/(\s+|[\n\r]+|[.,!?;:]|```|`|\*\*|\*|##|#|\|)/);

    for (const part of parts) {
      if (!part) continue;
      
      if (part.match(/^\s+$/) || part.includes('\n') || part.includes('\r')) {
        tokens.push(part);
        continue;
      }
      
      if (part.trim()) {
        if (part.startsWith('```')) {
          tokens.push(part);
        } else if (part.match(/^\*\*.*\*\*$/)) {
          tokens.push(part);
        } else if (part.length > 12 && Math.random() > 0.8) {
          const chunks = Math.ceil(part.length / 8);
          for (let i = 0; i < chunks; i++) {
            const start = i * 8;
            const end = Math.min(start + 8, part.length);
            tokens.push(part.slice(start, end));
          }
        } else {
          tokens.push(part);
        }
      }
    }

    return tokens.filter(token => token.length > 0);
  }

  calculateStreamingDelay(token: string, index: number, allTokens: string[]): number {
    const baseDelay = 15;
    const randomFactor = Math.random() * 25;

    let delay = baseDelay + randomFactor;

    if (/[.!?]$/.test(token)) {
      delay += 200 + Math.random() * 300;
    } else if (/[,;:]$/.test(token)) {
      delay += 80 + Math.random() * 120;
    } else if (token.includes('\n\n')) {
      delay += 300 + Math.random() * 400;
    } else if (token.includes('\n')) {
      delay += 150 + Math.random() * 200;
    } else if (token.startsWith('```')) {
      delay += 400 + Math.random() * 600;
    } else if (token.startsWith('#')) {
      delay += 200 + Math.random() * 300;
    } else if (token.includes('**')) {
      delay += 50 + Math.random() * 100;
    } else if (token.includes('`')) {
      delay += 30 + Math.random() * 70;
    } else if (token.length > 8) {
      delay += token.length * 3;
    } else if (/^\d+\./.test(token)) {
      delay += 100 + Math.random() * 150;
    }

    const progressRatio = index / allTokens.length;

    if (progressRatio < 0.1) {
      delay *= 1.5;
    } else if (progressRatio < 0.3) {
      delay *= 1.2;
    } else if (progressRatio > 0.8) {
      delay *= 1.1;
    }

    if (Math.random() < 0.1) {
      delay *= 0.5;
    } else if (Math.random() < 0.05) {
      delay *= 2;
    }

    return Math.round(Math.max(10, delay));
  }

  getTokenType(token: string): string {
    if (token.startsWith('```')) return 'code_block';
    if (token.startsWith('**') && token.endsWith('**')) return 'bold';
    if (token.startsWith('#')) return 'header';
    if (token.match(/^[-*+]\s/)) return 'list_item';
    if (token.match(/[.!?]+$/)) return 'sentence_end';
    if (token.match(/[,;:]+$/)) return 'punctuation';
    if (token.match(/^\n+$/)) return 'line_break';
    if (token.trim().length === 0) return 'whitespace';
    if (token.match(/^\d+$/)) return 'number';
    if (token.match(/^[A-Z][a-z]+$/)) return 'capitalized_word';
    return 'word';
  }

  detectContentType(token: string, accumulatedContent: string): 'table' | 'citation' | 'report' | 'markdown' {
    const lowerContent = accumulatedContent.toLowerCase();
    
    if (lowerContent.includes('report:') || lowerContent.includes('"reportid"')) {
      return 'report';
    }
    
    if (lowerContent.includes('table:') || (lowerContent.includes('|') && lowerContent.includes('---'))) {
      return 'table';
    }
    
    if (lowerContent.includes('>') && lowerContent.split('>').length > 2) {
      return 'citation';
    }
    
    return 'markdown';
  }

  categorizeContent(content: string): string[] {
    const categories: string[] = [];
    const lower = content.toLowerCase();

    if (lower.match(/\b(code|function|class|typescript|javascript|programming)\b/)) {
      categories.push('programming', 'technical');
    }
    if (lower.match(/\b(help|how|what|explain|tutorial)\b/)) {
      categories.push('educational', 'assistance');
    }
    if (lower.match(/\b(hello|hi|hey|thanks|please)\b/)) {
      categories.push('conversational', 'social');
    }
    if (lower.match(/\b(math|calculate|equation|formula)\b/)) {
      categories.push('mathematical', 'analytical');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  getResponseType(userContent: string): string {
    const content = userContent.toLowerCase();

    if (content.includes('code') || content.includes('function') || content.includes('programming')) {
      return 'code_explanation';
    }
    if (content.includes('explain') || content.includes('what is') || content.includes('how does')) {
      return 'explanation';
    }
    if (content.includes('write') || content.includes('create') || content.includes('story')) {
      return 'creative';
    }
    if (content.includes('help') || content.includes('problem') || content.includes('issue')) {
      return 'assistance';
    }
    if (content.includes('?')) {
      return 'question_answer';
    }

    return 'general_conversation';
  }

  countTokens(messages: ChatMessage[]): number {
    return messages.reduce((total, msg) =>
      total + msg.content.split(/\s+/).length, 0
    );
  }
}

