'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';

/**
 * 管理后台布局。
 *
 * 统一提供会话上下文、侧边导航和顶部栏；
 * 登录页作为特例不展示后台框架，避免在未登录状态下暴露多余管理界面。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 登录页不显示侧边栏，避免在未建立会话前渲染完整管理后台框架。
  if (pathname === '/admin/login') {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="min-h-screen flex-1 xl:ml-72">
          <AdminHeader />
          <main className="px-4 pb-6 md:px-6">
            <div className="page-frame min-h-[calc(100vh-8.5rem)] p-5 md:p-7">{children}</div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
