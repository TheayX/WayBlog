'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/admin/dashboard', label: '仪表盘', icon: '📊' },
  { href: '/admin/posts', label: '文章管理', icon: '📝' },
  { href: '/admin/categories', label: '分类管理', icon: '📁' },
  { href: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { href: '/admin/friend-links', label: '友链管理', icon: '🔗' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-muted/30">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin/dashboard" className="text-lg font-bold text-primary">
          Way Admin
        </Link>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-1 p-3">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* 底部 */}
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span>🏠</span>
          <span>回到前台</span>
        </Link>
      </div>
    </aside>
  );
}

