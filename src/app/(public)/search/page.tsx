import { Suspense } from 'react';
import { SearchPageClient } from './SearchPageClient';

/**
 * 搜索页的服务端外壳。
 *
 * 只负责为客户端搜索组件提供 Suspense 边界和首屏骨架，
 * 真正的搜索交互、查询参数同步和分页状态都交给客户端组件处理。
 */
function SearchPageFallback() {
  return (
    <div className="space-y-8">
      <header className="page-frame px-6 py-8 sm:px-8">
        <p className="eyebrow">Search</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">搜索文章</h1>
        <div className="mt-5 h-12 rounded-full border border-border bg-muted/30" />
      </header>
      <p className="text-sm text-muted-foreground">加载中...</p>
    </div>
  );
}

/** 前台搜索页入口。 */
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}
