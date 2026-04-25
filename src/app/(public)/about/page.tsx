import { redirect } from 'next/navigation';
import { getPublicPageHref } from '@/lib/pages/shared';

/**
 * 兼容旧的 `/about` 公开入口。
 *
 * 单页已经统一迁移到 `/pages/[slug]`，这里仅保留无内容重定向，
 * 避免已有站内链接或搜索引擎索引在切换期间直接失效。
 */
export default function AboutRedirectPage() {
  redirect(getPublicPageHref('about'));
}
