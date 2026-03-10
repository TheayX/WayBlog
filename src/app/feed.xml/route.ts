import { prisma } from '@/lib/prisma';
import { getSiteConfig } from '@/lib/site';
import { PostStatus } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const site = getSiteConfig();

  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

