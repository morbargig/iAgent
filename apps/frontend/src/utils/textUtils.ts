/**
 * Extract plain text from markdown content
 * Removes markdown syntax while preserving readability
 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  return markdown
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, (match) => {
      // Extract just the code content, removing language specifier
      const lines = match.split('\n');
      lines.shift(); // Remove opening ```
      lines.pop();   // Remove closing ```
      return lines.join('\n');
    })
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold (**text** or __text__)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove headers (# ## ### etc)
    .replace(/^#{1,6}\s+(.*)$/gm, '$1')
    // Remove blockquotes (> text)
    .replace(/^>\s*(.*)$/gm, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules (--- or ***)
    .replace(/^[-*]{3,}$/gm, '')
    // Remove list markers (* - +)
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    // Remove numbered list markers (1. 2. etc)
    .replace(/^[\s]*\d+\.\s+/gm, '• ')
    // Remove task list markers (- [ ] - [x])
    .replace(/^[\s]*[-*+]\s*\[[x\s]\]\s*/gm, '• ')
    // Clean up table syntax
    .replace(/\|/g, ' ')
    .replace(/^[-:\s|]+$/gm, '') // Remove table separator lines
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .trim();
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
} 