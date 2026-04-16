import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { PostStatus } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * sitemap.xml 元数据路由。
 *
 * 该前台元数据路由整合静态页面与数据库中的公开内容，供搜索引擎发现站点结构。
 * 仅收录已发布文章，以及所有分类页、标签页；管理后台和草稿不会出现在这里。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || 'http://localhost:3333';

  // 公开页中的稳定静态入口，优先级相对固定。
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/archives`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/friends`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/search`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // 文章 URL 来源于数据库，只暴露已发布内容。
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 分类页本身是公开聚合页，即使分类下暂时没有文章也会保留入口。
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 标签页与分类页类似，用于公开检索与 SEO 聚合。
  const tags = await prisma.tag.findMany({
    select: { slug: true },
  });

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${siteUrl}/tags/${tag.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticPages, ...postPages, ...categoryPages, ...tagPages];
}

