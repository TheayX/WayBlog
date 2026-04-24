'use client';

import { FolderTree, PencilLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AdminComposerActions,
  AdminFormActions,
  AdminFormPanel,
  AdminResourceListState,
} from '@/components/admin/AdminCrudLayout';
import { PageIntro } from '@/components/ui/PageIntro';
import { useAdminResourceList } from '@/components/admin/use-admin-resource-list';
import { deleteAdminResource, saveAdminResource } from '@/lib/admin/client';
import { slugify } from '@/lib/utils';
import type { AdminCategoryItem } from '@/types';

/**
 * 管理后台分类管理页。
 *
 * 负责分类的创建、编辑与删除表单交互；
 * 页面只维护输入状态，真正的唯一性校验与持久化仍交给分类 API 处理。
 */
export default function AdminCategoriesPage() {
  const {
    items: categories,
    loading,
    refresh: fetchCategories,
  } = useAdminResourceList<AdminCategoryItem>('/api/categories');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName('');
    setSlug('');
    setDescription('');
    setEditingId(null);
    setComposerOpen(false);
  }

  function startEdit(cat: AdminCategoryItem) {
    setEditingId(cat.id);
    setComposerOpen(true);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) {
      toast.error('名称和 Slug 不能为空');
      return;
    }
    setSaving(true);

    const body = { name: name.trim(), slug: slug.trim(), description: description.trim() || null };
    const result = await saveAdminResource({
      endpoint: '/api/categories',
      editingId,
      body,
    });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(editingId ? '分类已更新' : '分类已创建');
    resetForm();
    fetchCategories();
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`确定删除分类「${catName}」？文章将变为未分类。`)) return;
    const deleted = await deleteAdminResource('/api/categories', id);
    if (deleted) {
      toast.success('分类已删除');
      if (editingId === id) resetForm();
      fetchCategories();
    } else {
      toast.error('删除失败');
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Categories"
        title="分类管理"
        description="分类承担公开页主题聚合职责，建议保持语义稳定，并避免频繁改名影响内容组织。"
      />

      <AdminFormPanel
        title={editingId ? '编辑分类' : '新建分类'}
        description="分类承担公开页主题聚合职责，建议保持语义稳定。"
        headerAction={
          !editingId ? (
            <AdminComposerActions
              open={composerOpen}
              saving={saving}
              itemLabel="分类"
              onOpen={() => setComposerOpen(true)}
              onSubmit={handleSave}
              onCollapse={resetForm}
            />
          ) : null
        }
      >
        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            editingId || composerOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0">
            <div className="grid gap-3 pt-1 md:grid-cols-3">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) setSlug(slugify(e.target.value));
                }}
                placeholder="分类名称"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <input
                value={slug}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[a-z0-9-]+$/.test(val)) {
                    setSlug(val);
                  } else {
                    toast.warning('Slug 只能包含小写字母、数字和连字符 (不支持中文/特殊字符)');
                  }
                }}
                placeholder="slug"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述（可选）"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>
            {editingId && (
              <AdminFormActions
                editing={Boolean(editingId)}
                saving={saving}
                onSave={handleSave}
                onCancel={resetForm}
              />
            )}
          </div>
        </div>
      </AdminFormPanel>

      <AdminResourceListState
        loading={loading}
        empty={categories.length === 0}
        emptyText="暂无分类"
      >
        <section className="page-frame divide-y divide-border">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-accent" />
                  <span className="text-base font-medium text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">/{cat.slug}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {cat.description || '暂无描述'} · {cat.postCount} 篇文章
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(cat)}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <PencilLine className="h-4 w-4" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="inline-flex items-center gap-1 text-sm text-destructive hover:underline"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </section>
      </AdminResourceListState>
    </div>
  );
}
