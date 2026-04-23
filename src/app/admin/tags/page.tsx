'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminResourceList } from '@/components/admin/use-admin-resource-list';
import { deleteAdminResource, saveAdminResource } from '@/lib/admin/client';
import { slugify } from '@/lib/utils';

/**
 * 管理后台标签管理页。
 *
 * 提供标签的 CRUD 表单与列表视图，并在新建场景下根据名称自动生成 slug；
 * 页面侧只做轻量输入约束，最终校验仍以标签 API 为准。
 */
interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export default function AdminTagsPage() {
  const {
    items: tags,
    loading,
    refresh: fetchTags,
  } = useAdminResourceList<Tag>('/api/tags');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName('');
    setSlug('');
    setEditingId(null);
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
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
      <h1 className="text-2xl font-bold">标签管理</h1>

      {/* 表单 */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-medium">{editingId ? '编辑标签' : '新建标签'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!editingId) setSlug(slugify(e.target.value));
            }}
            placeholder="标签名称"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {editingId ? '更新' : '创建'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
              取消
            </button>
          )}
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : tags.length === 0 ? (
        <p className="text-muted-foreground">暂无标签</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5"
            >
              <span className="text-sm">{tag.name}</span>
              <span className="text-xs text-muted-foreground">({tag.postCount})</span>
              <button onClick={() => startEdit(tag)} className="text-xs text-primary hover:underline">编辑</button>
              <button onClick={() => handleDelete(tag.id, tag.name)} className="text-xs text-destructive hover:underline">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

