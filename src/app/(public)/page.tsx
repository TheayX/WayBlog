import Link from 'next/link';
import { ArrowRight, Compass, Newspaper, Search } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { SITE_PROFILE } from '@/config/site';
import { getPublishedPostsPage } from '@/lib/posts/queries';
import { toIsoString } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * 前台首页。
 *
 * 负责展示公开站点的文章列表入口，数据源来自数据库中的已发布文章；
 * 页面保持运行期渲染，公开文章查询在数据层使用短周期缓存；草稿不会出现在这里。
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const pageSize = 10;

  const { data: posts, total } = await getPublishedPostsPage(page, pageSize);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex w-full flex-col gap-10 lg:gap-12">
      <section className="page-frame px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_20rem] lg:items-end">
          <div className="space-y-6">
            <p className="eyebrow">{SITE_PROFILE.homeEyebrow}</p>
            <div className="space-y-4">
              <h1 className="editorial-title max-w-4xl text-5xl font-semibold leading-tight text-foreground sm:text-6xl lg:text-7xl">
                {SITE_PROFILE.homeHeadline}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {SITE_PROFILE.brandName}
                {SITE_PROFILE.homeDescription}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/archives"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                <Compass className="h-4 w-4" />
                浏览归档
              </Link>
              <Link
                href="/search"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                搜索文章
              </Link>
            </div>
          </div>

          <div className="surface-panel rounded-[1.75rem] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Newspaper className="h-4 w-4 text-accent" />
              内容节奏
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
                <dt className="text-muted-foreground">当前页码</dt>
                <dd className="editorial-title text-3xl font-semibold text-foreground">
                  {page.toString().padStart(2, '0')}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
                <dt className="text-muted-foreground">已发布文章</dt>
                <dd className="text-lg font-semibold text-foreground">{total}</dd>
              </div>
              <div className="flex items-end justify-between gap-4">
                <dt className="text-muted-foreground">更新方式</dt>
                <dd className="text-right font-medium text-foreground">持续整理后发布</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Recent Writing</p>
            <h2 className="editorial-title text-3xl font-semibold text-foreground sm:text-4xl">
              最近更新
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              以文章为核心，不把首页做成资讯流；每一篇内容都应保持清晰标题、明确摘要和稳定入口。
            </p>
          </div>
          <Link
            href="/archives"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            查看全部归档
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="page-frame px-6 py-12 text-center">
            <p className="text-muted-foreground">
              暂无文章。
              <Link href="/admin/login" className="ml-1 text-primary hover:underline">
                登录后台发布第一篇文章
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
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

        <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
      </section>
    </div>
  );
}
