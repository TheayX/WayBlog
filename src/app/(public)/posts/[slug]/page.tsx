import { CalendarDays, FolderTree, PenSquare, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { PostNavigation } from '@/components/post/PostNavigation';
import { TableOfContents } from '@/components/post/TableOfContents';
import { ViewCounter } from '@/components/post/ViewCounter';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteConfig } from '@/lib/site';
import {
  getPublishedPostDetail,
  getPublishedPostMetadata,
  getPublishedPostNavigation,
} from '@/lib/posts/queries';
import { formatDate, toIsoString } from '@/lib/utils';

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
  const post = await getPublishedPostMetadata(slug);

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
      publishedTime: toIsoString(post.publishedAt) || undefined,
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
  const post = await getPublishedPostDetail(slug);

  if (!post) notFound();

  const site = getSiteConfig();
  const { prevPost, nextPost } = post.publishedAt
    ? await getPublishedPostNavigation(post.publishedAt)
    : { prevPost: null, nextPost: null };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: toIsoString(post.publishedAt) || undefined,
    dateModified: toIsoString(post.updatedAt) || undefined,
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
    <div className="relative space-y-8">
      <JsonLd data={jsonLd} />

      <section className="page-frame px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_18rem] lg:items-end">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="eyebrow">Article</p>
              <h1 className="editorial-title text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                  {post.excerpt}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {post.author.name && (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
                  <PenSquare className="h-4 w-4 text-accent" />
                  {post.author.name}
                </span>
              )}
              {post.publishedAt && (
                <time
                  dateTime={toIsoString(post.publishedAt) || undefined}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2"
                >
                  <CalendarDays className="h-4 w-4 text-accent" />
                  {formatDate(post.publishedAt)}
                </time>
              )}
              {post.category && (
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 hover:border-border-strong hover:text-foreground"
                >
                  <FolderTree className="h-4 w-4 text-accent" />
                  {post.category.name}
                </Link>
              )}
            </div>
          </div>

          <div className="surface-panel rounded-[1.75rem] p-5">
            <p className="eyebrow">Reading Info</p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                <span className="text-muted-foreground">阅读状态</span>
                <span className="font-medium text-foreground">已发布</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                <span className="text-muted-foreground">更新时间</span>
                <span className="font-medium text-foreground">{formatDate(post.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">访问情况</span>
                <ViewCounter postId={post.id} initialCount={post.viewCount} />
              </div>
            </div>
          </div>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
              >
                <Tag className="h-3.5 w-3.5" />
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {post.coverImage && (
        <div className="page-frame overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1200}
            height={630}
            className="aspect-[16/8] w-full object-cover"
            priority
          />
        </div>
      )}

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-8">
        <article className="min-w-0">
          <div className="page-frame p-6 sm:p-8 lg:p-10">
            <MarkdownRenderer content={post.content} />
          </div>
          <PostNavigation prevPost={prevPost} nextPost={nextPost} />
        </article>

        <TableOfContents content={post.content} />
      </div>
    </div>
  );
}
