import { getPublishedFeedPosts } from '@/lib/posts/queries';
import { getSiteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * feed.xml 元数据路由。
 *
 * 该前台元数据路由为 RSS 订阅提供 XML 输出，数据源为数据库中的已发布文章。
 * 这里不会包含草稿，也不会暴露管理后台信息；返回结果可被订阅器和聚合器直接消费。
 */
export async function GET() {
  const site = getSiteConfig();

  const posts = await getPublishedFeedPosts(20);

  // 手写 XML 时必须转义特殊字符，避免 Markdown 或摘要内容破坏文档结构。
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const items = posts
    .map((post) => {
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : '';
      const description = post.excerpt || post.content.slice(0, 300);

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${site.url}/posts/${post.slug}</link>
      <guid isPermaLink="true">${site.url}/posts/${post.slug}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      ${post.author?.name ? `<dc:creator>${escapeXml(post.author.name)}</dc:creator>` : ''}
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // 订阅内容允许短时间缓存，减少重复生成开销。
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

