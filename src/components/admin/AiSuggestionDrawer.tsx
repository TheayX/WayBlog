'use client';

import {
  adminCompactSecondaryActionClassName,
  adminPrimarySubmitClassName,
  adminSecondaryActionClassName,
} from '@/components/admin/AdminCrudLayout';
import {
  getTaxonomyLevelHint,
  getTaxonomyLevelLabel,
} from '@/components/admin/post-ai-helpers';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import type {
  AiField,
  AiOptimizeResult,
  AiSelectedTagSuggestion,
  AiSuggestedTagCandidate,
} from '@/lib/ai/types';

interface AiSuggestionDrawerProps {
  open: boolean;
  result: AiOptimizeResult | null;
  matchedCategoryId: string;
  onClose: () => void;
  onApplyField: (field: AiField) => void;
  onApplyAll: () => void;
}

export function AiSuggestionDrawer({
  open,
  result,
  matchedCategoryId,
  onClose,
  onApplyField,
  onApplyAll,
}: AiSuggestionDrawerProps) {
  if (!open || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">AI Review</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">AI 优化建议</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                先看建议内容，再决定应用哪些修改。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {result.warnings.length > 0 && (
            <section className="rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="mb-2 text-sm font-medium text-amber-700">提醒</h3>
              <ul className="space-y-1 text-sm text-amber-700">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          )}

          <SuggestionSection
            title="标题建议"
            actionLabel="应用标题"
            onApply={() => onApplyField('title')}
          >
            <p className="text-sm leading-6">{result.title}</p>
          </SuggestionSection>

          <SuggestionSection
            title="Slug 建议"
            actionLabel="应用 Slug"
            onApply={() => onApplyField('slug')}
          >
            <p className="font-mono text-sm leading-6">{result.slug}</p>
          </SuggestionSection>

          <SuggestionSection
            title="摘要建议"
            actionLabel="应用摘要"
            onApply={() => onApplyField('excerpt')}
          >
            <p className="text-sm leading-6">{result.excerpt || 'AI 未生成摘要建议'}</p>
            {result.excerpt && (
              <p className="text-xs text-muted-foreground">当前摘要长度：{result.excerpt.length} 字</p>
            )}
          </SuggestionSection>

          <SuggestionSection
            title="正文建议"
            actionLabel="应用正文"
            onApply={() => onApplyField('content')}
          >
            <div className="rounded-[1.25rem] border border-border bg-background p-4">
              <MarkdownRenderer content={result.content} />
            </div>
          </SuggestionSection>

          <SuggestionSection
            title="分类建议"
            actionLabel="应用分类"
            onApply={() => onApplyField('category')}
          >
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium">可直接应用的现有分类</p>
                {result.selectedCategory ? (
                  <TaxonomyChip
                    title={result.selectedCategory.name}
                    level={result.selectedCategory.level}
                    reason={result.selectedCategory.reason}
                    tone="existing"
                    extraMeta={matchedCategoryId ? '已命中现有分类' : '需要人工确认映射'}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">没有适合直接应用的现有分类。</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">更贴切的新分类建议</p>
                {result.betterCategorySuggestion ? (
                  <TaxonomyChip
                    title={result.betterCategorySuggestion.name}
                    level={result.betterCategorySuggestion.level}
                    reason={result.betterCategorySuggestion.reason}
                    tone="new"
                    extraMeta="建议新增"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">当前没有更贴切的新分类建议。</p>
                )}
              </div>
            </div>
          </SuggestionSection>

          <SuggestionSection
            title="标签建议"
            actionLabel="应用标签"
            onApply={() => onApplyField('tags')}
          >
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">推荐应用的现有标签</p>
                <div className="flex flex-wrap gap-2">
                  {result.selectedTags.length > 0 ? (
                    result.selectedTags.map((tag) => (
                      <TagSuggestionChip key={`${tag.id || tag.name}-existing`} tag={tag} />
                    ))
                  ) : (
                  <p className="text-sm text-muted-foreground">没有适合直接应用的现有标签。</p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">建议新增的标签</p>
                <div className="flex flex-wrap gap-2">
                  {result.newTagSuggestions.length > 0 ? (
                    result.newTagSuggestions.map((tag) => (
                      <TagSuggestionChip key={`${tag.name}-new`} tag={tag} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">当前没有新增标签建议。</p>
                  )}
                </div>
              </div>
            </div>
          </SuggestionSection>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onApplyAll} className={adminPrimarySubmitClassName}>
            全部应用
          </button>
          <button type="button" onClick={onClose} className={adminSecondaryActionClassName}>
            稍后再说
          </button>
        </div>
      </div>
    </div>
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
    <section className="page-frame px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <button type="button" onClick={onApply} className={adminCompactSecondaryActionClassName}>
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function TaxonomyChip({
  title,
  level,
  reason,
  tone,
  extraMeta,
}: {
  title: string;
  level: AiSelectedTagSuggestion['level'] | AiSuggestedTagCandidate['level'];
  reason?: string;
  tone: 'existing' | 'new';
  extraMeta: string;
}) {
  const className =
    tone === 'new'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
      : 'border-primary/30 bg-primary/10 text-primary';

  return (
    <div className={`rounded-[1rem] border px-3 py-2 text-xs ${className}`}>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-[11px] opacity-80">
        {getTaxonomyLevelLabel(level)} · {extraMeta}
      </div>
      <div className="mt-1 text-[11px] opacity-80">{getTaxonomyLevelHint(level)}</div>
      {reason && <div className="mt-1 text-[11px] opacity-80">{reason}</div>}
    </div>
  );
}

function TagSuggestionChip({ tag }: { tag: AiSelectedTagSuggestion | AiSuggestedTagCandidate }) {
  const isNew = 'isNew' in tag && Boolean(tag.isNew);

  return (
    <div
      className={`rounded-[1rem] border px-3 py-2 text-xs ${
        isNew
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
          : 'border-primary/30 bg-primary/10 text-primary'
      }`}
    >
      <div className="font-medium">
        {tag.name}
        {isNew ? '（建议新增）' : ''}
      </div>
      <div className="mt-1 text-[11px] opacity-80">
        {getTaxonomyLevelLabel(tag.level)} · {getTaxonomyLevelHint(tag.level)}
      </div>
      {tag.reason && <div className="mt-1 text-[11px] opacity-80">{tag.reason}</div>}
    </div>
  );
}
