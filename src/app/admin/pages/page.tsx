'use client';

import { FilePlus2, FileText, PencilLine, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AdminResourceListState,
  adminInlineActionClassName,
  adminInlineDangerActionClassName,
  adminPrimaryActionClassName,
} from '@/components/admin/AdminCrudLayout';
import { useAdminResourceList } from '@/components/admin/use-admin-resource-list';
import { PageIntro } from '@/components/ui/PageIntro';
import { deleteAdminResource } from '@/lib/admin/client';
import { formatDateShort } from '@/lib/utils';
import type { AdminPageItem } from '@/types';

/**
 * 管理后台单页管理页。
 *
 * 单页会自动进入前台“页面”下拉，数量通常不多；
 * 列表页重点是快速识别标题、slug 与排序值，便于直接维护公开入口。
 */
export default function AdminPagesPage() {
  const { items: pages, loading, refresh } = useAdminResourceList<AdminPageItem>(
    '/api/admin/pages',
  );

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定删除单页「${title}」？`)) return;

    const deleted = await deleteAdminResource('/api/admin/pages', id);
    if (deleted) {
      toast.success('单页已删除');
      refresh();
    } else {
      toast.error('删除失败');
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pages"
        title="单页管理"
        description="这里用于维护会自动出现在前台“页面”下拉中的独立页面。与文章不同，单页更强调稳定路由和长期可维护性。"
        aside={
          <div className="rounded-[1.75rem] border border-border bg-primary px-6 py-6 text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
              Current
            </p>
            <p className="mt-4 text-sm text-primary-foreground/80">当前单页数量</p>
            <p className="editorial-title mt-2 text-5xl font-semibold">{pages.length}</p>
            <p className="mt-5 text-sm leading-7 text-primary-foreground/80">
              推荐把关于、简历、项目说明等低频更新内容统一归入单页，并通过排序控制前台菜单顺序。
            </p>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="page-frame px-5 py-5">
          <p className="text-sm text-muted-foreground">维护建议</p>
          <p className="mt-2 text-base font-medium text-foreground">
            路由稳定优先，再配合排序值控制前台“页面”下拉中的展示顺序。
          </p>
        </div>
        <div className="page-frame flex items-center justify-between gap-5 px-5 py-5">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">快速操作</p>
            <p className="mt-2 text-base font-medium text-foreground">创建一页新内容</p>
          </div>
          <Link href="/admin/pages/new" className={`shrink-0 ${adminPrimaryActionClassName}`}>
            <FilePlus2 className="h-4 w-4" />
            新建单页
          </Link>
        </div>
      </section>

      <AdminResourceListState loading={loading} empty={pages.length === 0} emptyText="暂无单页">
        <section className="page-frame overflow-hidden">
          <div className="grid gap-4 border-b border-border bg-muted/40 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid-cols-[minmax(0,2fr)_7rem_10rem_10rem_8rem]">
            <span className="pl-5">单页</span>
            <span className="w-full text-center">排序</span>
            <span className="w-full text-center">Slug</span>
            <span className="w-full text-center">更新时间</span>
            <span className="w-full text-center">操作</span>
          </div>
          <div className="divide-y divide-border">
            {pages.map((page) => (
              <div
                key={page.id}
                className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,2fr)_7rem_10rem_10rem_8rem] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <span className="truncate text-base font-medium text-foreground">
                      {page.title}
                    </span>
                  </div>
                </div>
                <div className="w-full text-center text-sm text-muted-foreground">
                  {page.sortOrder}
                </div>
                <div className="w-full text-center text-sm text-muted-foreground">/{page.slug}</div>
                <div className="w-full text-center text-sm text-muted-foreground">
                  {formatDateShort(page.updatedAt)}
                </div>
                <div className="flex w-full items-center justify-center gap-3">
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
                    className={adminInlineActionClassName}
                  >
                    <PencilLine className="h-4 w-4" />
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(page.id, page.title)}
                    className={adminInlineDangerActionClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AdminResourceListState>
    </div>
  );
}
