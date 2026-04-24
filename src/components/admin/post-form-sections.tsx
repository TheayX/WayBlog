'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import type {
  PostCategoryOption,
  PostTagOption,
} from '@/components/admin/use-post-editor-metadata';

interface FieldAiButtonProps {
  label: string;
  loading: boolean;
  onClick: () => void;
}

interface TitleSlugSectionProps {
  title: string;
  slug: string;
  aiLoading: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onOptimizeAll: () => void;
  onOptimizeTitle: () => void;
  onOptimizeSlug: () => void;
}

interface ContentEditorSectionProps {
  content: string;
  aiLoading: boolean;
  onContentChange: (value: string) => void;
  onUploadImage: () => void;
  onOptimizeContent: () => void;
}

interface SummaryCoverSectionProps {
  excerpt: string;
  coverImage: string;
  aiLoading: boolean;
  onExcerptChange: (value: string) => void;
  onCoverImageChange: (value: string) => void;
  onOptimizeExcerpt: () => void;
}

interface TaxonomySectionProps {
  categories: PostCategoryOption[];
  tags: PostTagOption[];
  categoryId: string;
  selectedTagIds: string[];
  pinned: boolean;
  aiLoading: boolean;
  onCategoryChange: (value: string) => void;
  onPinnedChange: (value: boolean) => void;
  onToggleTag: (tagId: string) => void;
  onOptimizeCategory: () => void;
  onOptimizeTags: () => void;
}

interface ActionBarProps {
  saving: boolean;
  publishButtonLabel: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
}

interface CategorySelectProps {
  categories: PostCategoryOption[];
  value: string;
  onChange: (value: string) => void;
}

function FieldAiButton({ label, loading, onClick }: FieldAiButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-xs text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-50"
    >
      {loading ? '处理中...' : `${label} AI`}
    </button>
  );
}

function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedCategory = categories.find((category) => category.id === value);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    // 下拉展开后统一由文档级事件兜底关闭，避免点击卡片空白区域时状态残留。
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-primary"
      >
        <span className={selectedCategory ? '' : 'text-muted-foreground'}>
          {selectedCategory?.name || '无分类'}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="分类选择"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[1.25rem] border border-border bg-background shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors ${
              value === ''
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-muted/60'
            }`}
          >
            无分类
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="option"
              aria-selected={value === category.id}
              onClick={() => {
                onChange(category.id);
                setOpen(false);
              }}
              className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors ${
                value === category.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted/60'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 标题与 slug 输入区。
 *
 * 这里集中放置文章主标识字段和对应的 AI 入口，
 * 避免表单顶部的标题、slug、全文优化按钮在主组件中继续堆叠。
 */
export function TitleSlugSection({
  title,
  slug,
  aiLoading,
  onTitleChange,
  onSlugChange,
  onOptimizeAll,
  onOptimizeTitle,
  onOptimizeSlug,
}: TitleSlugSectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="eyebrow">Identity</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">标题与链接</h2>
        </div>
        <button
          type="button"
          onClick={onOptimizeAll}
          disabled={aiLoading}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {aiLoading ? 'AI 处理中...' : 'AI 优化整篇'}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="relative">
          <div className="absolute right-0 top-0 z-10">
            <FieldAiButton label="标题" loading={aiLoading} onClick={onOptimizeTitle} />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="文章标题"
            className="editorial-title w-full border-b border-border bg-transparent pb-3 pr-24 text-3xl font-semibold outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-background px-4">
            <span className="text-sm text-muted-foreground">/posts/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="article-slug"
              className="h-12 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <FieldAiButton label="Slug" loading={aiLoading} onClick={onOptimizeSlug} />
        </div>
      </div>
    </section>
  );
}

/**
 * Markdown 编辑与预览区。
 *
 * 正文是整个文章编辑页最重的交互区域，单独拆出后可以更清楚地隔离正文输入、
 * 图片插入和预览的配合关系。
 */
export function ContentEditorSection({
  content,
  aiLoading,
  onContentChange,
  onUploadImage,
  onOptimizeContent,
}: ContentEditorSectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="eyebrow">Content</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">正文编辑</h2>
        </div>
        <FieldAiButton label="正文" loading={aiLoading} onClick={onOptimizeContent} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex min-h-6 flex-wrap items-center justify-between gap-3">
            <label htmlFor="content-editor" className="ml-5 text-sm font-medium text-foreground">
              Markdown 编辑
            </label>
            <button
              type="button"
              onClick={onUploadImage}
              className="mr-5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              插入图片
            </button>
          </div>
          <textarea
            id="content-editor"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="在此编写 Markdown 内容..."
            className="h-[38rem] w-full resize-none rounded-[1.5rem] border border-border bg-background p-4 font-mono text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <div className="flex min-h-6 items-center">
            <label className="ml-5 text-sm font-medium text-foreground">预览</label>
          </div>
          <div className="h-[38rem] overflow-y-auto rounded-[1.5rem] border border-border bg-background p-4">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-sm text-muted-foreground">开始编写内容以预览...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 摘要与封面字段区。
 */
export function SummaryCoverSection({
  excerpt,
  coverImage,
  aiLoading,
  onExcerptChange,
  onCoverImageChange,
  onOptimizeExcerpt,
}: SummaryCoverSectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="mb-4">
        <p className="eyebrow">Summary</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">摘要与封面</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <FieldAiButton label="摘要" loading={aiLoading} onClick={onOptimizeExcerpt} />
          </div>
          <textarea
            value={excerpt}
            onChange={(e) => onExcerptChange(e.target.value)}
            placeholder="文章摘要（可选，留空时可通过 AI 生成）"
            rows={4}
            className="w-full rounded-[1.5rem] border border-border bg-background p-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">封面图 URL</label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => onCoverImageChange(e.target.value)}
            placeholder="/uploads/2026-02/cover.webp"
            className="h-12 w-full rounded-[1.5rem] border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * 分类、标签与置顶状态区。
 */
export function TaxonomySection({
  categories,
  tags,
  categoryId,
  selectedTagIds,
  pinned,
  aiLoading,
  onCategoryChange,
  onPinnedChange,
  onToggleTag,
  onOptimizeCategory,
  onOptimizeTags,
}: TaxonomySectionProps) {
  return (
    <section className="page-frame z-10 overflow-visible px-5 py-5">
      <div className="mb-4">
        <p className="eyebrow">Metadata</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">分类、标签与状态</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <FieldAiButton label="分类" loading={aiLoading} onClick={onOptimizeCategory} />
          </div>
          <div className="relative z-20">
            <CategorySelect categories={categories} value={categoryId} onChange={onCategoryChange} />
          </div>
        </div>

        <div className="flex items-end gap-4">
          <label className="inline-flex h-12 items-center gap-2 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => onPinnedChange(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            置顶文章
          </label>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <FieldAiButton label="标签" loading={aiLoading} onClick={onOptimizeTags} />
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground'
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
    </section>
  );
}

/**
 * 表单底部操作栏。
 */
export function PostFormActionBar({
  saving,
  publishButtonLabel,
  onSaveDraft,
  onPublish,
  onCancel,
}: ActionBarProps) {
  return (
    <div className="page-frame flex flex-wrap items-center gap-3 px-5 py-4">
      <button
        onClick={onSaveDraft}
        disabled={saving}
        className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-50"
      >
        保存草稿
      </button>
      <button
        onClick={onPublish}
        disabled={saving}
        className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {publishButtonLabel}
      </button>
      <button
        onClick={onCancel}
        className="ml-auto text-sm text-muted-foreground hover:text-foreground"
      >
        取消
      </button>
    </div>
  );
}
