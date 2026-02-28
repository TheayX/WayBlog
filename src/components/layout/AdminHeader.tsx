'use client';

import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

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

