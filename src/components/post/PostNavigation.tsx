import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * 文章详情页上下篇导航。
 *
 * 负责在详情页底部串联相邻文章，
 * 同时兼容只有上一篇或下一篇存在的边界场景。
 * 当其中一侧为空时保留占位宽度，是为了让双栏布局在桌面端保持稳定对齐。
 */
interface PostNavigationProps {
  prevPost: { slug: string; title: string } | null;
  nextPost: { slug: string; title: string } | null;
}

export function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav className="mt-14 border-t border-border/80 pt-8">
      <div className="mb-4">
        <p className="eyebrow">Continue Reading</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">继续阅读</h2>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        {prevPost ? (
          <Link
            href={`/posts/${prevPost.slug}`}
            className="group page-frame flex flex-1 flex-col p-5"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              上一篇
            </span>
            <span className="mt-3 text-base font-medium text-foreground group-hover:text-primary">
              {prevPost.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nextPost ? (
          <Link
            href={`/posts/${nextPost.slug}`}
            className="group page-frame flex flex-1 flex-col items-end p-5 text-right"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              下一篇
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="mt-3 text-base font-medium text-foreground group-hover:text-primary">
              {nextPost.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </nav>
  );
}
