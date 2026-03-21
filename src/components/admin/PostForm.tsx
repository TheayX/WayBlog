'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import type { AiOptimizeResult } from '@/lib/ai/types';

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

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  pinned: boolean;
  categoryId: string;
  tagIds: string[];
}

interface PostFormProps {
  initialData?: PostData;
  isEdit?: boolean;
}

type AiField = 'title' | 'slug' | 'content' | 'excerpt' | 'category' | 'tags';

export function PostForm({ initialData, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiOptimizeResult | null>(null);
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

  function getMatchedCategoryId(result: AiOptimizeResult) {
    if (!result.categorySuggestion) return '';

    if (result.categorySuggestion.id) {
      return result.categorySuggestion.id;
    }

    const matched = categories.find(
      (item) => item.name.toLowerCase() === result.categorySuggestion?.name.toLowerCase(),
    );

    return matched?.id || '';
  }

  function getMatchedTagIds(result: AiOptimizeResult) {
    const ids = result.tagSuggestions
      .filter((item) => !item.isNew)
      .map((item) => {
        if (item.id) return item.id;
        const matched = tags.find((tag) => tag.name.toLowerCase() === item.name.toLowerCase());
        return matched?.id || '';
      })
      .filter(Boolean);

    return Array.from(new Set(ids));
  }

  function applyAiField(field: AiField, result: AiOptimizeResult) {
    switch (field) {
      case 'title':
        setTitle(result.title);
        break;
      case 'slug':
        setSlug(result.slug);
        setSlugManuallyEdited(true);
        break;
      case 'content':
        setContent(result.content);
        break;
      case 'excerpt':
        setExcerpt(result.excerpt);
        break;
      case 'category': {
        const matchedCategoryId = getMatchedCategoryId(result);
        if (!matchedCategoryId) {
          toast.warning('AI 暂未匹配到现有分类，请手动确认。');
          return;
        }
        setCategoryId(matchedCategoryId);
        break;
      }
      case 'tags': {
        const matchedTagIds = getMatchedTagIds(result);
        if (matchedTagIds.length === 0) {
          toast.warning('AI 暂未匹配到现有标签，请手动确认。');
          return;
        }
        setSelectedTagIds(matchedTagIds);
        break;
      }
    }

    toast.success(`已应用${getFieldLabel(field)}建议`);
  }

  function applyAllAi(result: AiOptimizeResult) {
    setTitle(result.title);
    setSlug(result.slug);
    setSlugManuallyEdited(true);
    setContent(result.content);
    setExcerpt(result.excerpt);

    const matchedCategoryId = getMatchedCategoryId(result);
    if (matchedCategoryId) {
      setCategoryId(matchedCategoryId);
    }

    const matchedTagIds = getMatchedTagIds(result);
    if (matchedTagIds.length > 0) {
      setSelectedTagIds(matchedTagIds);
    }

    toast.success('已应用全部 AI 建议');
  }

  async function requestAiSuggestions(targetField?: AiField) {
    if (!content.trim()) {
      toast.warning('请先填写正文后再使用 AI 功能');
      return;
    }

    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content,
          excerpt: excerpt.trim(),
          categoryId: categoryId || null,
          tagIds: selectedTagIds,
          categories: categories.map((item) => ({ id: item.id, name: item.name })),
          tags: tags.map((item) => ({ id: item.id, name: item.name })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'AI 优化失败');
        return;
      }

      const result = data.data as AiOptimizeResult;
      setAiResult(result);

      if (targetField) {
        applyAiField(targetField, result);
        return;
      }

      setAiOpen(true);
      toast.success('AI 建议已生成');
    } catch (error) {
      console.error(error);
      toast.error('AI 服务调用失败，请检查 Ollama 是否已启动');
    } finally {
      setAiLoading(false);
    }
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
            onClick={() => requestAiSuggestions()}
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
          <FieldAiButton
            label="标题"
            loading={aiLoading}
            onClick={() => requestAiSuggestions('title')}
          />
          <FieldAiButton
            label="Slug"
            loading={aiLoading}
            onClick={() => requestAiSuggestions('slug')}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Markdown 编辑</label>
                <FieldAiButton
                  label="正文"
                  loading={aiLoading}
                  onClick={() => requestAiSuggestions('content')}
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
                onClick={() => requestAiSuggestions('excerpt')}
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
                onClick={() => requestAiSuggestions('category')}
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
              onClick={() => requestAiSuggestions('tags')}
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

      {aiOpen && aiResult && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">AI 优化建议</h2>
                <p className="text-sm text-muted-foreground">
                  请先查看建议内容，再决定是否应用到表单。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {aiResult.warnings.length > 0 && (
                <section className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
                  <h3 className="mb-2 text-sm font-medium text-amber-700">提醒</h3>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {aiResult.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              )}

              <SuggestionSection
                title="标题建议"
                actionLabel="应用标题"
                onApply={() => applyAiField('title', aiResult)}
              >
                <p className="text-sm leading-6">{aiResult.title}</p>
              </SuggestionSection>

              <SuggestionSection
                title="Slug 建议"
                actionLabel="应用 Slug"
                onApply={() => applyAiField('slug', aiResult)}
              >
                <p className="font-mono text-sm leading-6">{aiResult.slug}</p>
              </SuggestionSection>

              <SuggestionSection
                title="摘要建议"
                actionLabel="应用摘要"
                onApply={() => applyAiField('excerpt', aiResult)}
              >
                <p className="text-sm leading-6">{aiResult.excerpt || 'AI 未生成摘要建议'}</p>
              </SuggestionSection>

              <SuggestionSection
                title="正文建议"
                actionLabel="应用正文"
                onApply={() => applyAiField('content', aiResult)}
              >
                <div className="rounded-md border border-border p-4">
                  <MarkdownRenderer content={aiResult.content} />
                </div>
              </SuggestionSection>

              <SuggestionSection
                title="分类建议"
                actionLabel="应用分类"
                onApply={() => applyAiField('category', aiResult)}
              >
                <p className="text-sm leading-6">
                  {aiResult.categorySuggestion
                    ? `${aiResult.categorySuggestion.name}${aiResult.categorySuggestion.reason ? `：${aiResult.categorySuggestion.reason}` : ''}`
                    : 'AI 暂未给出分类建议'}
                </p>
              </SuggestionSection>

              <SuggestionSection
                title="标签建议"
                actionLabel="应用标签"
                onApply={() => applyAiField('tags', aiResult)}
              >
                <div className="flex flex-wrap gap-2">
                  {aiResult.tagSuggestions.length > 0 ? (
                    aiResult.tagSuggestions.map((tag) => (
                      <span
                        key={`${tag.id || tag.name}-${String(tag.isNew)}`}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          tag.isNew
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                            : 'border-primary/30 bg-primary/10 text-primary'
                        }`}
                      >
                        {tag.name}
                        {tag.isNew ? '（建议新增）' : ''}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">AI 暂未给出标签建议</p>
                  )}
                </div>
              </SuggestionSection>
            </div>

            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => applyAllAi(aiResult)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                全部应用
              </button>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      )}
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

function SuggestionSection({
  title,
  actionLabel,
  onApply,
  children,
}: {
  title: string;
  actionLabel: string;
  onApply: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">{title}</h3>
        <button
          type="button"
          onClick={onApply}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function getFieldLabel(field: AiField) {
  switch (field) {
    case 'title':
      return '标题';
    case 'slug':
      return 'Slug';
    case 'content':
      return '正文';
    case 'excerpt':
      return '摘要';
    case 'category':
      return '分类';
    case 'tags':
      return '标签';
  }
}
