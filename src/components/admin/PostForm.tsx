'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AiSuggestionDrawer } from '@/components/admin/AiSuggestionDrawer';
import { usePostAiAssistant } from '@/components/admin/use-post-ai-assistant';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import type { AdminPostEditorData } from '@/lib/posts/queries';
import { slugify } from '@/lib/utils';

/**
 * 管理后台文章编辑表单。
 *
 * 负责聚合文章基础字段编辑、Markdown 预览、图片插入和 AI 建议应用流程。
 * 这里刻意将保存逻辑、Slug 生成约束与 AI 辅助状态收敛在同一处，避免管理后台
 * 在“人工编辑 / AI 覆盖 / 草稿发布”三条路径之间出现状态分叉。
 */
interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface Tag {
  id: string;
  name: string;
  slug?: string;
}

interface PostFormProps {
  initialData?: AdminPostEditorData;
  isEdit?: boolean;
}

export function PostForm({ initialData, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [status] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT');
  const [pinned, setPinned] = useState(initialData?.pinned || false);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const {
    aiLoading,
    aiOpen,
    aiResult,
    requestAiSuggestions,
    requestFieldAi,
    applyFieldSuggestion,
    applyAllAi,
    setAiOpen,
    getMatchedCategoryId,
  } = usePostAiAssistant({
    title,
    slug,
    content,
    excerpt,
    categoryId,
    selectedTagIds,
    categories,
    tags,
    setTitle,
    setSlug,
    setContent,
    setExcerpt,
    setCategoryId,
    setSelectedTagIds,
    setSlugManuallyEdited,
  });

  const fetchMetadata = useCallback(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
    ]).then(([catRes, tagRes]) => {
      setCategories(catRes.data || []);
      setTags(tagRes.data || []);
    });
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (!slugManuallyEdited && !isEdit) {
      setSlug(slugify(newTitle));
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleUploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        toast.error('图片上传失败');
        return;
      }

      const { data } = await res.json();
      const textarea = document.getElementById('content-editor') as HTMLTextAreaElement | null;

      if (textarea) {
        const start = textarea.selectionStart;
        const before = content.slice(0, start);
        const after = content.slice(start);
        setContent(`${before}![${file.name}](${data.url})${after}`);
      } else {
        setContent((prev) => `${prev}\n![${file.name}](${data.url})`);
      }

      toast.success('图片已上传并插入正文');
    };
    input.click();
  }

  async function handleSave(saveStatus: 'DRAFT' | 'PUBLISHED') {
    if (!title.trim()) {
      toast.error('标题不能为空');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug 不能为空');
      return;
    }

    setSaving(true);

    const body = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      excerpt: excerpt.trim() || null,
      coverImage: coverImage.trim() || null,
      status: saveStatus,
      pinned,
      categoryId: categoryId || null,
      tagIds: selectedTagIds,
    };

    // 提交前统一做最小归一化，避免把空字符串写入后端，减少 Prisma 层判空分支。
    const url = isEdit ? `/api/posts/${initialData?.id}` : '/api/posts';
    const method = isEdit ? 'PUT' : 'POST';

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

    toast.success(saveStatus === 'PUBLISHED' ? '文章已发布' : '草稿已保存');
    router.push('/admin/posts');
    router.refresh();
  }

  const matchedCategoryId = aiResult ? getMatchedCategoryId(aiResult) : '';

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="文章标题"
            className="w-full border-b border-border bg-transparent pb-2 text-2xl font-bold outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={requestAiSuggestions}
            disabled={aiLoading}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {aiLoading ? 'AI 处理中...' : 'AI 优化'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/posts/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^[a-z0-9-]+$/.test(val)) {
                setSlug(val);
                setSlugManuallyEdited(true);
              } else {
                toast.warning('Slug 只能包含小写字母、数字和连字符');
              }
            }}
            placeholder="article-slug"
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <FieldAiButton label="标题" loading={aiLoading} onClick={() => requestFieldAi('title')} />
          <FieldAiButton label="Slug" loading={aiLoading} onClick={() => requestFieldAi('slug')} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Markdown 编辑</label>
                <FieldAiButton
                  label="正文"
                  loading={aiLoading}
                  onClick={() => requestFieldAi('content')}
                />
              </div>
              <button
                type="button"
                onClick={handleUploadImage}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                插入图片
              </button>
            </div>
            <textarea
              id="content-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此编写 Markdown 内容..."
              className="h-125 w-full resize-none rounded-md border border-border bg-background p-4 font-mono text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">预览</label>
            <div className="h-125 overflow-y-auto rounded-md border border-border p-4">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-muted-foreground">开始编写内容以预览...</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium">摘要</label>
              <FieldAiButton
                label="摘要"
                loading={aiLoading}
                onClick={() => requestFieldAi('excerpt')}
              />
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要（可选，留空时可通过 AI 生成）"
              rows={3}
              className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">封面图 URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="/uploads/2026-02/cover.webp"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium">分类</label>
              <FieldAiButton
                label="分类"
                loading={aiLoading}
                onClick={() => requestFieldAi('category')}
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              置顶文章
            </label>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium">标签</label>
            <FieldAiButton
              label="标签"
              loading={aiLoading}
              onClick={() => requestFieldAi('tags')}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {tag.name}
              </button>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">暂无标签，请先到标签管理创建</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-6">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            保存草稿
          </button>
          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isEdit && status === 'PUBLISHED' ? '更新发布' : '发布文章'}
          </button>
          <button
            onClick={() => router.back()}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            取消
          </button>
        </div>
      </div>

      <AiSuggestionDrawer
        open={aiOpen}
        result={aiResult}
        matchedCategoryId={matchedCategoryId}
        onClose={() => setAiOpen(false)}
        onApplyField={(field) => {
          if (!aiResult) return;
          applyFieldSuggestion(field, aiResult);
        }}
        onApplyAll={applyAllAi}
      />
    </>
  );
}

function FieldAiButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      {loading ? '处理中...' : `${label} AI`}
    </button>
  );
}
