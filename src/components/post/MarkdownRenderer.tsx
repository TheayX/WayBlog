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

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-28 prose-a:no-underline prose-a:transition-colors prose-code:rounded prose-code:bg-muted/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.92em] prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-[1.5rem] prose-pre:border prose-pre:border-border prose-img:rounded-[1.5rem] prose-img:border prose-img:border-border prose-blockquote:border-l-[3px] prose-blockquote:not-italic prose-hr:my-10">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeSanitize, sanitizeSchema], rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
