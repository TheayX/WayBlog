'use client';

import {
  ArrowUpRight,
  FolderTree,
  LayoutDashboard,
  PencilLine,
  Settings,
  Tags,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * 管理后台侧边导航。
 *
 * 通过 pathname 高亮当前模块，并集中维护后台主要入口，
 * 让文章、分类、标签和友链管理在同一套导航语义下切换。
 * sidebarItems 是后台信息架构的唯一来源，新增管理模块时应优先在这里补入口。
 */
const sidebarItems = [
  { href: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/posts', label: '文章管理', icon: PencilLine },
  { href: '/admin/categories', label: '分类管理', icon: FolderTree },
  { href: '/admin/tags', label: '标签管理', icon: Tags },
  { href: '/admin/friend-links', label: '友链管理', icon: UsersRound },
  { href: '/admin/settings', label: '账号设置', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 shrink-0 p-4 xl:block">
      <div className="page-frame flex h-full flex-col px-4 py-5">
        <div className="border-b border-border pb-5">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-lg font-semibold text-primary">
              W
            </div>
            <div>
              <p className="editorial-title text-2xl font-semibold text-foreground">Way.</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Admin Console
              </p>
            </div>
          </Link>
        </div>

        <div className="px-2 pb-3 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Content Ops
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-border pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>回到前台</span>
          </Link>
          <p className="px-4 pt-3 text-xs leading-6 text-muted-foreground">
            管理端聚焦发布、整理与内容维护，不承担前台展示职责。
          </p>
        </div>
      </div>
    </aside>
  );
}
