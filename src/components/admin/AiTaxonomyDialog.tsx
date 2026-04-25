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
}

/**
 * taxonomy suggestion v2 弹窗。
 * 分类与标签分别区分“可直接应用”结果和“新增建议”，避免继续沿用 v1 的二元表达。
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
}: AiTaxonomyDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="page-frame w-full max-w-3xl px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">AI Select V2</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">分类与标签建议</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              taxonomy suggestion v2 会区分可直接应用结果和新增建议，你可以先看判断，再决定应用哪部分。
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
                  <p className="mt-2 text-sm text-muted-foreground">这次没有可直接应用的现有分类。</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">更贴切的新分类建议</p>
                {betterCategorySuggestion ? (
                  <TaxonomyCard
                    className="mt-2 border-amber-500/40 bg-amber-500/10 text-amber-700"
                    title={betterCategorySuggestion.name}
                    meta={[getTaxonomyLevelLabel(betterCategorySuggestion.level), '建议新增']}
                    reason={betterCategorySuggestion.reason}
                    footer={getTaxonomyLevelHint(betterCategorySuggestion.level)}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">当前没有更贴切的新分类建议。</p>
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
                    <p className="text-sm text-muted-foreground">这次没有可直接应用的现有标签。</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">建议新增的标签</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newTagSuggestions.length > 0 ? (
                    newTagSuggestions.map((tag) => (
                      <TagSuggestionChip key={`${tag.name}-new`} tag={tag} matched={false} />
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
  return (
    <div className={`rounded-[1rem] border px-3 py-3 text-xs ${className}`}>
      <div className="font-medium">{title}</div>
      <div className="mt-1 flex flex-wrap gap-2 text-[11px] opacity-80">
        {meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      {reason && <div className="mt-2 text-[11px] opacity-90">{reason}</div>}
      <div className="mt-2 text-[11px] opacity-75">{footer}</div>
    </div>
  );
}

function TagSuggestionChip({
  tag,
  matched,
}: {
  tag: AiSelectedTagSuggestion | AiSuggestedTagCandidate;
  matched: boolean;
}) {
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
      {!isNew && (
        <div className="mt-1 text-[11px] opacity-80">
          {matched ? '已命中现有标签' : '需要人工确认映射'}
        </div>
      )}
      {tag.reason && <div className="mt-1 text-[11px] opacity-80">{tag.reason}</div>}
    </div>
  );
}

/** 逐项判断单个现有标签是否已命中。 */
function isMatchedExistingTag(tag: AiSelectedTagSuggestion, matchedTagIds: string[]) {
  return Boolean(tag.id && matchedTagIds.includes(tag.id));
}
