export interface PublicNavigationPage {
  slug: string;
  title: string;
  sortOrder: number;
}

/** 公开单页统一走 `/pages/[slug]` 路由，避免为不同单页维护多套入口规则。 */
export function getPublicPageHref(slug: string) {
  return `/pages/${slug}`;
}
