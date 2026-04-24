'use client';

import { LogOut, Menu, Search, Sparkles, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AdminMobileNav } from './AdminSidebar';
import { ThemeToggle } from './ThemeToggle';

/**
 * 管理后台顶部栏。
 *
 * 负责展示当前登录用户、主题切换与退出入口，
 * 避免每个后台页面各自重复拼装会话相关操作。
 * 这里不承担桌面导航职责，而是聚焦会话状态与全局操作；
 * 移动端导航则通过可展开面板补足，避免中小屏完全失去模块切换能力。
 */
export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageTitle =
    (
      {
        '/admin/dashboard': '内容概览',
        '/admin/posts': '文章管理',
        '/admin/categories': '分类管理',
        '/admin/tags': '标签管理',
        '/admin/friend-links': '友链管理',
        '/admin/settings': '账号设置',
      } as Record<string, string>
    )[pathname] || '后台管理';

  return (
    <header className="px-4 pb-2 pt-4 md:px-6">
      <div className="page-frame flex min-h-20 items-center justify-between px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-primary xl:hidden"
            aria-label={mobileNavOpen ? '关闭导航' : '打开导航'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <p className="eyebrow">Admin</p>
            <h1 className="truncate text-xl font-semibold text-foreground">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground lg:flex">
            <Search className="h-4 w-4" />
            全局检索稍后接入
          </div>
          <ThemeToggle />
          {session?.user && (
            <div className="hidden items-center gap-3 rounded-full border border-border bg-background px-3 py-2 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">内容维护中</p>
              </div>
            </div>
          )}
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">退出</span>
            </button>
          )}
        </div>
      </div>

      {mobileNavOpen && <AdminMobileNav onNavigate={() => setMobileNavOpen(false)} />}
    </header>
  );
}
