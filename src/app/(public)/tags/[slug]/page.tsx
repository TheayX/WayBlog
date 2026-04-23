import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { getPublishedPostsPageByTag } from '@/lib/posts/queries';
import { getPublicTagBySlug } from '@/lib/taxonomies/queries';

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
    <div>
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">#{tag.name}</h1>
        <p className="text-sm text-muted-foreground">共 {total} 篇文章</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">该标签下暂无文章。</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              content={post.content}
              coverImage={post.coverImage}
              publishedAt={post.publishedAt?.toISOString() || null}
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
