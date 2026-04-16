'use client';

import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

/**
 * 管理后台顶部栏。
 *
 * 负责展示当前登录用户、主题切换与退出入口，
 * 避免每个后台页面各自重复拼装会话相关操作。
 * 这里不承担导航职责，而是聚焦当前会话状态与全局操作，确保后台布局职责清晰。
 * 当 session 不存在时只保留基础框架，不渲染退出按钮，避免在鉴权状态切换期间出现误操作入口。
 */
export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              退出
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

