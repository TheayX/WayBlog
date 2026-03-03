import { Suspense } from 'react';
import { SearchPageClient } from './SearchPageClient';

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

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}
