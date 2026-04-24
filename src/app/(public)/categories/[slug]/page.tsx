import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { getPublishedPostsPageByCategory } from '@/lib/posts/queries';
import { getPublicCategoryBySlug } from '@/lib/taxonomies/queries';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * 分类页元数据。
 *
 * 根据分类 slug 生成公开页标题与描述，方便搜索引擎理解当前聚合页语义。
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) return { title: '分类不存在' };

  return {
    title: `${category.name} - 分类`,
    description: category.description || `${category.name} 分类下的所有文章。`,
  };
}

/**
 * 前台分类聚合页。
 *
 * 负责分页展示某个分类下的已发布文章，并在分类不存在时回落到 404；
 * 草稿不会通过这个公开入口暴露。
 */
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const pageSize = 10;

  const category = await getPublicCategoryBySlug(slug);

  if (!category) notFound();

  const { data: posts, total } = await getPublishedPostsPageByCategory(category.id, page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <header className="page-frame px-6 py-8 sm:px-8">
        <p className="eyebrow">Category</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold text-foreground sm:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {category.description}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">共 {total} 篇文章</p>
      </header>

      {posts.length === 0 ? (
        <div className="page-frame px-6 py-12 text-muted-foreground">该分类下暂无文章。</div>
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
              publishedAt={post.publishedAt?.toISOString() || null}
              viewCount={post.viewCount}
              pinned={post.pinned}
              category={post.category}
              tags={post.tags}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/categories/${category.slug}`}
      />
    </div>
  );
}
