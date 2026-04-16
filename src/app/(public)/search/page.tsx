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
    <div>
      <header className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">搜索</h1>
        <div className="h-10 rounded-md border border-border bg-muted/30" />
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
