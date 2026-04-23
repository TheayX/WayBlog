'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  AdminFormActions,
  AdminFormPanel,
  AdminResourceListState,
} from '@/components/admin/AdminCrudLayout';
import { useAdminResourceList } from '@/components/admin/use-admin-resource-list';
import { deleteAdminResource, saveAdminResource } from '@/lib/admin/client';
import type { AdminFriendLinkItem } from '@/types';

/**
 * 管理后台友链管理页。
 *
 * 负责友链资料的录入、排序和删除交互；
 * 页面层主要维护表单状态和列表刷新，数据合法性依旧交给友链 API 约束。
 */
export default function AdminFriendLinksPage() {
  const {
    items: links,
    loading,
    refresh: fetchLinks,
  } = useAdminResourceList<AdminFriendLinkItem>('/api/friend-links');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [avatar, setAvatar] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName(''); setUrl(''); setAvatar(''); setDescription(''); setSortOrder(0); setEditingId(null);
  }

  function startEdit(link: AdminFriendLinkItem) {
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

    const result = await saveAdminResource({
      endpoint: '/api/friend-links',
      editingId,
      body,
    });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(editingId ? '友链已更新' : '友链已创建');
    resetForm();
    fetchLinks();
  }

  async function handleDelete(id: string, linkName: string) {
    if (!confirm(`确定删除友链「${linkName}」？`)) return;
    const deleted = await deleteAdminResource('/api/friend-links', id);
    if (deleted) {
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

      <AdminFormPanel title={editingId ? '编辑友链' : '新建友链'}>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="站点名称" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="图标 URL（可选）" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述（可选）" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="排序权重" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <AdminFormActions
          editing={Boolean(editingId)}
          saving={saving}
          onSave={handleSave}
          onCancel={resetForm}
        />
      </AdminFormPanel>

      <AdminResourceListState loading={loading} empty={links.length === 0} emptyText="暂无友链">
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
      </AdminResourceListState>
    </div>
  );
}

