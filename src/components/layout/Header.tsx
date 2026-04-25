'use client';

import { ChevronDown, Menu, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { getPublicPageHref, type PublicNavigationPage } from '@/lib/pages/shared';
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
];

interface HeaderProps {
  pages: PublicNavigationPage[];
}

export function Header({ pages }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagesMenuOpen, setPagesMenuOpen] = useState(false);
  const pageItems = pages.map((page) => ({
    ...page,
    href: getPublicPageHref(page.slug),
  }));
  const pagesActive = pathname.startsWith('/pages/');

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="page-shell">
        <div className="page-frame flex min-h-[4.5rem] items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-3 text-sm text-foreground"
            onClick={() => setMenuOpen(false)}
          >
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

            {pageItems.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setPagesMenuOpen(true)}
                onMouseLeave={() => setPagesMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setPagesMenuOpen((open) => !open)}
                  onFocus={() => setPagesMenuOpen(true)}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                    pagesActive
                      ? 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.14)]'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                  aria-expanded={pagesMenuOpen}
                  aria-haspopup="menu"
                >
                  页面
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      pagesMenuOpen ? 'rotate-180' : '',
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'absolute right-0 top-full pt-3 transition-all duration-200',
                    pagesMenuOpen
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-1 opacity-0',
                  )}
                >
                  <div className="surface-panel min-w-[16rem] rounded-[1.75rem] border border-border/80 bg-background/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
                    <p className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Pages
                    </p>
                    <div className="space-y-1">
                      {pageItems.map((page) => {
                        const isActive = pathname === page.href;

                        return (
                          <Link
                            key={page.slug}
                            href={page.href}
                            onClick={() => {
                              setPagesMenuOpen(false);
                              setMenuOpen(false);
                            }}
                            className={cn(
                              'flex cursor-pointer items-center justify-between gap-4 rounded-[1.2rem] px-3 py-3 text-sm transition-colors duration-200',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-muted/80',
                            )}
                          >
                            <span className="truncate font-medium">{page.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            {pageItems.length > 0 && (
              <div className="rounded-[1.6rem] border border-border/80 bg-background/80 p-2">
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-sm font-medium text-foreground">页面</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {pageItems.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {pageItems.map((page) => (
                    <Link
                      key={page.slug}
                      href={page.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'block rounded-[1.2rem] px-4 py-3 text-sm font-medium',
                        pathname === page.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span className="truncate">{page.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
