const getGlobalScope = () => globalThis;
const encodeUtf8 = (value) => {
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
const decodeUtf8 = (binary) => {
    if (typeof TextDecoder !== 'undefined') {
        const decoder = new TextDecoder();
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return decoder.decode(bytes);
    }
    return decodeURIComponent(escape(binary));
};
const toBase64 = (value) => {
    const globalScope = getGlobalScope();
    if (globalScope.Buffer?.from) {
        return globalScope.Buffer.from(value, 'utf8').toString('base64');
    }
    if (typeof globalScope.btoa === 'function') {
        return globalScope.btoa(encodeUtf8(value));
    }
    throw new Error('Base64 encoding is not supported in this environment.');
};
const fromBase64 = (value) => {
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
export const encodeBase64Text = (value) => toBase64(value);
export const decodeBase64Text = (value) => fromBase64(value);
export const encodeBase64Json = (value) => toBase64(JSON.stringify(value));
export const decodeBase64Json = (value) => JSON.parse(fromBase64(value));
const HEADING_REGEX = /^(#{1,6})\s+(.*)$/;
const ORDERED_LIST_REGEX = /^\s*(\d+)\.\s+(.*)$/;
const UNORDERED_LIST_REGEX = /^\s*[-*+]\s+(.*)$/;
const DIVIDER_REGEX = /^\s*(-{3,}|_{3,}|\*{3,})\s*$/;
const TABLE_DIVIDER_REGEX = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/;
const TABLE_CAPTION_REGEX = /^(?:table|טבלה)\s*[:\-]\s*(.+)$/i;
const REPORT_BLOCK_REGEX = /^report\s*[:\-]\s*(\{[\s\S]*\})$/i;
const normalizeLineEndings = (markdown) => markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const extractHeading = (line) => {
    const match = line.match(HEADING_REGEX);
    if (!match) {
        return null;
    }
    return {
        level: match[1].length,
        text: match[2].trim(),
    };
};
const extractListItem = (line) => {
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
const isDividerLine = (line) => DIVIDER_REGEX.test(line.trim());
const isCodeFence = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('```')) {
        return null;
    }
    const language = trimmed.slice(3).trim();
    return { language: language || undefined };
};
const isQuoteLine = (line) => line.trim().startsWith('>');
const isParagraphBoundary = (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
        return true;
    }
    return (isDividerLine(trimmed) ||
        Boolean(extractHeading(trimmed)) ||
        Boolean(extractListItem(trimmed)) ||
        Boolean(isCodeFence(trimmed)) ||
        isQuoteLine(trimmed));
};
const trimTableEdges = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
const splitTableRow = (line) => {
    const cleaned = trimTableEdges(line.trim());
    return cleaned
        .split('|')
        .map((cell) => cell.replace(/\\\|/g, '|').trim());
};
const tryParseTable = (lines, startIndex) => {
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
    const rows = [];
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
export const parseMarkdownToBlocks = (markdown) => {
    const normalized = normalizeLineEndings(markdown);
    const lines = normalized.split('\n');
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();
        if (!trimmed) {
            index++;
            continue;
        }
        const tableCandidate = tryParseTable(lines, index);
        if (tableCandidate) {
            let presentation = 'inline';
            let caption;
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
            const codeLines = [];
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
            blocks.push({ type: 'heading', level: heading.level, text: heading.text });
            index++;
            continue;
        }
        if (isDividerLine(line)) {
            blocks.push({ type: 'divider' });
            index++;
            continue;
        }
        if (isQuoteLine(line)) {
            const quoteLines = [];
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
            const items = [listItem.text];
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
        const paragraphLines = [trimmed];
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
        const reportMatch = REPORT_BLOCK_REGEX.exec(paragraphText);
        if (reportMatch) {
            try {
                const reportData = JSON.parse(reportMatch[1]);
                const reportId = reportData.id ?? reportData.reportId ?? `report-${Date.now()}`;
                const title = reportData.title ?? `Report ${reportId}`;
                const { summary, metadata, ...rest } = reportData;
                blocks.push({
                    type: 'report',
                    reportId,
                    title,
                    summary: summary ?? reportData.description,
                    metadata: { ...rest, metadata },
                });
                continue;
            }
            catch (error) {
                // ignore malformed report payloads and treat as paragraph
            }
        }
        blocks.push({ type: 'paragraph', text: paragraphText });
    }
    return blocks;
};
const blocksToPlainText = (blocks) => {
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
            default:
                return '';
        }
    })
        .filter((value) => value.trim().length > 0)
        .join('\n')
        .trim();
};
const serializeAttributes = (attributes = {}) => Object.entries(attributes)
    .map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`)
    .join(' ');
const serializeCustomElement = (node) => {
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
const blocksToCustomElements = (blocks) => {
    return blocks.reduce((acc, block) => {
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
                }
                else {
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
export const buildParsedMessageContent = (content) => {
    const blocks = parseMarkdownToBlocks(content || '');
    const elements = blocksToCustomElements(blocks);
    return {
        blocks,
        plainText: blocksToPlainText(blocks),
        elements,
        customMarkup: elements.map(serializeCustomElement).join(''),
    };
};
export const createStreamingMarkupBuilder = () => {
    let currentContent = '';
    const clamp = () => buildParsedMessageContent(currentContent);
    return {
        append: (chunk) => {
            if (typeof chunk.cumulativeContent === 'string') {
                currentContent = chunk.cumulativeContent;
            }
            else if (typeof chunk.token === 'string') {
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
