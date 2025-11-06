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
export type ChatContentBlock = ChatHeadingBlock | ChatParagraphBlock | ChatCodeBlock | ChatListBlock | ChatQuoteBlock | ChatDividerBlock | ChatTableBlock | ChatReportBlock;
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
export declare const encodeBase64Text: (value: string) => string;
export declare const decodeBase64Text: (value: string) => string;
export declare const encodeBase64Json: (value: unknown) => string;
export declare const decodeBase64Json: <T>(value: string) => T;
export declare const parseMarkdownToBlocks: (markdown: string) => ChatContentBlock[];
export declare const buildParsedMessageContent: (content: string) => ParsedMessageContent;
export declare const createStreamingMarkupBuilder: () => StreamingMarkupBuilder;
//# sourceMappingURL=markup.d.ts.map