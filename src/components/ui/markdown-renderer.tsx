import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple Markdown renderer that converts common markdown syntax to HTML
 * Supports: headers (##), bold (**), italic (*), lists (- *), horizontal rules (---)
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const renderInline = (text: string): React.ReactNode => {
    // Simple inline processing - returns array of strings and elements
    const elements: React.ReactNode[] = [];
    let currentText = text;
    
    // Process bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    const tempElements: React.ReactNode[] = [];
    
    while ((match = boldRegex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        tempElements.push(currentText.slice(lastIndex, match.index));
      }
      tempElements.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-foreground">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < currentText.length) {
      tempElements.push(currentText.slice(lastIndex));
    }
    
    if (tempElements.length === 0) {
      tempElements.push(currentText);
    }
    
    // Process placeholders: [text] or {{text}}
    tempElements.forEach((part, partIdx) => {
      if (typeof part !== 'string') {
        elements.push(part);
        return;
      }
      
      const placeholderRegex = /(\[.+?\]|\{\{.+?\}\})/g;
      let pLastIndex = 0;
      let pMatch;
      
      while ((pMatch = placeholderRegex.exec(part)) !== null) {
        if (pMatch.index > pLastIndex) {
          elements.push(part.slice(pLastIndex, pMatch.index));
        }
        const content = pMatch[1].replace(/^\[|\]$|\{\{|\}\}/g, '');
        elements.push(
          <span 
            key={`placeholder-${partIdx}-${pMatch.index}`} 
            className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium"
          >
            {content}
          </span>
        );
        pLastIndex = pMatch.index + pMatch[0].length;
      }
      
      if (pLastIndex < part.length) {
        elements.push(part.slice(pLastIndex));
      } else if (pLastIndex === 0) {
        elements.push(part);
      }
    });
    
    return <>{elements}</>;
  };

  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3 pl-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines (but flush lists first)
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Horizontal rule
      if (/^-{3,}$/.test(trimmedLine) || /^={3,}$/.test(trimmedLine)) {
        flushList();
        elements.push(<hr key={`hr-${index}`} className="my-4 border-border" />);
        return;
      }

      // Headers
      if (trimmedLine.startsWith('#')) {
        flushList();
        const headerMatch = trimmedLine.match(/^(#{1,6})\s*(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const headerText = headerMatch[2];
          const headerClass = {
            1: 'text-2xl font-bold text-primary mb-4 mt-6',
            2: 'text-xl font-bold text-primary mb-3 mt-5',
            3: 'text-lg font-semibold text-foreground mb-2 mt-4',
            4: 'text-base font-semibold text-foreground mb-2 mt-3',
            5: 'text-sm font-semibold text-foreground mb-1 mt-2',
            6: 'text-sm font-medium text-muted-foreground mb-1 mt-2',
          }[level] || 'text-base font-semibold mb-2';
          
          if (level === 1) {
            elements.push(<h1 key={`h1-${index}`} className={headerClass}>{renderInline(headerText)}</h1>);
          } else if (level === 2) {
            elements.push(<h2 key={`h2-${index}`} className={headerClass}>{renderInline(headerText)}</h2>);
          } else if (level === 3) {
            elements.push(<h3 key={`h3-${index}`} className={headerClass}>{renderInline(headerText)}</h3>);
          } else if (level === 4) {
            elements.push(<h4 key={`h4-${index}`} className={headerClass}>{renderInline(headerText)}</h4>);
          } else if (level === 5) {
            elements.push(<h5 key={`h5-${index}`} className={headerClass}>{renderInline(headerText)}</h5>);
          } else {
            elements.push(<h6 key={`h6-${index}`} className={headerClass}>{renderInline(headerText)}</h6>);
          }
          return;
        }
      }

      // List items (- or * or ☐ or •)
      const listMatch = trimmedLine.match(/^[-*☐•]\s+(.+)$/);
      if (listMatch) {
        inList = true;
        listItems.push(listMatch[1]);
        return;
      }

      // Numbered list items
      const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        flushList();
        elements.push(
          <div key={`num-${index}`} className="flex gap-2 my-1 pl-4">
            <span className="text-primary font-semibold">{trimmedLine.split('.')[0]}.</span>
            <span className="text-sm leading-relaxed">{renderInline(numberedMatch[1])}</span>
          </div>
        );
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} className="text-sm leading-relaxed my-2">
          {renderInline(line)}
        </p>
      );
    });

    // Flush any remaining list
    flushList();

    return elements;
  };

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {renderMarkdown(content)}
    </div>
  );
}

/**
 * Convert markdown text to plain text (for PDF generation)
 * Removes markdown syntax while preserving structure
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove headers markup but keep text
    .replace(/^#{1,6}\s+/gm, '')
    // Convert bold to plain text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Convert italic to plain text  
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Convert list markers to bullet
    .replace(/^[-*☐]\s+/gm, '• ')
    // Keep horizontal rules as dashes
    .replace(/^-{3,}$/gm, '─'.repeat(40))
    .replace(/^={3,}$/gm, '═'.repeat(40))
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert markdown to structured lines for PDF with styling info
 */
export interface StyledLine {
  text: string;
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'list-item' | 'numbered' | 'hr' | 'empty';
  bold?: boolean;
}

export function markdownToStyledLines(markdown: string): StyledLine[] {
  const lines = markdown.split('\n');
  const result: StyledLine[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      result.push({ text: '', type: 'empty' });
      return;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^={3,}$/.test(trimmed)) {
      result.push({ text: '─'.repeat(60), type: 'hr' });
      return;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s*(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].replace(/\*\*/g, ''); // Remove bold from headers
      const type = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
      result.push({ text, type: type as StyledLine['type'], bold: true });
      return;
    }

    // List items
    const listMatch = trimmed.match(/^[-*☐•]\s+(.+)$/);
    if (listMatch) {
      result.push({ text: `• ${listMatch[1].replace(/\*\*/g, '')}`, type: 'list-item' });
      return;
    }

    // Numbered items
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      result.push({ text: `${numMatch[1]}. ${numMatch[2].replace(/\*\*/g, '')}`, type: 'numbered' });
      return;
    }

    // Regular paragraph - check if bold
    const isBold = trimmed.startsWith('**') && trimmed.endsWith('**');
    const text = trimmed.replace(/\*\*/g, '');
    result.push({ text, type: 'paragraph', bold: isBold });
  });

  return result;
}
