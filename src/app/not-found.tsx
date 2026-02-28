import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '页面不存在',
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-8xl font-bold text-muted-foreground/30">404</h1>
      <h2 className="mb-4 text-2xl font-semibold">页面不存在</h2>
      <p className="mb-8 text-muted-foreground">
        你访问的页面可能已被移除、名称已更改或暂时不可用。
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        ← 返回首页
      </Link>
    </div>
  );
}

