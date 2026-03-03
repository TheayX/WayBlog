import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PostStatus } from '@/generated/prisma';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) return { title: '分类不存在' };

  return {
    title: `${category.name} - 分类`,
    description: category.description || `${category.name} 分类下的所有文章。`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const pageSize = 10;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!category) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, categoryId: category.id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        viewCount: true,
        pinned: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
      },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({
      where: { status: PostStatus.PUBLISHED, categoryId: category.id },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">共 {total} 篇文章</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">该分类下暂无文章。</p>
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/categories/${category.slug}`}
      />
    </div>
  );
}
