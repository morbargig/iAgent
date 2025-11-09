export type TablePresentation = 'inline' | 'citation';

export interface ChatHeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ChatParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface ChatCodeBlock {
  type: 'code';
  code: string;
  language?: string;
}

export interface ChatListBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface ChatQuoteBlock {
  type: 'quote';
  text: string;
}

export interface ChatDividerBlock {
  type: 'divider';
}

export interface ChatTableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
  presentation: TablePresentation;
  caption?: string;
}

export interface ChatReportBlock {
  type: 'report';
  reportId: string;
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatTableCitationBlock {
  type: 'table-citation';
  citationId: string;
  tableData: {
    headers: string[];
    rows: string[][];
  };
  caption?: string;
}

export type ChatContentBlock =
  | ChatHeadingBlock
  | ChatParagraphBlock
  | ChatCodeBlock
  | ChatListBlock
  | ChatQuoteBlock
  | ChatDividerBlock
  | ChatTableBlock
  | ChatReportBlock
  | ChatTableCitationBlock;

export type CustomElementChild = CustomElementNode | string;

export interface CustomElementNode {
  tag: string;
  attributes?: Record<string, string>;
  children?: CustomElementChild[];
}

export interface ParsedMessageContent {
  blocks: ChatContentBlock[];
  plainText: string;
  elements: CustomElementNode[];
  customMarkup: string;
}

export interface StreamingChunk {
  token?: string;
  cumulativeContent?: string;
}

export interface StreamingMarkupBuilder {
  append: (chunk: StreamingChunk) => ParsedMessageContent;
  reset: () => void;
  getCurrent: () => ParsedMessageContent;
}

export interface StreamingTokenMetadata extends Record<string, unknown> {
  parsed: ParsedMessageContent;
  index?: number;
  totalTokens?: number;
  progress?: number;
  cumulativeContent?: string;
  tokenType?: string;
  confidence?: number;
  isLastToken?: boolean;
  timestamp?: string;
  sessionId?: string;
}

export interface StreamingCompletionPayload {
  content: string;
  parsed: ParsedMessageContent;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

const getGlobalScope = (): typeof globalThis & {
  btoa?: (data: string) => string;
  atob?: (data: string) => string;
  Buffer?: { from: (input: string, encoding?: string) => { toString: (encoding?: string) => string } };
} => globalThis as typeof globalThis & {
  btoa?: (data: string) => string;
  atob?: (data: string) => string;
  Buffer?: { from: (input: string, encoding?: string) => { toString: (encoding?: string) => string } };
};

const encodeUtf8 = (value: string): string => {
  if (typeof TextEncoder !== 'undefined') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return binary;
  }
  return unescape(encodeURIComponent(value));
};

const decodeUtf8 = (binary: string): string => {
  if (typeof TextDecoder !== 'undefined') {
    const decoder = new TextDecoder();
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return decoder.decode(bytes);
  }
  return decodeURIComponent(escape(binary));
};

const toBase64 = (value: string): string => {
  const globalScope = getGlobalScope();

  if (globalScope.Buffer?.from) {
    return globalScope.Buffer.from(value, 'utf8').toString('base64');
  }

  if (typeof globalScope.btoa === 'function') {
    return globalScope.btoa(encodeUtf8(value));
  }

  throw new Error('Base64 encoding is not supported in this environment.');
};

const fromBase64 = (value: string): string => {
  const globalScope = getGlobalScope();

  if (globalScope.Buffer?.from) {
    return globalScope.Buffer.from(value, 'base64').toString('utf8');
  }

  if (typeof globalScope.atob === 'function') {
    const binary = globalScope.atob(value);
    return decodeUtf8(binary);
  }

  throw new Error('Base64 decoding is not supported in this environment.');
};

export const encodeBase64Text = (value: string): string => toBase64(value);
export const decodeBase64Text = (value: string): string => fromBase64(value);
export const encodeBase64Json = (value: unknown): string => toBase64(JSON.stringify(value));
export const decodeBase64Json = <T>(value: string): T => JSON.parse(fromBase64(value)) as T;

const HEADING_REGEX = /^(#{1,6})\s+(.*)$/;
const ORDERED_LIST_REGEX = /^\s*(\d+)\.\s+(.*)$/;
const UNORDERED_LIST_REGEX = /^\s*[-*+]\s+(.*)$/;
const DIVIDER_REGEX = /^\s*(-{3,}|_{3,}|\*{3,})\s*$/;
const TABLE_DIVIDER_REGEX = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/;
const TABLE_CAPTION_REGEX = /^(?:table|טבלה)\s*[:\-]\s*(.+)$/i;
const TABLE_CITATION_REGEX = /\[table-(\d+)\]/gi;
const TABLE_CITATION_DEFINITION_REGEX = /^table-citation:\s*(\w+)/i;

const normalizeLineEndings = (markdown: string): string => markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const extractHeading = (line: string): { level: number; text: string } | null => {
  const match = line.match(HEADING_REGEX);
  if (!match) {
    return null;
  }
  return {
    level: match[1].length,
    text: match[2].trim(),
  };
};

const extractListItem = (
  line: string,
): { ordered: boolean; text: string } | null => {
  const orderedMatch = line.match(ORDERED_LIST_REGEX);
  if (orderedMatch) {
    return { ordered: true, text: orderedMatch[2].trim() };
  }
  const unorderedMatch = line.match(UNORDERED_LIST_REGEX);
  if (unorderedMatch) {
    return { ordered: false, text: unorderedMatch[1].trim() };
  }
  return null;
};

const isDividerLine = (line: string): boolean => DIVIDER_REGEX.test(line.trim());

const isCodeFence = (line: string): { language?: string } | null => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('```')) {
    return null;
  }
  const language = trimmed.slice(3).trim();
  return { language: language || undefined };
};

const isQuoteLine = (line: string): boolean => line.trim().startsWith('>');

const isParagraphBoundary = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  return (
    isDividerLine(trimmed) ||
    Boolean(extractHeading(trimmed)) ||
    Boolean(extractListItem(trimmed)) ||
    Boolean(isCodeFence(trimmed)) ||
    isQuoteLine(trimmed)
  );
};

const trimTableEdges = (line: string): string => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');

const splitTableRow = (line: string): string[] => {
  const cleaned = trimTableEdges(line.trim());
  return cleaned
    .split('|')
    .map((cell) => cell.replace(/\\\|/g, '|').trim());
};

interface ParsedTableResult {
  headers: string[];
  rows: string[][];
  nextIndex: number;
}

const tryParseTable = (lines: string[], startIndex: number): ParsedTableResult | null => {
  if (startIndex + 1 >= lines.length) {
    return null;
  }

  const headerLine = lines[startIndex];
  const dividerLine = lines[startIndex + 1];

  if (!headerLine.includes('|') || !TABLE_DIVIDER_REGEX.test(dividerLine)) {
    return null;
  }

  const headers = splitTableRow(headerLine);
  let nextIndex = startIndex + 2;
  const rows: string[][] = [];

  while (nextIndex < lines.length) {
    const candidate = lines[nextIndex];
    if (!candidate.trim() || !candidate.includes('|')) {
      break;
    }
    const cells = splitTableRow(candidate);
    rows.push(cells);
    nextIndex++;
  }

  if (headers.length === 0 || rows.length === 0) {
    return null;
  }

  return {
    headers,
    rows,
    nextIndex,
  };
};

export const parseMarkdownToBlocks = (markdown: string): ChatContentBlock[] => {
  const normalized = normalizeLineEndings(markdown);
  const lines = normalized.split('\n');
  const blocks: ChatContentBlock[] = [];
  const tableCitations: Map<string, { headers: string[]; rows: string[][]; caption?: string }> = new Map();

  let index = 0;

  // First pass: collect table citation definitions
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    
    const citationDefMatch = TABLE_CITATION_DEFINITION_REGEX.exec(trimmed);
    if (citationDefMatch) {
      const citationId = citationDefMatch[1];
      index++; // Move past definition line
      
      // Try to parse table starting from next line
      const tableCandidate = tryParseTable(lines, index);
      if (tableCandidate) {
        let caption: string | undefined;
        const previousLine = index > 0 ? lines[index - 1] : '';
        const captionMatch = TABLE_CAPTION_REGEX.exec(previousLine);
        if (captionMatch) {
          caption = captionMatch[1].trim();
        }
        
        tableCitations.set(citationId, {
          headers: tableCandidate.headers,
          rows: tableCandidate.rows,
          caption,
        });
        index = tableCandidate.nextIndex;
        continue;
      }
    }
    
    index++;
  }

  // Reset index for second pass
  index = 0;

  // Second pass: parse blocks and handle citation links
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index++;
      continue;
    }

    // Skip citation definitions (already processed)
    if (TABLE_CITATION_DEFINITION_REGEX.test(trimmed)) {
      index++;
      // Skip the table that follows
      const tableCandidate = tryParseTable(lines, index);
      if (tableCandidate) {
        index = tableCandidate.nextIndex;
      }
      continue;
    }

    const tableCandidate = tryParseTable(lines, index);
    if (tableCandidate) {
      let presentation: TablePresentation = 'inline';
      let caption: string | undefined;

      const previousBlock = blocks[blocks.length - 1];
      if (previousBlock && previousBlock.type === 'paragraph') {
        const match = TABLE_CAPTION_REGEX.exec(previousBlock.text);
        if (match) {
          presentation = 'citation';
          caption = match[1].trim();
          blocks.pop();
        }
      }

      blocks.push({
        type: 'table',
        headers: tableCandidate.headers,
        rows: tableCandidate.rows,
        presentation,
        caption,
      });
      index = tableCandidate.nextIndex;
      continue;
    }

    const codeFence = isCodeFence(line);
    if (codeFence) {
      index++;
      const codeLines: string[] = [];

      while (index < lines.length) {
        const next = lines[index];
        if (isCodeFence(next)) {
          index++;
          break;
        }
        codeLines.push(next);
        index++;
      }

      blocks.push({
        type: 'code',
        code: codeLines.join('\n'),
        language: codeFence.language,
      });
      continue;
    }

    const heading = extractHeading(line);
    if (heading) {
      blocks.push({ type: 'heading', level: heading.level as 1 | 2 | 3 | 4 | 5 | 6, text: heading.text });
      index++;
      continue;
    }

    if (isDividerLine(line)) {
      blocks.push({ type: 'divider' });
      index++;
      continue;
    }

    if (isQuoteLine(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && isQuoteLine(lines[index])) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index++;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    const listItem = extractListItem(line);
    if (listItem) {
      const ordered = listItem.ordered;
      const items: string[] = [listItem.text];
      index++;

      while (index < lines.length) {
        const potential = extractListItem(lines[index]);
        if (!potential || potential.ordered !== ordered) {
          break;
        }
        items.push(potential.text);
        index++;
      }

      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index++;

    while (index < lines.length && !isParagraphBoundary(lines[index])) {
      const nextLine = lines[index].trim();
      if (!nextLine) {
        index++;
        break;
      }
      paragraphLines.push(nextLine);
      index++;
    }

    const paragraphText = paragraphLines.join(' ');
    const REPORT_BLOCK_REGEX = /^report\s*[:\-]\s*(\{[\s\S]*\})$/i;
    const reportMatch = REPORT_BLOCK_REGEX.exec(paragraphText);
    if (reportMatch) {
      try {
        const reportData = JSON.parse(reportMatch[1]);
        const reportId: string = reportData.id ?? reportData.reportId ?? `report-${Date.now()}`;
        const title: string = reportData.title ?? `Report ${reportId}`;
        const { summary, metadata, ...rest } = reportData;

        blocks.push({
          type: 'report',
          reportId,
          title,
          summary: summary ?? reportData.description,
          metadata: { ...rest, metadata },
        });
        continue;
      } catch (error) {
        // ignore malformed report payloads and treat as paragraph
      }
    }

    // Check for table citation links in paragraph
    const citationMatches = Array.from(paragraphText.matchAll(TABLE_CITATION_REGEX));
    if (citationMatches.length > 0 && tableCitations.size > 0) {
      // Split paragraph by citations and create blocks
      let lastIndex = 0;
      const parts: Array<{ type: 'text' | 'citation'; content: string; citationId?: string }> = [];
      
      for (const match of citationMatches) {
        if (match.index !== undefined) {
          // Add text before citation
          if (match.index > lastIndex) {
            const textBefore = paragraphText.slice(lastIndex, match.index);
            if (textBefore.trim()) {
              parts.push({ type: 'text', content: textBefore });
            }
          }
          
          // Add citation
          const citationId = match[1];
          if (tableCitations.has(citationId)) {
            parts.push({ type: 'citation', content: match[0], citationId });
          } else {
            // Citation not found, keep as text
            parts.push({ type: 'text', content: match[0] });
          }
          
          lastIndex = match.index + match[0].length;
        }
      }
      
      // Add remaining text
      if (lastIndex < paragraphText.length) {
        const textAfter = paragraphText.slice(lastIndex);
        if (textAfter.trim()) {
          parts.push({ type: 'text', content: textAfter });
        }
      }
      
      // Create blocks from parts
      for (const part of parts) {
        if (part.type === 'citation' && part.citationId) {
          const citationData = tableCitations.get(part.citationId);
          if (citationData) {
            blocks.push({
              type: 'table-citation',
              citationId: part.citationId,
              tableData: {
                headers: citationData.headers,
                rows: citationData.rows,
              },
              caption: citationData.caption,
            });
          }
        } else if (part.content.trim()) {
          blocks.push({ type: 'paragraph', text: part.content });
        }
      }
      continue;
    }

    blocks.push({ type: 'paragraph', text: paragraphText });
  }

  return blocks;
};

const blocksToPlainText = (blocks: ChatContentBlock[]): string => {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return block.text;
        case 'heading':
          return block.text;
        case 'code':
          return block.code;
        case 'list':
          return block.items.map((item) => `- ${item}`).join('\n');
        case 'quote':
          return block.text;
        case 'divider':
          return '';
        case 'table':
          return `${block.caption ? `${block.caption}\n` : ''}${block.headers.join(' | ')}\n${block.rows
            .map((row) => row.join(' | '))
            .join('\n')}`;
        case 'report':
          return `${block.title}${block.summary ? ` - ${block.summary}` : ''}`;
        case 'table-citation':
          return `[table-${block.citationId}]`;
        default:
          return '';
      }
    })
    .filter((value) => value.trim().length > 0)
    .join('\n')
    .trim();
};

const serializeAttributes = (attributes: Record<string, string> = {}): string =>
  Object.entries(attributes)
    .map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`)
    .join(' ');

const serializeCustomElement = (node: CustomElementNode): string => {
  const attrs = serializeAttributes(node.attributes);
  const openTag = attrs.length > 0 ? `<${node.tag} ${attrs}>` : `<${node.tag}>`;

  if (!node.children || node.children.length === 0) {
    return `${openTag}</${node.tag}>`;
  }

  const childMarkup = node.children
    .map((child) => (typeof child === 'string' ? child : serializeCustomElement(child)))
    .join('');

  return `${openTag}${childMarkup}</${node.tag}>`;
};

const blocksToCustomElements = (blocks: ChatContentBlock[]): CustomElementNode[] => {
  return blocks.reduce<CustomElementNode[]>((acc, block) => {
    switch (block.type) {
      case 'quote': {
        acc.push({
          tag: 'app-catation',
          attributes: {
            text: encodeBase64Text(block.text),
          },
        });
        break;
      }
      case 'table': {
        const tablePayload = {
          headers: block.headers,
          rows: block.rows,
        };

        if (block.presentation === 'citation') {
          acc.push({
            tag: 'app-table-catation',
            attributes: {
              data: encodeBase64Json(tablePayload),
              ...(block.caption ? { name: encodeBase64Text(block.caption) } : {}),
            },
          });
        } else {
          acc.push({
            tag: 'app-inline-table',
            attributes: {
              data: encodeBase64Json(tablePayload),
              ...(block.caption ? { caption: encodeBase64Text(block.caption) } : {}),
            },
          });
        }
        break;
      }
      case 'table-citation': {
        acc.push({
          tag: 'app-table-citation',
          attributes: {
            citationId: block.citationId,
            data: encodeBase64Json(block.tableData),
            ...(block.caption ? { caption: encodeBase64Text(block.caption) } : {}),
          },
        });
        break;
      }
      case 'report': {
        const { reportId, title, summary, metadata } = block;
        acc.push({
          tag: 'app-report',
          attributes: {
            data: encodeBase64Json({
              reportId,
              title,
              summary,
              metadata,
            }),
          },
        });
        break;
      }
      default:
        break;
    }
    return acc;
  }, []);
};

export const buildParsedMessageContent = (content: string): ParsedMessageContent => {
  const blocks = parseMarkdownToBlocks(content || '');
  const elements = blocksToCustomElements(blocks);
  return {
    blocks,
    plainText: blocksToPlainText(blocks),
    elements,
    customMarkup: elements.map(serializeCustomElement).join(''),
  };
};

export const createStreamingMarkupBuilder = (): StreamingMarkupBuilder => {
  let currentContent = '';

  const clamp = (): ParsedMessageContent => buildParsedMessageContent(currentContent);

  return {
    append: (chunk: StreamingChunk) => {
      if (typeof chunk.cumulativeContent === 'string') {
        currentContent = chunk.cumulativeContent;
      } else if (typeof chunk.token === 'string') {
        currentContent += chunk.token;
      }
      return clamp();
    },
    reset: () => {
      currentContent = '';
    },
    getCurrent: () => clamp(),
  };
};

