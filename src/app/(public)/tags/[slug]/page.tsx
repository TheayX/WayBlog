import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { PageIntro } from '@/components/ui/PageIntro';
import { getPublishedPostsPageByTag } from '@/lib/posts/queries';
import { getPublicTagBySlug } from '@/lib/taxonomies/queries';
import { toIsoString } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * 标签页元数据。
 *
 * 根据标签 slug 生成公开聚合页标题与描述，便于 SEO 与分享场景复用。
 */
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getPublicTagBySlug(slug);

  if (!tag) return { title: '标签不存在' };

  return {
    title: `${tag.name} - 标签`,
    description: `标签 ${tag.name} 下的所有文章。`,
  };
}

/**
 * 前台标签聚合页。
 *
 * 分页展示某个标签下的已发布文章，并复用与首页一致的文章卡片展示方式，
 * 保持公开页列表体验统一。
 */
export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const pageSize = 10;

  const tag = await getPublicTagBySlug(slug);

  if (!tag) notFound();

  const { data: posts, total } = await getPublishedPostsPageByTag(tag.id, page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Tag" title={`#${tag.name}`} description={`共 ${total} 篇文章`} />

      {posts.length === 0 ? (
        <EmptyState description="该标签下还没有文章，稍后再来看看。" />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              content={post.content}
              coverImage={post.coverImage}
              publishedAt={toIsoString(post.publishedAt)}
              viewCount={post.viewCount}
              pinned={post.pinned}
              category={post.category}
              tags={post.tags}
            />
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/tags/${tag.slug}`} />
    </div>
  );
}
