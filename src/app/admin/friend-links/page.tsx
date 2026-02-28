'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  description: string | null;
  sortOrder: number;
}

export default function AdminFriendLinksPage() {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [avatar, setAvatar] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLinks = useCallback(() => {
    setLoading(true);
    fetch('/api/friend-links')
      .then((r) => r.json())
      .then((res) => setLinks(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  function resetForm() {
    setName(''); setUrl(''); setAvatar(''); setDescription(''); setSortOrder(0); setEditingId(null);
  }

  function startEdit(link: FriendLink) {
    setEditingId(link.id);
    setName(link.name);
    setUrl(link.url);
    setAvatar(link.avatar || '');
    setDescription(link.description || '');
    setSortOrder(link.sortOrder);
  }

  async function handleSave() {
    if (!name.trim() || !url.trim()) {
      toast.error('名称和 URL 不能为空');
      return;
    }
    setSaving(true);

    const body = {
      name: name.trim(),
      url: url.trim(),
      avatar: avatar.trim() || null,
      description: description.trim() || null,
      sortOrder,
    };

    const endpoint = editingId ? `/api/friend-links/${editingId}` : '/api/friend-links';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
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

    toast.success(editingId ? '友链已更新' : '友链已创建');
    resetForm();
    fetchLinks();
  }

  async function handleDelete(id: string, linkName: string) {
    if (!confirm(`确定删除友链「${linkName}」？`)) return;
    const res = await fetch(`/api/friend-links/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('友链已删除');
      if (editingId === id) resetForm();
      fetchLinks();
    } else {
      toast.error('删除失败');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">友链管理</h1>

      {/* 表单 */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-medium">{editingId ? '编辑友链' : '新建友链'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="站点名称" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="图标 URL（可选）" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述（可选）" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="排序权重" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {editingId ? '更新' : '创建'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          )}
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : links.length === 0 ? (
        <p className="text-muted-foreground">暂无友链</p>
      ) : (
        <div className="rounded-lg border border-border">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {link.name}
                </a>
                {link.description && <span className="ml-2 text-xs text-muted-foreground">— {link.description}</span>}
                <span className="ml-2 text-xs text-muted-foreground">(排序: {link.sortOrder})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(link)} className="text-sm text-primary hover:underline">编辑</button>
                <button onClick={() => handleDelete(link.id, link.name)} className="text-sm text-destructive hover:underline">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

