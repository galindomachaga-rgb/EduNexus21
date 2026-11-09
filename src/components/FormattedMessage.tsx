import React from 'react';

interface FormattedMessageProps {
  text: string;
  className?: string;
}

/**
 * Renders markdown-like AI responses (code blocks, inline code, bold text, bullet points)
 * cleanly without using dangerouslySetInnerHTML.
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const blocks = text.split(/(```[\s\S]*?```)/g);

  const renderInline = (line: string, keyPrefix: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-${idx}`} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={`${keyPrefix}-${idx}`}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={`${keyPrefix}-${idx}`}>{part}</React.Fragment>;
    });
  };

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const rawCode = block.slice(3, -3).replace(/^[a-zA-Z0-9_-]+\n/, '');
          return (
            <pre
              key={`code-${bIdx}`}
              className="my-2 p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800"
            >
              {rawCode.trim()}
            </pre>
          );
        }
        const lines = block.split('\n');
        return (
          <div key={`txt-${bIdx}`} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={`br-${lIdx}`} className="h-1" />;
              return (
                <p key={`ln-${lIdx}`}>
                  {renderInline(line, `${bIdx}-${lIdx}`)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
