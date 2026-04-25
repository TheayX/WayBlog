'use client';

import { CircleHelp } from 'lucide-react';
import {
  adminCompactSecondaryActionClassName,
  adminPrimarySubmitClassName,
  adminSecondaryActionClassName,
} from '@/components/admin/AdminCrudLayout';
import {
  getTaxonomyLevelHint,
  getTaxonomyLevelLabel,
} from '@/components/admin/post-ai-helpers';
import type {
  AiOptimizeResult,
  AiSelectedTagSuggestion,
  AiSuggestedTagCandidate,
} from '@/lib/ai/types';

interface AiTaxonomyDialogProps {
  open: boolean;
  selectedCategory: AiOptimizeResult['selectedCategory'];
  betterCategorySuggestion: AiOptimizeResult['betterCategorySuggestion'];
  selectedTags: AiSelectedTagSuggestion[];
  newTagSuggestions: AiSuggestedTagCandidate[];
  matchedCategoryId: string;
  matchedTagIds: string[];
  warnings: string[];
  onClose: () => void;
  onApplyCategory: () => void;
  onApplyTags: () => void;
  onApplyAll: () => void;
  onCreateCategoryAndApply: () => void;
  onCreateTagAndSelect: (tagName: string) => void;
  onCreateAllTagsAndSelect: () => void;
  creatingCategory: boolean;
  creatingTagNames: string[];
  canQuickCreateCategory: boolean;
  canQuickCreateTagNames: string[];
}

/**
 * 分类与标签建议弹窗。
 * 把可直接应用结果和新增建议分开展示，避免信息混在一起。
 */
export function AiTaxonomyDialog({
  open,
  selectedCategory,
  betterCategorySuggestion,
  selectedTags,
  newTagSuggestions,
  matchedCategoryId,
  matchedTagIds,
  warnings,
  onClose,
  onApplyCategory,
  onApplyTags,
  onApplyAll,
  onCreateCategoryAndApply,
  onCreateTagAndSelect,
  onCreateAllTagsAndSelect,
  creatingCategory,
  creatingTagNames,
  canQuickCreateCategory,
  canQuickCreateTagNames,
}: AiTaxonomyDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="page-frame w-full max-w-3xl px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">AI Select</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">分类与标签建议</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              先看建议，再决定应用哪些内容。
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

        {warnings.length > 0 && (
          <div className="mt-5 rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
            {warnings[0]}
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium text-foreground">分类建议</h3>
              <button
                type="button"
                onClick={onApplyCategory}
                className={adminCompactSecondaryActionClassName}
              >
                应用分类
              </button>
            </div>

            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">可直接应用的现有分类</p>
                {selectedCategory ? (
                  <TaxonomyCard
                    className="mt-2 border-primary/30 bg-primary/10 text-primary"
                    title={selectedCategory.name}
                    meta={[
                      getTaxonomyLevelLabel(selectedCategory.level),
                      matchedCategoryId ? '已命中现有分类' : '需要人工确认映射',
                    ]}
                    reason={selectedCategory.reason}
                    footer={getTaxonomyLevelHint(selectedCategory.level)}
                  />
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">没有适合直接应用的现有分类。</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">更贴切的新分类建议</p>
                {betterCategorySuggestion ? (
                  <div className="mt-2 space-y-2">
                    <TaxonomyCard
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700"
                      title={betterCategorySuggestion.name}
                      meta={[getTaxonomyLevelLabel(betterCategorySuggestion.level), '建议新增']}
                      reason={betterCategorySuggestion.reason}
                      footer={getTaxonomyLevelHint(betterCategorySuggestion.level)}
                    />
                    {canQuickCreateCategory ? (
                      <button
                        type="button"
                        onClick={onCreateCategoryAndApply}
                        disabled={creatingCategory}
                        className={adminCompactSecondaryActionClassName}
                      >
                        {creatingCategory ? '创建中...' : '创建并应用'}
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">一般推荐的新分类建议需手动确认后再创建。</p>
                    )}
                  </div>
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">当前没有更合适的新分类建议。</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium text-foreground">标签建议</h3>
              <button
                type="button"
                onClick={onApplyTags}
                className={adminCompactSecondaryActionClassName}
              >
                应用标签
              </button>
            </div>

            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">推荐应用的现有标签</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <TagSuggestionChip
                        key={`${tag.id || tag.name}-selected`}
                        tag={tag}
                        matched={isMatchedExistingTag(tag, matchedTagIds)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">没有适合直接应用的现有标签。</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">建议新增的标签</p>
                  {canQuickCreateTagNames.length > 1 && (
                    <button
                      type="button"
                      onClick={onCreateAllTagsAndSelect}
                      disabled={canQuickCreateTagNames.every((name) => creatingTagNames.includes(name))}
                      className={adminCompactSecondaryActionClassName}
                    >
                      全部创建并选中
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newTagSuggestions.length > 0 ? (
                    newTagSuggestions.map((tag) => (
                      <TagSuggestionChip
                        key={`${tag.name}-new`}
                        tag={tag}
                        matched={false}
                        actionLabel={canQuickCreateTagNames.includes(tag.name) ? '创建并选中' : undefined}
                        actionPending={creatingTagNames.includes(tag.name)}
                        onAction={
                          canQuickCreateTagNames.includes(tag.name)
                            ? () => onCreateTagAndSelect(tag.name)
                            : undefined
                        }
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">当前没有新增标签建议。</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
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

function TaxonomyCard({
  className,
  title,
  meta,
  reason,
  footer,
}: {
  className: string;
  title: string;
  meta: string[];
  reason?: string;
  footer: string;
}) {
  const detailText = [reason, footer].filter(Boolean).join('\n');

  return (
    <div className={`rounded-[1rem] border px-3 py-3 text-xs ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{title}</div>
        {detailText ? (
          <InfoHint text={detailText} />
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-[11px] opacity-80">
        {meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function TagSuggestionChip({
  tag,
  matched,
  actionLabel,
  actionPending,
  onAction,
}: {
  tag: AiSelectedTagSuggestion | AiSuggestedTagCandidate;
  matched: boolean;
  actionLabel?: string;
  actionPending?: boolean;
  onAction?: () => void;
}) {
  const isNew = 'isNew' in tag && Boolean(tag.isNew);
  const detailParts = [getTaxonomyLevelHint(tag.level)];

  if (!isNew) {
    detailParts.push(matched ? '已命中现有标签' : '需要人工确认映射');
  }

  if (tag.reason) {
    detailParts.push(tag.reason);
  }

  return (
    <div
      className={`rounded-[1rem] border px-3 py-2 text-xs ${
        isNew
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
          : 'border-primary/30 bg-primary/10 text-primary'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">
          {tag.name}
          {isNew ? '（建议新增）' : ''}
        </div>
        <InfoHint text={detailParts.join('\n')} />
      </div>
      <div className="mt-1 text-[11px] opacity-80">
        {getTaxonomyLevelLabel(tag.level)}
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionPending}
          className="mt-2 rounded-full border border-current/20 px-2 py-1 text-[11px] transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionPending ? '创建中...' : actionLabel}
        </button>
      )}
    </div>
  );
}

/** 逐项判断单个现有标签是否已命中。 */
function isMatchedExistingTag(tag: AiSelectedTagSuggestion, matchedTagIds: string[]) {
  return Boolean(tag.id && matchedTagIds.includes(tag.id));
}

function InfoHint({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center opacity-70 transition hover:opacity-100"
      aria-label="查看详情"
    >
      <CircleHelp className="h-3.5 w-3.5" />
    </span>
  );
}
