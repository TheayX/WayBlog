'use client';

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

function FieldAiButton({ label, loading, onClick }: FieldAiButtonProps) {
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
    <>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="文章标题"
          className="w-full border-b border-border bg-transparent pb-2 text-2xl font-bold outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={onOptimizeAll}
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
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="article-slug"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <FieldAiButton label="标题" loading={aiLoading} onClick={onOptimizeTitle} />
        <FieldAiButton label="Slug" loading={aiLoading} onClick={onOptimizeSlug} />
      </div>
    </>
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
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Markdown 编辑</label>
            <FieldAiButton label="正文" loading={aiLoading} onClick={onOptimizeContent} />
          </div>
          <button
            type="button"
            onClick={onUploadImage}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            插入图片
          </button>
        </div>
        <textarea
          id="content-editor"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
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
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="block text-sm font-medium">摘要</label>
          <FieldAiButton label="摘要" loading={aiLoading} onClick={onOptimizeExcerpt} />
        </div>
        <textarea
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
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
          onChange={(e) => onCoverImageChange(e.target.value)}
          placeholder="/uploads/2026-02/cover.webp"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
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
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium">分类</label>
            <FieldAiButton label="分类" loading={aiLoading} onClick={onOptimizeCategory} />
          </div>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">无分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
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

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="block text-sm font-medium">标签</label>
          <FieldAiButton label="标签" loading={aiLoading} onClick={onOptimizeTags} />
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
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
    </>
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
    <div className="flex items-center gap-3 border-t border-border pt-6">
      <button
        onClick={onSaveDraft}
        disabled={saving}
        className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        保存草稿
      </button>
      <button
        onClick={onPublish}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
