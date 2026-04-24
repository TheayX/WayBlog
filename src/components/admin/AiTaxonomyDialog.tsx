'use client';

import type { AiSuggestionCategory, AiSuggestionTag } from '@/lib/ai/types';

interface AiTaxonomyDialogProps {
  open: boolean;
  categorySuggestion: AiSuggestionCategory | null;
  tagSuggestions: AiSuggestionTag[];
  matchedCategoryId: string;
  matchedTagIds: string[];
  warnings: string[];
  onClose: () => void;
  onApplyCategory: () => void;
  onApplyTags: () => void;
  onApplyAll: () => void;
}

/**
 * 分类与标签 AI 建议弹窗。
 *
 * 第四个区块同时承载分类、现有标签和新增标签三类判断，
 * 这里单独拆成轻量弹窗，避免把选择建议直接塞回表单头部造成信息拥挤。
 */
export function AiTaxonomyDialog({
  open,
  categorySuggestion,
  tagSuggestions,
  matchedCategoryId,
  matchedTagIds,
  warnings,
  onClose,
  onApplyCategory,
  onApplyTags,
  onApplyAll,
}: AiTaxonomyDialogProps) {
  if (!open) return null;

  const existingTags = tagSuggestions.filter((tag) => !tag.isNew);
  const newTags = tagSuggestions.filter((tag) => tag.isNew);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="page-frame w-full max-w-xl px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">AI Select</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">分类与标签建议</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              这里不会直接覆盖表单，你可以先看建议，再选择要应用的部分。
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

        <div className="mt-5 space-y-4">
          <section className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium text-foreground">分类建议</h3>
              <button
                type="button"
                onClick={onApplyCategory}
                className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
              >
                应用分类
              </button>
            </div>
            {categorySuggestion ? (
              <div className="mt-3 space-y-2 text-sm leading-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                    {categorySuggestion.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {matchedCategoryId ? '已匹配到现有分类' : '未匹配到现有分类'}
                  </span>
                </div>
                {categorySuggestion.reason && (
                  <p className="text-muted-foreground">{categorySuggestion.reason}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">AI 暂未给出分类建议</p>
            )}
          </section>

          <section className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium text-foreground">标签建议</h3>
              <button
                type="button"
                onClick={onApplyTags}
                className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
              >
                应用标签
              </button>
            </div>

            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">推荐现有标签</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingTags.length > 0 ? (
                    existingTags.map((tag) => (
                      <TagSuggestionChip
                        key={`${tag.id || tag.name}-existing`}
                        tag={tag}
                        matched={matchedTagIds.length > 0}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">AI 暂未匹配到现有标签</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">建议新增标签</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newTags.length > 0 ? (
                    newTags.map((tag) => (
                      <TagSuggestionChip key={`${tag.name}-new`} tag={tag} matched={false} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">当前没有新增标签建议</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onApplyAll}
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            全部应用
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}

function TagSuggestionChip({
  tag,
  matched,
}: {
  tag: AiSuggestionTag;
  matched: boolean;
}) {
  return (
    <div
      className={`rounded-[1rem] border px-3 py-2 text-xs ${
        tag.isNew
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
          : 'border-primary/30 bg-primary/10 text-primary'
      }`}
    >
      <div className="font-medium">
        {tag.name}
        {tag.isNew ? '（建议新增）' : ''}
      </div>
      {!tag.isNew && (
        <div className="mt-1 text-[11px] opacity-80">
          {matched ? '可直接应用到当前标签' : '需要人工确认是否保留'}
        </div>
      )}
      {tag.reason && <div className="mt-1 text-[11px] opacity-80">{tag.reason}</div>}
    </div>
  );
}
