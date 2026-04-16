'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
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
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 text-xl font-bold tracking-tight text-primary transition-transform hover:scale-105 active:scale-95">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            W
          </div>
          <span>Way.</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
          <div className="mx-2 h-4 w-px bg-border/50" />
          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="搜索"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <div className="ml-1 flex items-center justify-center">
            <ThemeToggle />
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="菜单"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="absolute left-0 top-16 w-full animate-in slide-in-from-top-2 border-b border-border bg-background shadow-lg md:hidden">
          <div className="flex flex-col space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'block rounded-md px-4 py-3 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border/50" />
            <Link
              href="/search"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-4 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              搜索文章
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

