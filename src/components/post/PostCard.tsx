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
    <article className="group rounded-lg border border-border p-5 transition-colors hover:border-primary/30 hover:bg-muted/30">
      <div className="flex flex-col gap-3">
        {/* 元信息行 */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {pinned && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium">📌 置顶</span>}
          {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
          {category && (
            <Link href={`/categories/${category.slug}`} className="hover:text-primary">
              {category.name}
            </Link>
          )}
          <span>👁 {viewCount}</span>
        </div>

        {/* 标题 */}
        <h2 className="text-lg font-semibold">
          <Link href={`/posts/${slug}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </h2>

        {/* 摘要 */}
        {summary && <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>}

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

