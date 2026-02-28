import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { PostStatus } from '@/generated/prisma';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { TOC } from '@/components/post/TOC';
import { PostNavigation } from '@/components/post/PostNavigation';
import { ViewCounter } from '@/components/post/ViewCounter';
import { JsonLd } from '@/components/seo/JsonLd';
import { formatDate, getSiteConfig } from '@/lib/utils';

export const revalidate = 60;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// ─── 生成静态路径 ───
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

// ─── 生成 Metadata ───
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
      tags: post.tags.map((t) => t.name),
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

  // 获取上一篇/下一篇（按发布时间排序）
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
      {/* 主内容区 + 侧边目录 */}
      <div className="xl:grid xl:grid-cols-[1fr_200px] xl:gap-8">
        {/* 文章主体 */}
        <article className="min-w-0">
          {/* 文章头部 */}
          <header className="mb-8">
            <h1 className="mb-4 text-3xl font-bold leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {post.author.name && <span>{post.author.name}</span>}
              {post.publishedAt && (
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
              )}
              {post.category && (
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="rounded-full border border-border px-2 py-0.5 hover:border-primary hover:text-primary transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
              <ViewCounter postId={post.id} initialCount={post.viewCount} />
            </div>

            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/tags/${tag.slug}`}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* 封面图 */}
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

          {/* Markdown 正文 */}
          <MarkdownRenderer content={post.content} />

          {/* 上一篇/下一篇 */}
          <PostNavigation prevPost={prevPost} nextPost={nextPost} />
        </article>

        {/* 右侧目录（桌面端） */}
        <TOC content={post.content} />
      </div>
    </div>
  );
}

