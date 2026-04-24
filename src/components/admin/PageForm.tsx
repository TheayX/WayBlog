'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { saveAdminResource } from '@/lib/admin/client';
import { slugify } from '@/lib/utils';

interface PageFormInitialData {
  id: string;
  slug: string;
  title: string;
  content: string;
}

interface PageFormProps {
  initialData?: PageFormInitialData;
  isEdit?: boolean;
}

/**
 * 后台单页表单。
 *
 * 单页当前只服务 about 这类少量固定入口，因此维持最小字段集合：
 * 标题、slug 和正文。表单保存后统一回到单页列表，避免分叉出额外的编辑流。
 */
export function PageForm({ initialData, isEdit = false }: PageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !slug.trim()) {
      toast.error('标题和 Slug 不能为空');
      return;
    }

    setSaving(true);

    const result = await saveAdminResource({
      endpoint: '/api/pages',
      editingId: initialData?.id || null,
      body: {
        title: title.trim(),
        slug: slug.trim(),
        content,
      },
    });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? '单页已更新' : '单页已创建');
    router.push('/admin/pages');
    router.refresh();
  }

  return (
    <section className="page-frame px-5 py-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground">标题</span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!isEdit) setSlug(slugify(event.target.value));
            }}
            placeholder="例如：关于"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground">Slug</span>
          <input
            value={slug}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '' || /^[a-z0-9-]+$/.test(value)) {
                setSlug(value);
              } else {
                toast.warning('Slug 只能包含小写字母、数字和连字符');
              }
            }}
            placeholder="about"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-medium text-foreground">正文</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={18}
          placeholder="输入 Markdown 内容"
          className="min-h-[26rem] w-full rounded-[1.5rem] border border-border bg-background px-4 py-4 text-sm leading-7 outline-none focus:border-primary"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? '保存中...' : isEdit ? '保存修改' : '创建单页'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/pages')}
          className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          返回列表
        </button>
      </div>
    </section>
  );
}
