import ReactMarkdown from 'react-markdown'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`text-sm text-(--text-primary) ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-(--text-primary)">{children}</p>,
          h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2 font-gaming">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mt-2 mb-1 font-gaming">{children}</h2>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-(--accent-cyan) hover:underline">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-(--text-primary)">{children}</strong>,
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded bg-(--bg-dark) text-(--accent-cyan) font-mono text-sm">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
