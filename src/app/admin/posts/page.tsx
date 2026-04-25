'use client';

import { FilePlus2, Flame, PencilLine, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageIntro } from '@/components/ui/PageIntro';
import { deleteAdminResource, fetchAdminCollection } from '@/lib/admin/client';
import { formatDateShort } from '@/lib/utils';
import type { AdminPostListItem } from '@/types';

/**
 * 管理后台文章列表页。
 *
 * 负责分页拉取文章、按状态筛选，并提供跳转编辑与删除入口；
 * 后台列表读取走 `/api/admin/posts`，避免和公开文章列表接口共用权限语义。
 */
export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const pageSize = 15;

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set('status', statusFilter);

    fetchAdminCollection<{ data?: AdminPostListItem[]; total?: number }>(
      `/api/admin/posts?${params}`,
    )
      .then((res) => {
        if (!res.ok) {
          toast.error(res.error);
          setPosts([]);
          setTotal(0);
          return;
        }

        setPosts(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchPosts, 0);
    return () => clearTimeout(timeout);
  }, [fetchPosts]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定删除文章「${title}」？此操作不可恢复。`)) return;

    const deleted = await deleteAdminResource('/api/admin/posts', id);
    if (deleted) {
      toast.success('文章已删除');
      fetchPosts();
    } else {
      toast.error('删除失败');
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const publishedCount = posts.filter((post) => post.status === 'PUBLISHED').length;
  const draftCount = posts.filter((post) => post.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Posts"
        title="文章管理"
        description="统一处理文章状态、编辑入口和发布节奏。列表页优先强调可读性与状态识别，而不是传统后台表格堆叠。"
        aside={
          <div className="rounded-[1.75rem] border border-border bg-primary px-6 py-6 text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
              Current
            </p>
            <p className="mt-4 text-sm text-primary-foreground/80">当前筛选结果</p>
            <p className="editorial-title mt-2 text-5xl font-semibold">{total}</p>
            <p className="mt-5 text-sm leading-7 text-primary-foreground/80">
              支持按状态快速筛选和进入编辑工作台。
            </p>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="page-frame px-5 py-5">
          <p className="text-sm text-muted-foreground">当前列表已发布</p>
          <p className="editorial-title mt-4 text-4xl font-semibold text-foreground">
            {publishedCount}
          </p>
        </div>
        <div className="page-frame px-5 py-5">
          <p className="text-sm text-muted-foreground">当前列表草稿</p>
          <p className="editorial-title mt-4 text-4xl font-semibold text-foreground">
            {draftCount}
          </p>
        </div>
        <div className="page-frame flex items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-sm text-muted-foreground">快速操作</p>
            <p className="mt-2 text-base font-medium text-foreground">创建一篇新文章</p>
          </div>
          <Link
            href="/admin/posts/new"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <FilePlus2 className="h-4 w-4" />
            新建文章
          </Link>
        </div>
      </section>

      <section className="page-frame px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'PUBLISHED', 'DRAFT'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm ${
                statusFilter === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground'
              }`}
            >
              {s === '' ? '全部' : s === 'PUBLISHED' ? '已发布' : '草稿'}
            </button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">共 {total} 篇</span>
        </div>
      </section>

      {loading ? (
        <EmptyState title="文章加载中" description="正在拉取文章列表，请稍候。" />
      ) : posts.length === 0 ? (
        <EmptyState
          title="暂无文章"
          description="当前筛选条件下还没有文章，可以直接创建一篇新内容。"
          action={
            <Link
              href="/admin/posts/new"
              className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              新建文章
            </Link>
          }
        />
      ) : (
        <section className="page-frame overflow-hidden">
          <div className="grid gap-4 border-b border-border bg-muted/40 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid-cols-[minmax(0,2.3fr)_9rem_8rem_7rem_8rem]">
            <span className="pl-5">文章</span>
            <span className="w-full text-center">状态</span>
            <span className="w-full text-center">分类</span>
            <span className="w-full text-center">浏览量</span>
            <span className="w-full text-center">操作</span>
          </div>
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <div
                key={post.id}
                className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,2.3fr)_9rem_8rem_7rem_8rem] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {post.pinned && <Flame className="h-4 w-4 text-accent" />}
                    <span className="truncate text-base font-medium text-foreground">
                      {post.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    /posts/{post.slug} ·{' '}
                    {post.publishedAt
                      ? formatDateShort(post.publishedAt)
                      : formatDateShort(post.createdAt)}
                  </p>
                </div>

                <div className="flex w-full justify-center">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      post.status === 'PUBLISHED'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                  </span>
                </div>

                <div className="w-full text-center text-sm text-muted-foreground">
                  {post.category?.name || '未分类'}
                </div>
                <div className="w-full text-center text-sm text-muted-foreground">
                  {post.viewCount}
                </div>

                <div className="flex w-full items-center justify-center gap-3">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <PencilLine className="h-4 w-4" />
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    className="inline-flex items-center gap-1 text-sm text-destructive hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex h-11 items-center rounded-full border border-border bg-background px-4 text-sm text-muted-foreground disabled:opacity-50"
          >
            上一页
          </button>
          <span className="inline-flex h-11 items-center rounded-full border border-border bg-muted/70 px-4 text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-11 items-center rounded-full border border-border bg-background px-4 text-sm text-muted-foreground disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
