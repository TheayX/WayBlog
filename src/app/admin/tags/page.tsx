'use client';

import { Hash, PencilLine, Trash2 } from 'lucide-react';
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
import type { AdminTagItem } from '@/types';

/**
 * 管理后台标签管理页。
 *
 * 提供标签的 CRUD 表单与列表视图，并在新建场景下根据名称自动生成 slug；
 * 页面侧只做轻量输入约束，最终校验仍以标签 API 为准。
 */
export default function AdminTagsPage() {
  const {
    items: tags,
    loading,
    refresh: fetchTags,
  } = useAdminResourceList<AdminTagItem>('/api/tags');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName('');
    setSlug('');
    setEditingId(null);
    setComposerOpen(false);
  }

  function startEdit(tag: AdminTagItem) {
    setEditingId(tag.id);
    setComposerOpen(true);
    setName(tag.name);
    setSlug(tag.slug);
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) {
      toast.error('名称和 Slug 不能为空');
      return;
    }
    setSaving(true);

    const body = { name: name.trim(), slug: slug.trim() };
    const result = await saveAdminResource({
      endpoint: '/api/tags',
      editingId,
      body,
    });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(editingId ? '标签已更新' : '标签已创建');
    resetForm();
    fetchTags();
  }

  async function handleDelete(id: string, tagName: string) {
    if (!confirm(`确定删除标签「${tagName}」？`)) return;
    const deleted = await deleteAdminResource('/api/tags', id);
    if (deleted) {
      toast.success('标签已删除');
      if (editingId === id) resetForm();
      fetchTags();
    } else {
      toast.error('删除失败');
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Tags"
        title="标签管理"
        description="标签用于补充主题交叉关系，保持轻量、稳定和可复用，能减少前后台语义漂移。"
      />

      <AdminFormPanel
        title={editingId ? '编辑标签' : '新建标签'}
        description="标签用于补充主题交叉关系，建议保持轻量且可复用。"
        headerAction={
          !editingId ? (
            <AdminComposerActions
              open={composerOpen}
              saving={saving}
              itemLabel="标签"
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
            <div className="grid gap-3 pt-1 md:grid-cols-2">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) setSlug(slugify(e.target.value));
                }}
                placeholder="标签名称"
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

      <AdminResourceListState loading={loading} empty={tags.length === 0} emptyText="暂无标签">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="page-frame flex items-center justify-between gap-3 px-4 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-accent" />
                  <span className="font-medium text-foreground">{tag.name}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  /{tag.slug} · {tag.postCount} 篇文章
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(tag)}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <PencilLine className="h-4 w-4" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
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
