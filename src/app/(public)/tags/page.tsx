import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicTagsWithPostCount } from '@/lib/taxonomies/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '标签',
  description: '所有标签。',
};

/**
 * 前台标签总览页。
 *
 * 展示所有标签及其已发布文章数量，作为公开页按主题浏览内容的入口。
 */
export default async function TagsPage() {
  const tags = await getPublicTagsWithPostCount();

  return (
    <div className="space-y-8">
      <header className="page-frame px-6 py-8 sm:px-8">
        <p className="eyebrow">Tags</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold text-foreground sm:text-5xl">
          标签索引
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          共 {tags.length} 个标签。标签页承担主题聚合入口，应该比普通标签云更有秩序。
        </p>
      </header>

      {tags.length === 0 ? (
        <div className="page-frame px-6 py-12 text-muted-foreground">暂无标签。</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="page-frame group flex items-center justify-between gap-3 px-5 py-4 text-sm hover:border-border-strong"
            >
              <span className="font-medium text-foreground group-hover:text-primary">
                #{tag.name}
              </span>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                {tag._count.posts}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
