import Link from 'next/link';
import { formatDate, truncate } from '@/lib/utils';

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  coverImage: string | null;
  publishedAt: string | null;
  viewCount: number;
  pinned: boolean;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
}

export function PostCard({
  title,
  slug,
  excerpt,
  content,
  publishedAt,
  viewCount,
  pinned,
  category,
  tags,
}: PostCardProps) {
  const summary = excerpt || (content ? truncate(content) : '');

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-muted/20 hover:shadow-xl hover:shadow-primary/5">
      {/* 整个卡片的点击热区，z-10 覆盖在静态文本上，确保整个卡片大部分可点 */}
      <Link href={`/posts/${slug}`} className="absolute inset-0 z-10" aria-label={`阅读 ${title}`} />
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground/80 font-medium">
          {pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M22.319,4.431,19.569,1.681a1.5,1.5,0,0,0-2.122,0L15.326,3.8l-5.3-2.122a1.5,1.5,0,0,0-1.859.395L6.947,3.586,1.266,9.267.205,10.328a1.5,1.5,0,0,0,0,2.122l4.243,4.243-3.882,3.882a1.5,1.5,0,0,0,2.122,2.122l3.882-3.882,4.243,4.243a1.5,1.5,0,0,0,2.122,0l1.061-1.061,1.51-1.222a1.5,1.5,0,0,0,.395-1.859l-2.122-5.3,2.122-2.121a1.5,1.5,0,0,0,0-2.122ZM13.2,18.868,3.655,9.323,5.776,7.2,15.322,16.746Z"/></svg>
              置顶
            </span>
          )}
          {category && (
            <Link href={`/categories/${category.slug}`} className="relative z-20 hover:text-primary transition-colors">
              {category.name}
            </Link>
          )}
          {category && <span className="h-1 w-1 rounded-full bg-border" />}
          {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {viewCount}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h2>

        {summary && (
          <p className="line-clamp-3 text-base leading-relaxed text-muted-foreground/90">
            {summary}
          </p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="relative z-20 inline-flex items-center rounded-full bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
