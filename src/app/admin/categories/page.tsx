'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => setCategories(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchCategories, 0);
    return () => clearTimeout(timeout);
  }, [fetchCategories]);

  function resetForm() {
    setName('');
    setSlug('');
    setDescription('');
    setEditingId(null);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
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
    const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || '保存失败');
      return;
    }

    toast.success(editingId ? '分类已更新' : '分类已创建');
    resetForm();
    fetchCategories();
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`确定删除分类「${catName}」？文章将变为未分类。`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('分类已删除');
      if (editingId === id) resetForm();
      fetchCategories();
    } else {
      toast.error('删除失败');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">分类管理</h1>

      {/* 表单 */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-medium">{editingId ? '编辑分类' : '新建分类'}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!editingId) setSlug(slugify(e.target.value));
            }}
            placeholder="分类名称"
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
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）"
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
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground">暂无分类</p>
      ) : (
        <div className="rounded-lg border border-border">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <div>
                <span className="font-medium">{cat.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">/{cat.slug}</span>
                {cat.description && <span className="ml-2 text-xs text-muted-foreground">— {cat.description}</span>}
                <span className="ml-2 text-xs text-muted-foreground">({cat.postCount} 篇)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(cat)} className="text-sm text-primary hover:underline">编辑</button>
                <button onClick={() => handleDelete(cat.id, cat.name)} className="text-sm text-destructive hover:underline">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

