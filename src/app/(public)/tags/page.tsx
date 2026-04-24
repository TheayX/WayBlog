import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageIntro } from '@/components/ui/PageIntro';
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
      <PageIntro
        eyebrow="Tags"
        title="标签索引"
        description={`共 ${tags.length} 个标签。标签页承担主题聚合入口，应该比普通标签云更有秩序。`}
      />

      {tags.length === 0 ? (
        <EmptyState description="当前还没有标签可供浏览。" />
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
