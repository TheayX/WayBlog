import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { PostStatus } from '@/generated/prisma/client';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { TableOfContents } from '@/components/post/TableOfContents';
import { PostNavigation } from '@/components/post/PostNavigation';
import { ViewCounter } from '@/components/post/ViewCounter';
import { JsonLd } from '@/components/seo/JsonLd';
import { formatDate } from '@/lib/utils';
import { getSiteConfig } from '@/lib/site';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 前台文章详情页元数据。
 *
 * 根据 slug 读取文章基础信息生成 SEO 所需标题、摘要、封面与 Open Graph 数据；
 * 如果文章不存在，则返回“文章不存在”的兜底元数据。
 */
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
  });

  if (!post) return { title: '文章不存在' };

  const site = getSiteConfig();

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags.map((tag) => tag.name),
      url: `${site.url}/posts/${slug}`,
    },
    twitter: {
      card: post.coverImage ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

/**
 * 前台文章详情页。
 *
 * 只读取已发布文章，负责组装正文、目录、上下篇、浏览量与结构化数据，
 * 让公开页在一次服务端渲染中拿到完整阅读体验所需的数据。
 */
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: PostStatus.PUBLISHED },
    include: {
      author: { select: { name: true, avatar: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });

  if (!post) notFound();

  const site = getSiteConfig();

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { gt: post.publishedAt! },
      },
      orderBy: { publishedAt: 'asc' },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { lt: post.publishedAt! },
      },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true },
    }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
    url: `${site.url}/posts/${post.slug}`,
    mainEntityOfPage: `${site.url}/posts/${post.slug}`,
  };

  return (
    <div className="relative">
      <JsonLd data={jsonLd} />
      <div className="xl:grid xl:grid-cols-[1fr_200px] xl:gap-8">
        <article className="min-w-0">
          <header className="mb-10 lg:mb-14">
            <h1 className="mb-6 text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground/80">
              {post.author.name && (
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                    {post.author.name.charAt(0).toUpperCase()}
                  </span>
                  {post.author.name}
                </span>
              )}
              {post.publishedAt && (
                <time dateTime={post.publishedAt.toISOString()} className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {formatDate(post.publishedAt)}
                </time>
              )}
              {post.category && (
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  {post.category.name}
                </Link>
              )}
              <div className="flex items-center gap-1.5">
                <ViewCounter postId={post.id} initialCount={post.viewCount} />
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/tags/${tag.slug}`}
                    className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <Image
                src={post.coverImage}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full object-cover"
                priority
              />
            </div>
          )}

          <MarkdownRenderer content={post.content} />
          <PostNavigation prevPost={prevPost} nextPost={nextPost} />
        </article>

        <TableOfContents content={post.content} />
      </div>
    </div>
  );
}
