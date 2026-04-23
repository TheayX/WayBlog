import type { MetadataRoute } from 'next';

/**
 * robots.txt 元数据路由。
 *
 * 该前台元数据路由用于告知搜索引擎：公开页可抓取，管理后台与 API 不应被索引。
 * 输出依赖环境变量中的站点地址，不涉及数据库读取。
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL || 'http://localhost:3610';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 管理后台依赖鉴权，API 主要供应用内部调用，不应作为公开索引入口。
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

