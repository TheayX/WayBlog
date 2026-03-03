import Link from 'next/link';
import { PostStatus } from '@/generated/prisma';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const pageSize = 10;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
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
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <section className="mb-12">
        <h1 className="mb-2 text-3xl font-bold">Way</h1>
        <p className="text-lg text-muted-foreground">A Journey of Code and Thought</p>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold">最新文章</h2>
        {posts.length === 0 ? (
          <p className="text-muted-foreground">
            暂无文章。
            <Link href="/admin/login" className="ml-1 text-primary hover:underline">
              登录后台发布第一篇文章
            </Link>
          </p>
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

        <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
      </section>
    </div>
  );
}
