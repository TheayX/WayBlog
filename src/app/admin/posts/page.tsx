'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
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

    fetchAdminCollection<{ data?: AdminPostListItem[]; total?: number }>(`/api/admin/posts?${params}`)
      .then((res) => {
        setPosts(res.data || []);
        setTotal(res.total || 0);
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

    const deleted = await deleteAdminResource('/api/posts', id);
    if (deleted) {
      toast.success('文章已删除');
      fetchPosts();
    } else {
      toast.error('删除失败');
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          + 新建文章
        </Link>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        {['', 'PUBLISHED', 'DRAFT'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              statusFilter === s
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {s === '' ? '全部' : s === 'PUBLISHED' ? '已发布' : '草稿'}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          共 {total} 篇
        </span>
      </div>

      {/* 文章表格 */}
      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">暂无文章</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">标题</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">分类</th>
                <th className="px-4 py-3 text-left font-medium">浏览量</th>
                <th className="px-4 py-3 text-left font-medium">日期</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.pinned && <span title="置顶">📌</span>}
                      <span className="font-medium">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.category?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{post.viewCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.publishedAt
                      ? formatDateShort(post.publishedAt)
                      : formatDateShort(post.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-destructive hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

