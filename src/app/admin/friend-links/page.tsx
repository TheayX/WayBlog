'use client';

import { ExternalLink, PencilLine, Trash2, Waypoints } from 'lucide-react';
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName('');
    setUrl('');
    setAvatar('');
    setDescription('');
    setSortOrder(0);
    setEditingId(null);
    setComposerOpen(false);
  }

  function startEdit(link: AdminFriendLinkItem) {
    setEditingId(link.id);
    setComposerOpen(true);
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
      <PageIntro
        eyebrow="Friend Links"
        title="友链管理"
        description="友链页更接近推荐列表，除了名称和地址，也要维护描述和排序权重，便于前台统一呈现。"
      />

      <AdminFormPanel
        title={editingId ? '编辑友链' : '新建友链'}
        description="友链页更接近推荐列表，除了名称和地址，也要维护描述和排序权重。"
        headerAction={
          !editingId ? (
            <AdminComposerActions
              open={composerOpen}
              saving={saving}
              itemLabel="友链"
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
                onChange={(e) => setName(e.target.value)}
                placeholder="站点名称"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="图标 URL（可选）"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述（可选）"
                className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                placeholder="排序权重"
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

      <AdminResourceListState loading={loading} empty={links.length === 0} emptyText="暂无友链">
        <section className="page-frame divide-y divide-border">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Waypoints className="h-4 w-4 text-accent" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {link.name}
                  </a>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {link.description || '暂无描述'} · 排序 {link.sortOrder}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(link)}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <PencilLine className="h-4 w-4" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(link.id, link.name)}
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
