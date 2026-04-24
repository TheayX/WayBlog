'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  onOpenAi: () => void;
}

interface ContentEditorSectionProps {
  content: string;
  aiLoading: boolean;
  onContentChange: (value: string) => void;
  onUploadImage: () => void;
  onOpenAi: () => void;
}

interface SummaryCoverSectionProps {
  excerpt: string;
  coverImage: string;
  aiLoading: boolean;
  onExcerptChange: (value: string) => void;
  onCoverImageChange: (value: string) => void;
  onOpenAi: () => void;
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
  onOpenAi: () => void;
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
  fullWidth?: boolean;
}

interface CategoryDropdownPosition {
  top: number;
  left: number;
  width: number;
}

function SectionAiButton({ label, loading, onClick }: FieldAiButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={loading ? '取消 AI 请求' : `${label} AI`}
      title={loading ? '取消 AI 请求' : `${label} AI`}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background ${
        loading
          ? 'border-primary text-primary'
          : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground'
      }`}
    >
      <Sparkles className="h-4 w-4" />
    </button>
  );
}

/**
 * 分类选择器。
 *
 * 展开面板通过 portal 挂到 body，避免被后台卡片的裁剪和层叠上下文截断；
 * 同时在展开期间同步触发器位置，保证滚动页面后下拉仍能贴着输入框。
 */
function CategorySelect({
  categories,
  value,
  onChange,
  fullWidth = true,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();
  const [dropdownPosition, setDropdownPosition] = useState<CategoryDropdownPosition | null>(null);
  const selectedCategory = categories.find((category) => category.id === value);

  useEffect(() => {
    function updateDropdownPosition() {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

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

    if (open) {
      updateDropdownPosition();
      // 面板挂到 body 后，需要同时监听滚动和窗口尺寸变化，保证位置始终跟随触发器。
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
    }

    // 下拉展开后统一由文档级事件兜底关闭，避免点击卡片空白区域时状态残留。
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 items-center justify-between rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-primary ${
          fullWidth ? 'w-full' : 'min-w-[11rem]'
        }`}
      >
        <span className={selectedCategory ? '' : 'text-muted-foreground'}>
          {selectedCategory?.name || '无分类'}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && dropdownPosition
        ? createPortal(
            <div
              id={listboxId}
              role="listbox"
              aria-label="分类选择"
              className="fixed z-[9999] overflow-hidden rounded-[1.25rem] border border-border bg-background shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * 整篇优化操作条。
 *
 * 入口独立放在表单顶部，避免和区块级 AI 入口混在一起，
 * 让“整篇优化”和“局部填充”形成清晰分层。
 */
export function PostAiToolbar({
  aiLoading,
  onOptimizeAll,
  className,
}: {
  aiLoading: boolean;
  onOptimizeAll: () => void;
  className?: string;
}) {
  return (
    <div className={className ? `flex justify-end ${className}` : 'flex justify-end'}>
      <button
        type="button"
        onClick={onOptimizeAll}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium ${
          aiLoading
            ? 'border border-primary bg-background text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <Sparkles className="h-4 w-4" />
        {aiLoading ? '取消 AI' : 'AI 优化整篇'}
      </button>
    </div>
  );
}

/**
 * 标题与 slug 输入区。
 *
 * 这里集中放置文章主标识字段，并把区块级 AI 收敛到标题区右上角的单一入口，
 * 避免标题、Slug 和整篇优化混成多排按钮后破坏编辑节奏。
 */
export function TitleSlugSection({
  title,
  slug,
  aiLoading,
  onTitleChange,
  onSlugChange,
  onOpenAi,
}: TitleSlugSectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="eyebrow">Identity</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">标题与链接</h2>
        </div>
        <SectionAiButton label="标题与链接" loading={aiLoading} onClick={onOpenAi} />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="文章标题"
            className="editorial-title w-full border-b border-border bg-transparent pb-3 text-3xl font-semibold outline-none focus:border-primary"
          />
        </div>

        <div className="flex">
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
  onOpenAi,
}: ContentEditorSectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="eyebrow">Content</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">正文编辑</h2>
        </div>
        <SectionAiButton label="正文编辑" loading={aiLoading} onClick={onOpenAi} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {/* 左右两列头部保留同一行高，避免编辑框与预览框出现视觉错位。 */}
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
 *
 * 区块内同时承载摘要和封面，但当前 AI 只负责摘要建议；
 * 因此按钮文案只强调摘要，避免用户误以为这里也会自动生成封面图。
 */
export function SummaryCoverSection({
  excerpt,
  coverImage,
  aiLoading,
  onExcerptChange,
  onCoverImageChange,
  onOpenAi,
}: SummaryCoverSectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Summary</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">摘要与封面</h2>
        </div>
        <SectionAiButton label="摘要建议" loading={aiLoading} onClick={onOpenAi} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
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
 *
 * 区块内同时承载分类、标签和置顶状态，但当前 AI 只负责前两者；
 * 因此按钮文案只强调分类与标签，避免把“置顶”误导成 AI 可判断项。
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
  onOpenAi,
}: TaxonomySectionProps) {
  return (
    <section className="page-frame px-5 py-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Metadata</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">分类、标签与状态</h2>
        </div>
        <SectionAiButton label="分类与标签" loading={aiLoading} onClick={onOpenAi} />
      </div>

      {/* 分类与置顶压成一行，让更多空间留给未来可能持续增长的标签区域。 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-fit max-w-full">
          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={onCategoryChange}
            fullWidth={false}
          />
        </div>

        <label className="inline-flex h-12 items-center gap-3 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground">
          <span>置顶文章</span>
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => onPinnedChange(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
        </label>
      </div>

      {/* 标签区单独放大成可扩展面板，避免标签一多就重新挤压上方控件。 */}
      <div className="relative mt-4 min-h-[10rem] rounded-[1.5rem] border border-dashed border-border bg-background px-4 py-4">
        <div className="absolute right-4 top-4">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
            {selectedTagIds.length} / {tags.length}
          </span>
        </div>
        <div className="flex flex-wrap content-start gap-2.5 pr-20">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'border-primary bg-primary/12 text-primary shadow-[0_8px_18px_-14px_rgba(34,58,54,0.65)]'
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
