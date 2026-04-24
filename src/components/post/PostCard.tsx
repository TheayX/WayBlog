import Link from 'next/link';
import { ArrowUpRight, Eye } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';

/**
 * 文章列表卡片。
 *
 * 用于首页、分类页、标签页等列表场景，统一承载标题、摘要、分类、标签、浏览量与置顶态展示。
 * `excerpt` 优先作为摘要来源，缺失时才回退到 `content` 截断，避免前台页面列表把正文原样暴露得过长。
 */
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
  const visibleTags = tags.slice(0, 3);

  return (
    <article className="group page-frame relative flex flex-col justify-between p-6 sm:p-8">
      {/* 整个卡片的点击热区，z-10 覆盖在静态文本上，确保整个卡片大部分可点 */}
      <Link
        href={`/posts/${slug}`}
        className="absolute inset-0 z-10"
        aria-label={`阅读 ${title}`}
      />

      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
          {pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <ArrowUpRight className="h-3.5 w-3.5" />
              置顶
            </span>
          )}
          {category && (
            <Link
              href={`/categories/${category.slug}`}
              className="relative z-20 hover:text-primary"
            >
              {category.name}
            </Link>
          )}
          {category && <span className="h-1 w-1 rounded-full bg-border" />}
          {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {viewCount}
          </span>
        </div>

        <h2 className="editorial-title text-2xl font-semibold leading-tight text-foreground group-hover:text-primary sm:text-3xl">
          {title}
        </h2>

        {summary && (
          <p className="line-clamp-3 max-w-3xl text-base leading-8 text-muted-foreground">
            {summary}
          </p>
        )}
      </div>

      {visibleTags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="relative z-20 inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
            >
              #{tag.name}
            </Link>
          ))}
          {tags.length > visibleTags.length && (
            <span className="inline-flex items-center rounded-full border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              +{tags.length - visibleTags.length}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
