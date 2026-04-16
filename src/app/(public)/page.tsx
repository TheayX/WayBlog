import Link from 'next/link';
import { PostStatus } from '@/generated/prisma/client';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * 前台首页。
 *
 * 负责展示公开站点的文章列表入口，数据源来自数据库中的已发布文章；
 * 采用动态渲染以保证分页与最新发布内容实时可见，草稿不会出现在这里。
 */
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
      // 首页与分类页保持一致，优先展示置顶内容，其次按发布时间倒序。
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-8 w-full">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/5 via-background to-accent/5 px-6 py-16 sm:px-12 sm:py-24 border border-border/50 shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="mb-6 text-5xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-[length:200%_auto]">
            Way.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            A Journey of Code and Thought. Documenting technical explorations, life reflections, and everything in between.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">最新文章</h2>
        </div>
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
