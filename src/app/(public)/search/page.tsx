'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  highlight: string;
  publishedAt: string | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
}

interface SearchResponse {
  data: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 简单 HTML 清理：只保留 <b> 标签（ts_headline 输出），移除其他 HTML 标签
 */
function sanitizeHighlight(html: string): string {
  return html.replace(/<\/?(?!b\b)[^>]*>/gi, '');
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);

  const doSearch = useCallback(
    async (q: string, p: number) => {
      if (!q.trim()) return;

      setLoading(true);
      setSearched(true);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q.trim())}&page=${p}&pageSize=${pageSize}`,
        );
        if (res.ok) {
          const json: SearchResponse = await res.json();
          setResults(json.data);
          setTotal(json.total);
          setPage(json.page);
        } else {
          setResults([]);
          setTotal(0);
        }
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  // URL 参数变化时执行搜索
  useEffect(() => {
    if (initialQ) {
      doSearch(initialQ, initialPage);
    }
  }, [initialQ, initialPage, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/search?q=${encodeURIComponent(query.trim())}&page=${newPage}`);
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">🔍 搜索</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索文章..."
            className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>
      </header>

      {/* 搜索结果 */}
      {searched && (
        <section>
          <p className="mb-4 text-sm text-muted-foreground">
            {loading
              ? '搜索中...'
              : total > 0
                ? `找到 ${total} 条结果`
                : '未找到相关文章，换个关键词试试？'}
          </p>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result) => (
                <article
                  key={result.id}
                  className="rounded-lg border border-border p-5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {result.publishedAt && (
                      <time dateTime={result.publishedAt}>
                        {formatDate(result.publishedAt)}
                      </time>
                    )}
                    {result.category && (
                      <Link
                        href={`/categories/${result.category.slug}`}
                        className="hover:text-primary"
                      >
                        {result.category.name}
                      </Link>
                    )}
                  </div>

                  <h2 className="mt-2 text-lg font-semibold">
                    <Link
                      href={`/posts/${result.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {result.title}
                    </Link>
                  </h2>

                  {result.highlight && (
                    <p
                      className="mt-2 text-sm text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHighlight(result.highlight) }}
                    />
                  )}

                  {result.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.tags.map((tag) => (
                        <Link
                          key={tag.slug}
                          href={`/tags/${tag.slug}`}
                          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              {page > 1 ? (
                <button
                  onClick={() => handlePageChange(page - 1)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  ← 上一页
                </button>
              ) : (
                <span className="rounded-md border border-border px-3 py-1.5 text-sm opacity-50">
                  ← 上一页
                </span>
              )}

              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <button
                  onClick={() => handlePageChange(page + 1)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  下一页 →
                </button>
              ) : (
                <span className="rounded-md border border-border px-3 py-1.5 text-sm opacity-50">
                  下一页 →
                </span>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}


