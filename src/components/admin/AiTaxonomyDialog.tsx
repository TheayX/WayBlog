'use client';

import { adminSecondaryActionClassName } from '@/components/admin/AdminCrudLayout';
import type {
  AiOptimizeResult,
  AiSelectedTagSuggestion,
  AiSuggestedTagCandidate,
  AiTaxonomySuggestionLevel,
} from '@/lib/ai/types';

interface AiTaxonomyDialogProps {
  open: boolean;
  selectedCategory: AiOptimizeResult['selectedCategory'];
  betterCategorySuggestion: AiOptimizeResult['betterCategorySuggestion'];
  selectedTags: AiSelectedTagSuggestion[];
  newTagSuggestions: AiSuggestedTagCandidate[];
  matchedCategoryId: string;
  matchedTagIds: string[];
  currentCategoryId: string;
  currentSelectedTagIds: string[];
  warnings: string[];
  onClose: () => void;
  onApplyCategory: () => void;
  onCreateCategoryAndApply: () => void;
  onToggleSelectedTag: (tagId: string) => void;
  onCreateTagAndSelect: (tagName: string) => void;
  onCreateAllTagsAndSelect: () => void;
  creatingCategory: boolean;
  creatingTagNames: string[];
  canQuickCreateCategory: boolean;
  canQuickCreateTagNames: string[];
}

/**
 * 分类与标签建议弹窗。
 *
 * 这个面板按“选择器”思路设计：
 * 分类通过卡片直接选择，标签通过卡片直接切换选中状态，
 * 新标签点击后原地创建并进入已选中区域，减少额外按钮和说明文本。
 */
export function AiTaxonomyDialog({
  open,
  selectedCategory,
  betterCategorySuggestion,
  selectedTags,
  newTagSuggestions,
  matchedCategoryId,
  matchedTagIds,
  currentCategoryId,
  currentSelectedTagIds,
  warnings,
  onClose,
  onApplyCategory,
  onCreateCategoryAndApply,
  onToggleSelectedTag,
  onCreateTagAndSelect,
  onCreateAllTagsAndSelect,
  creatingCategory,
  creatingTagNames,
  canQuickCreateCategory,
  canQuickCreateTagNames,
}: AiTaxonomyDialogProps) {
  if (!open) return null;

  const selectedTagCards = selectedTags.filter(
    (tag) => tag.id && currentSelectedTagIds.includes(tag.id),
  );
  const suggestedExistingTagCards = selectedTags.filter(
    (tag) => !tag.id || !currentSelectedTagIds.includes(tag.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="page-frame w-full max-w-4xl px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">AI Select</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">分类与标签建议</h2>
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

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
          <section className="rounded-[1.5rem] border border-border bg-background px-4 py-4">
            <p className="text-sm font-medium text-foreground">分类</p>
            <div className="mt-3 grid gap-3">
              {selectedCategory ? (
                <CategoryCard
                  title={selectedCategory.name}
                  level={selectedCategory.level}
                  active={Boolean(matchedCategoryId && currentCategoryId === matchedCategoryId)}
                  onClick={onApplyCategory}
                />
              ) : (
                <EmptyHint text="没有合适的现有分类" />
              )}

              {betterCategorySuggestion ? (
                <CategoryCard
                  title={betterCategorySuggestion.name}
                  level={betterCategorySuggestion.level}
                  active={false}
                  disabled={!canQuickCreateCategory || creatingCategory}
                  pending={creatingCategory}
                  onClick={canQuickCreateCategory ? onCreateCategoryAndApply : undefined}
                />
              ) : (
                <EmptyHint text="没有新的分类建议" />
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">标签</p>
              {canQuickCreateTagNames.length > 1 && (
                <button
                  type="button"
                  onClick={onCreateAllTagsAndSelect}
                  disabled={canQuickCreateTagNames.every((name) => creatingTagNames.includes(name))}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  一键加入
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <TagGroup title="已选中" count={selectedTagCards.length}>
                {selectedTagCards.length > 0 ? (
                  selectedTagCards.map((tag) => (
                    <SelectableTagCard
                      key={`${tag.id || tag.name}-selected`}
                      tag={tag}
                      selected
                      animated
                      onClick={tag.id ? () => onToggleSelectedTag(tag.id!) : undefined}
                    />
                  ))
                ) : (
                  <EmptyHint text="还没有选中标签" />
                )}
              </TagGroup>

              <TagGroup title="推荐标签" count={suggestedExistingTagCards.length}>
                {suggestedExistingTagCards.length > 0 ? (
                  suggestedExistingTagCards.map((tag) => (
                    <SelectableTagCard
                      key={`${tag.id || tag.name}-suggested`}
                      tag={tag}
                      selected={Boolean(tag.id && currentSelectedTagIds.includes(tag.id))}
                      hinted={Boolean(tag.id && matchedTagIds.includes(tag.id))}
                      onClick={tag.id ? () => onToggleSelectedTag(tag.id!) : undefined}
                    />
                  ))
                ) : (
                  <EmptyHint text="没有可直接选中的现有标签" />
                )}
              </TagGroup>

              <TagGroup title="新建建议" count={newTagSuggestions.length}>
                {newTagSuggestions.length > 0 ? (
                  newTagSuggestions.map((tag) => (
                    <SelectableTagCard
                      key={`${tag.name}-new`}
                      tag={tag}
                      selected={false}
                      disabled={!canQuickCreateTagNames.includes(tag.name)}
                      pending={creatingTagNames.includes(tag.name)}
                      onClick={
                        canQuickCreateTagNames.includes(tag.name)
                          ? () => onCreateTagAndSelect(tag.name)
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <EmptyHint text="没有新的标签建议" />
                )}
              </TagGroup>
            </div>
          </section>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={adminSecondaryActionClassName}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  title,
  level,
  active,
  disabled = false,
  pending = false,
  onClick,
}: {
  title: string;
  level: AiTaxonomySuggestionLevel;
  active: boolean;
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${getLevelCardClassName(level, active)} min-h-[5.25rem] w-full cursor-pointer rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] disabled:cursor-not-allowed disabled:opacity-55`}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-2 text-[11px] opacity-80">{pending ? '创建中...' : '\u00A0'}</div>
    </button>
  );
}

function TagGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}

function SelectableTagCard({
  tag,
  selected,
  hinted = false,
  disabled = false,
  pending = false,
  animated = false,
  onClick,
}: {
  tag: AiSelectedTagSuggestion | AiSuggestedTagCandidate;
  selected: boolean;
  hinted?: boolean;
  disabled?: boolean;
  pending?: boolean;
  animated?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive || pending}
      className={`${getTagCardClassName(tag.level, selected, hinted)} ${
        animated ? 'translate-y-0 opacity-100' : ''
      } inline-flex min-h-[3rem] cursor-pointer items-center rounded-full border px-4 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-20px_rgba(15,23,42,0.4)] disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? '创建中...' : tag.name}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function getLevelCardClassName(level: AiTaxonomySuggestionLevel, active: boolean) {
  if (active) {
    return 'border-emerald-600 bg-emerald-600 text-white shadow-[0_18px_36px_-28px_rgba(5,150,105,0.75)]';
  }

  switch (level) {
    case 'strong':
      return 'border-emerald-300 bg-emerald-50 text-emerald-900';
    case 'medium':
      return 'border-amber-300 bg-amber-50 text-amber-900';
    case 'weak':
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function getTagCardClassName(
  level: AiTaxonomySuggestionLevel,
  selected: boolean,
  hinted: boolean,
) {
  if (selected) {
    return 'border-emerald-600 bg-emerald-600 text-white shadow-[0_16px_28px_-24px_rgba(5,150,105,0.7)]';
  }

  if (hinted) {
    return 'border-sky-300 bg-sky-50 text-sky-900';
  }

  switch (level) {
    case 'strong':
      return 'border-emerald-300 bg-emerald-50 text-emerald-900';
    case 'medium':
      return 'border-amber-300 bg-amber-50 text-amber-900';
    case 'weak':
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}
