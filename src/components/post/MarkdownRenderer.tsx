'use client';

import {
  isValidElement,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 通用 Markdown 渲染器。
 *
 * 同时服务管理后台预览与前台页面展示，因此默认开启 GFM、标题锚点与代码高亮；
 * sanitizeSchema 只额外放行高亮所需 className，避免为视觉效果牺牲基础安全边界。
 */

// 允许 code 和 span 上保留 class 属性，供代码高亮使用。
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), 'className'],
    span: [...(defaultSchema.attributes?.span || []), 'className'],
  },
};

interface MarkdownRendererProps {
  content: string;
}

type CopyState = 'idle' | 'copied' | 'error';

function extractTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextContent(node.props.children ?? null);
  }

  return '';
}

function CodeBlock({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLPreElement>) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const code = extractTextContent(children).replace(/\n$/, '');

  useEffect(() => {
    if (copyState !== 'copied') {
      return;
    }

    const timer = window.setTimeout(() => setCopyState('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  const buttonLabel = copyState === 'copied' ? '已复制' : copyState === 'error' ? '复制失败' : '复制';

  return (
    <pre {...props} className={className ? `code-block ${className}` : 'code-block'}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/88 transition-colors hover:bg-background/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 dark:hover:bg-background-elevated/55"
        aria-label={`复制代码${copyState === 'copied' ? '，已复制' : ''}`}
        title={buttonLabel}
      >
        {copyState === 'copied' ? (
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
            <path d="M3.75 8.25 6.5 11l5.75-6.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
            <rect x="5.25" y="3.25" width="7.5" height="9.5" rx="1.75" strokeWidth="1.25" />
            <path d="M3.25 10.75V5.25C3.25 4.14543 4.14543 3.25 5.25 3.25" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {children}
    </pre>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-28 prose-a:no-underline prose-a:transition-colors prose-code:rounded prose-code:bg-muted/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.92em] prose-code:before:content-none prose-code:after:content-none prose-img:rounded-3xl prose-img:border prose-img:border-border prose-blockquote:border-l-[3px] prose-blockquote:not-italic prose-hr:my-10">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeSanitize, sanitizeSchema], rehypeHighlight]}
        components={{
          pre: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
