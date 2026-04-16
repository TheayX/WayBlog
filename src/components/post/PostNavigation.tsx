import Link from 'next/link';

/**
 * 文章详情页上下篇导航。
 *
 * 负责在前台页面详情底部串联相邻文章，
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
    <nav className="mt-10 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
      {prevPost ? (
        <Link
          href={`/posts/${prevPost.slug}`}
          className="group flex flex-1 flex-col rounded-lg border border-border p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
        >
          <span className="text-xs text-muted-foreground">← 上一篇</span>
          <span className="mt-1 text-sm font-medium group-hover:text-primary transition-colors">
            {prevPost.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {nextPost ? (
        <Link
          href={`/posts/${nextPost.slug}`}
          className="group flex flex-1 flex-col items-end rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/30 hover:bg-muted/30"
        >
          <span className="text-xs text-muted-foreground">下一篇 →</span>
          <span className="mt-1 text-sm font-medium group-hover:text-primary transition-colors">
            {nextPost.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}

