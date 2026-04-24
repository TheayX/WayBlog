'use client';

import { Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SITE_BRAND } from './site-config';
import { cn } from '@/lib/utils';

/**
 * 前台页面顶部导航。
 *
 * 同时承担桌面端导航、移动端折叠菜单、搜索入口与主题切换，
 * 让公开页在不同屏幕尺寸下保持一致的信息架构。
 * `menuOpen` 只服务移动端交互，桌面端始终展示完整导航，避免两套状态来源互相干扰。
 */
const navItems = [
  { href: '/', label: '首页' },
  { href: '/archives', label: '归档' },
  { href: '/tags', label: '标签' },
  { href: '/friends', label: '友链' },
  { href: '/about', label: '关于' },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="page-shell">
        <div className="page-frame flex min-h-[4.5rem] items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-3 text-sm text-foreground"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background-elevated text-lg font-semibold text-primary">
              {SITE_BRAND.mark}
            </div>
            <div className="flex flex-col">
              <span className="editorial-title text-2xl font-semibold leading-none text-foreground">
                {SITE_BRAND.shortName}
              </span>
              <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Notes on code and thought
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.14)]'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/search"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
              aria-label="搜索文章"
            >
              <Search className="h-4 w-4" />
              搜索
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
              aria-label="菜单"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav className="page-shell mt-3 md:hidden">
          <div className="page-frame flex flex-col gap-2 px-3 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'block rounded-2xl px-4 py-3 text-base font-medium',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Search className="h-5 w-5" />
              搜索文章
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
