'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_NAV_ITEMS, SITE_BRAND } from './site-config';

interface AdminSidebarNavProps {
  compact?: boolean;
  onNavigateAction?: () => void;
}

function AdminSidebarNav({ compact = false, onNavigateAction }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-1', compact ? '' : 'flex-1')}>
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigateAction}
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
  );
}

/**
 * 管理后台侧边导航。
 *
 * 通过 pathname 高亮当前模块，并集中维护后台主要入口，
 * 让文章、分类、标签和友链管理在同一套导航语义下切换。
 */
export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 shrink-0 p-4 xl:block">
      <div className="page-frame flex h-full flex-col px-4 py-5">
        <div className="border-b border-border pb-5">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl">
              <Image
                src={SITE_BRAND.logoSrc}
                alt={`${SITE_BRAND.fullName} logo`}
                width={44}
                height={44}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <p className="editorial-title text-2xl font-semibold text-foreground">
                {SITE_BRAND.shortName}
              </p>
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

        <AdminSidebarNav />

        <div className="mt-4 border-t border-border pb-5 pt-4">
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

export function AdminMobileNav({ onNavigateAction }: { onNavigateAction: () => void }) {
  return (
    <div className="page-frame mt-3 px-3 py-3 xl:hidden">
      <div className="px-2 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Content Ops
        </p>
      </div>

      <AdminSidebarNav compact onNavigateAction={onNavigateAction} />

      <div className="mt-3 border-t border-border pb-2 pt-3">
        <Link
          href="/"
          onClick={onNavigateAction}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>回到前台</span>
        </Link>
      </div>
    </div>
  );
}
