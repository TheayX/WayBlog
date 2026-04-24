'use client';

import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageIntro } from '@/components/ui/PageIntro';
import { formatDate } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  highlightSegments: Array<{ text: string; highlighted: boolean }>;
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
 * 搜索页客户端主体。
 *
 * 负责同步查询参数、触发搜索请求、展示分页结果，并把结构化高亮摘要渲染到前台页面。
 */
export function SearchPageClient() {
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

  useEffect(() => {
    if (initialQ) {
      void doSearch(initialQ, initialPage);
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
    <div className="space-y-8">
      <div className="space-y-8">
        <PageIntro
          eyebrow="Search"
          title="按关键词检索文章内容"
          description="搜索页应当是高效入口，而不是一个空白输入框。这里会保留标题、结构化摘要和标签路径，方便快速定位内容。"
          aside={
            <div className="surface-panel hidden rounded-[1.5rem] p-5 lg:block">
              <p className="eyebrow">Tips</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <li>可直接搜索技术关键词、文章标题或标签。</li>
                <li>结果摘要会高亮匹配片段。</li>
                <li>无结果时建议更换更短或更具体的词。</li>
              </ul>
            </div>
          }
        />

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索文章..."
            className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>
      </div>

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
                <article key={result.id} className="page-frame p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {result.publishedAt && (
                      <time dateTime={result.publishedAt}>{formatDate(result.publishedAt)}</time>
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

                  <h2 className="mt-2">
                    <Link
                      href={`/posts/${result.slug}`}
                      className="editorial-title text-2xl font-semibold transition-colors hover:text-primary"
                    >
                      {result.title}
                    </Link>
                  </h2>

                  {result.highlightSegments.length > 0 && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {result.highlightSegments.map((segment, index) =>
                        segment.highlighted ? (
                          <mark
                            key={`${index}-${segment.text}`}
                            className="rounded-sm bg-primary/15 px-0.5 text-foreground"
                          >
                            {segment.text}
                          </mark>
                        ) : (
                          <span key={`${index}-${segment.text}`}>{segment.text}</span>
                        ),
                      )}
                    </p>
                  )}

                  {result.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {result.tags.map((tag) => (
                        <Link
                          key={tag.slug}
                          href={`/tags/${tag.slug}`}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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

          {!loading && results.length === 0 && (
            <EmptyState
              title="没有找到匹配内容"
              description="可以尝试缩短关键词、换一个同义词，或者直接从标签页、归档页继续浏览。"
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/tags"
                    className="inline-flex h-11 items-center rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
                  >
                    浏览标签
                  </Link>
                  <Link
                    href="/archives"
                    className="inline-flex h-11 items-center rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
                  >
                    浏览归档
                  </Link>
                </div>
              }
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-8">
              {page > 1 ? (
                <button
                  onClick={() => handlePageChange(page - 1)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一页
                </button>
              ) : (
                <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground opacity-50">
                  <ArrowLeft className="h-4 w-4" />
                  上一页
                </span>
              )}

              <span className="inline-flex h-11 items-center rounded-full border border-border bg-muted/70 px-4 text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>

              {page < totalPages ? (
                <button
                  onClick={() => handlePageChange(page + 1)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
                >
                  下一页
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground opacity-50">
                  下一页
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
