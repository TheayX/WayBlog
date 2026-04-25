'use client';

import { ChevronDown, Menu, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  const [pagesMenuPinned, setPagesMenuPinned] = useState(false);
  const [pagesMenuStyle, setPagesMenuStyle] = useState({ top: 0, right: 0, width: 256 });
  const closePagesMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerShellRef = useRef<HTMLDivElement | null>(null);
  const pagesTriggerRef = useRef<HTMLDivElement | null>(null);
  const pageItems = pages.map((page) => ({
    ...page,
    href: getPublicPageHref(page.slug),
  }));
  const pagesActive = pathname.startsWith('/pages/');

  /**
   * 鼠标从触发按钮移动到下拉面板时，给一个很短的缓冲时间，
   * 避免用户只是经过按钮下边缘就触发“闪开闪关”的抖动体验。
   */
  function cancelClosePagesMenu() {
    if (closePagesMenuTimerRef.current) {
      clearTimeout(closePagesMenuTimerRef.current);
      closePagesMenuTimerRef.current = null;
    }
  }

  function openPagesMenu() {
    cancelClosePagesMenu();
    setPagesMenuOpen(true);
  }

  function scheduleClosePagesMenu() {
    if (pagesMenuPinned) return;

    cancelClosePagesMenu();
    closePagesMenuTimerRef.current = setTimeout(() => {
      setPagesMenuOpen(false);
      closePagesMenuTimerRef.current = null;
    }, 140);
  }

  /**
   * 下拉面板脱离 page-frame 独立悬浮，避免被卡片裁剪；
   * 位置仍以触发按钮为锚点，这样不会破坏当前 Header 的版心布局。
   */
  function syncPagesMenuPosition() {
    const shell = headerShellRef.current;
    const trigger = pagesTriggerRef.current;
    if (!shell || !trigger) return;

    const shellRect = shell.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();

    setPagesMenuStyle({
      top: triggerRect.bottom - shellRect.top + 4,
      right: shellRect.right - triggerRect.right,
      width: triggerRect.width,
    });
  }

  function handlePagesMenuToggle() {
    cancelClosePagesMenu();
    syncPagesMenuPosition();
    setPagesMenuPinned((pinned) => {
      const nextPinned = !pinned;
      setPagesMenuOpen(nextPinned);
      return nextPinned;
    });
  }

  useEffect(() => {
    return () => {
      cancelClosePagesMenu();
    };
  }, []);

  useEffect(() => {
    if (!pagesMenuOpen) return;

    syncPagesMenuPosition();

    function handleWindowChange() {
      syncPagesMenuPosition();
    }

    function handleDocumentPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;

      if (
        target &&
        (pagesTriggerRef.current?.contains(target) || headerShellRef.current?.contains(target))
      ) {
        return;
      }

      setPagesMenuOpen(false);
      setPagesMenuPinned(false);
    }

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
    document.addEventListener('mousedown', handleDocumentPointerDown);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
      document.removeEventListener('mousedown', handleDocumentPointerDown);
    };
  }, [pagesMenuOpen]);

  return (
    <header className="sticky top-0 z-[70] px-4 pt-4 sm:px-6">
      <div ref={headerShellRef} className="page-shell relative">
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
                ref={pagesTriggerRef}
                className="relative z-[80]"
                onMouseEnter={openPagesMenu}
                onMouseLeave={scheduleClosePagesMenu}
              >
                <button
                  type="button"
                  onClick={handlePagesMenuToggle}
                  onFocus={openPagesMenu}
                  onBlur={scheduleClosePagesMenu}
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

        {pageItems.length > 0 && (
          <div
            className={cn(
              'absolute z-[120] transition-all duration-200',
              pagesMenuOpen
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-1 opacity-0',
            )}
            style={{
              top: `${pagesMenuStyle.top}px`,
              right: `${pagesMenuStyle.right}px`,
              width: `${pagesMenuStyle.width}px`,
            }}
            onMouseEnter={openPagesMenu}
            onMouseLeave={scheduleClosePagesMenu}
          >
            <div className="h-1" aria-hidden="true" />
            <div className="surface-panel rounded-[1.75rem] border border-border/80 bg-background/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="space-y-1">
                {pageItems.map((page) => {
                  const isActive = pathname === page.href;

                  return (
                    <Link
                      key={page.slug}
                      href={page.href}
                      onClick={() => {
                        setPagesMenuOpen(false);
                        setPagesMenuPinned(false);
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
        )}
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
