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
    <div>
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">标签</h1>
        <p className="text-muted-foreground">共 {tags.length} 个标签</p>
      </header>

      {tags.length === 0 ? (
        <p className="text-muted-foreground">暂无标签。</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              <span>#{tag.name}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                {tag._count.posts}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
