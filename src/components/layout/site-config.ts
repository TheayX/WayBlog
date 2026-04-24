import {
  FolderTree,
  LayoutDashboard,
  PencilLine,
  Settings,
  Tags,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export const SITE_BRAND = {
  mark: 'W',
  shortName: 'Way.',
  fullName: 'WayBlog',
} as const;

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * 后台导航与标题配置。
 *
 * 把品牌文案、后台导航入口和页面标题统一收敛到单一来源，
 * 避免头部、侧栏和其他壳层组件各自维护一份近似常量。
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/posts', label: '文章管理', icon: PencilLine },
  { href: '/admin/categories', label: '分类管理', icon: FolderTree },
  { href: '/admin/tags', label: '标签管理', icon: Tags },
  { href: '/admin/friend-links', label: '友链管理', icon: UsersRound },
  { href: '/admin/settings', label: '账号设置', icon: Settings },
];

export const ADMIN_PAGE_TITLES = Object.fromEntries(
  ADMIN_NAV_ITEMS.map((item) => [item.href, item.label]),
) as Record<string, string>;
