import { SITE_PROFILE } from '@/config/site';

/**
 * 站点级基础配置读取入口。
 *
 * 站点品牌和描述属于公开内容配置，统一从 `src/config/site.ts` 读取；
 * 这里只保留会随部署环境变化的站点 URL，避免把内容配置和运行环境配置混在一起。
 */
export function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/g, '');
}

export function getSiteConfig() {
  return {
    name: SITE_PROFILE.brandName,
    description: SITE_PROFILE.siteDescription,
    url: normalizeSiteUrl(process.env.SITE_URL || 'http://localhost:3610'),
  };
}
