'use client';

import type { CSSProperties, ReactNode } from 'react';
import type {
  AiOptimizeResult,
  AiSelectedTagSuggestion,
  AiSuggestedTagCandidate,
  AiTaxonomySuggestionLevel,
} from '@/lib/ai/types';

interface AiTaxonomyPanelProps {
  selectedCategory: AiOptimizeResult['selectedCategory'];
  betterCategorySuggestion: AiOptimizeResult['betterCategorySuggestion'];
  selectedTags: AiSelectedTagSuggestion[];
  newTagSuggestions: AiSuggestedTagCandidate[];
  currentCategoryId: string;
  currentSelectedTagIds: string[];
  warnings: string[];
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
 * 分类与标签建议共享面板。
 *
 * 全文 AI 抽屉和 taxonomy 专用弹窗复用同一套结构与交互，
 * 避免两个入口逐渐长成两套不同的体验。
 */
export function AiTaxonomyPanel({
  selectedCategory,
  betterCategorySuggestion,
  selectedTags,
  newTagSuggestions,
  currentCategoryId,
  currentSelectedTagIds,
  warnings,
  onApplyCategory,
  onCreateCategoryAndApply,
  onToggleSelectedTag,
  onCreateTagAndSelect,
  onCreateAllTagsAndSelect,
  creatingCategory,
  creatingTagNames,
  canQuickCreateCategory,
  canQuickCreateTagNames,
}: AiTaxonomyPanelProps) {
  const selectedTagCards = selectedTags.filter(
    (tag) => tag.id && currentSelectedTagIds.includes(tag.id),
  );
  const suggestedExistingTagCards = selectedTags.filter(
    (tag) => !tag.id || !currentSelectedTagIds.includes(tag.id),
  );

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--accent)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--background-elevated))] px-4 py-3 text-sm text-foreground-soft">
          {warnings[0]}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <section className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_78%,transparent)] bg-[color:color-mix(in_srgb,var(--background-elevated)_84%,var(--muted))] px-4 py-4 shadow-[0_18px_40px_-34px_rgba(37,31,24,0.22)]">
          <p className="text-sm font-medium text-foreground">分类</p>
          <div className="mt-3 grid gap-3">
            {selectedCategory ? (
              <CategoryCard
                title={selectedCategory.name}
                level={selectedCategory.level}
                active={Boolean(selectedCategory.id && currentCategoryId === selectedCategory.id)}
                onClick={onApplyCategory}
              />
            ) : (
              <EmptyHint text="没有适合的现有分类" />
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

        <section className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_78%,transparent)] bg-[color:color-mix(in_srgb,var(--background-elevated)_86%,var(--muted))] px-4 py-4 shadow-[0_18px_40px_-34px_rgba(37,31,24,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">标签</p>
            {canQuickCreateTagNames.length > 1 && (
              <button
                type="button"
                onClick={onCreateAllTagsAndSelect}
                disabled={canQuickCreateTagNames.every((name) => creatingTagNames.includes(name))}
                className="rounded-full border border-[color:color-mix(in_srgb,var(--border)_84%,transparent)] bg-[color:color-mix(in_srgb,var(--background)_88%,white_12%)] px-3 py-1 text-xs text-muted-foreground transition hover:border-border-strong hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                一键加入
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <TagGroup title="已选中" count={selectedTagCards.length}>
              {selectedTagCards.length > 0 ? (
                selectedTagCards.map((tag) => {
                  const tagId = tag.id;

                  return (
                    <SelectableTagCard
                      key={`${tagId || tag.name}-selected`}
                      tag={tag}
                      selected
                      animated
                      onClick={tagId ? () => onToggleSelectedTag(tagId) : undefined}
                    />
                  );
                })
              ) : (
                <EmptyHint text="还没有选中标签" />
              )}
            </TagGroup>

            <TagGroup title="推荐标签" count={suggestedExistingTagCards.length}>
              {suggestedExistingTagCards.length > 0 ? (
                suggestedExistingTagCards.map((tag) => {
                  const tagId = tag.id;

                  return (
                    <SelectableTagCard
                      key={`${tagId || tag.name}-suggested`}
                      tag={tag}
                      selected={Boolean(tagId && currentSelectedTagIds.includes(tagId))}
                      onClick={tagId ? () => onToggleSelectedTag(tagId) : undefined}
                    />
                  );
                })
              ) : (
                <EmptyHint text="没有推荐的现有标签" />
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
  const style = getCategoryCardStyle(level, active);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      style={style}
      className="min-h-[5.4rem] w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-30px_rgba(37,31,24,0.28)] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-2 text-[11px] opacity-75">{pending ? '创建中...' : '\u00A0'}</div>
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
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="rounded-full border border-[color:color-mix(in_srgb,var(--border)_84%,transparent)] bg-[color:color-mix(in_srgb,var(--background)_72%,transparent)] px-2.5 py-0.5 text-[11px] text-muted-foreground">
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
  disabled = false,
  pending = false,
  animated = false,
  onClick,
}: {
  tag: AiSelectedTagSuggestion | AiSuggestedTagCandidate;
  selected: boolean;
  disabled?: boolean;
  pending?: boolean;
  animated?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick) && !disabled;
  const style = getTagCardStyle(tag.level, selected);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive || pending}
      style={style}
      className={`${animated ? 'taxonomy-tag-arrive' : ''} inline-flex min-h-[3rem] items-center rounded-full border px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_-22px_rgba(37,31,24,0.24)] disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? '创建中...' : tag.name}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function getCategoryCardStyle(level: AiTaxonomySuggestionLevel, active: boolean): CSSProperties {
  if (active) {
    return {
      backgroundColor: 'var(--primary)',
      borderColor: 'color-mix(in srgb, var(--primary) 82%, var(--border))',
      color: 'var(--primary-foreground)',
      boxShadow: '0 22px 38px -32px rgb(34 58 54 / 0.42)',
    };
  }

  switch (level) {
    case 'strong':
      return {
        backgroundColor: 'color-mix(in srgb, var(--primary) 7%, var(--background-elevated))',
        borderColor: 'color-mix(in srgb, var(--primary) 19%, var(--border))',
        color: 'var(--foreground)',
      };
    case 'medium':
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent) 7%, var(--background-elevated))',
        borderColor: 'color-mix(in srgb, var(--accent) 19%, var(--border))',
        color: 'var(--foreground)',
      };
    case 'weak':
      return {
        backgroundColor: 'var(--background-elevated)',
        borderColor: 'var(--border)',
        color: 'var(--foreground-soft)',
      };
  }
}

function getTagCardStyle(level: AiTaxonomySuggestionLevel, selected: boolean): CSSProperties {
  if (selected) {
    return {
      backgroundColor: 'var(--primary)',
      borderColor: 'color-mix(in srgb, var(--primary) 82%, var(--border))',
      color: 'var(--primary-foreground)',
      boxShadow: '0 18px 30px -26px rgb(34 58 54 / 0.38)',
    };
  }

  switch (level) {
    case 'strong':
      return {
        backgroundColor: 'color-mix(in srgb, var(--primary) 6%, var(--background-elevated))',
        borderColor: 'color-mix(in srgb, var(--primary) 17%, var(--border))',
        color: 'var(--foreground)',
      };
    case 'medium':
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent) 7%, var(--background-elevated))',
        borderColor: 'color-mix(in srgb, var(--accent) 17%, var(--border))',
        color: 'var(--foreground)',
      };
    case 'weak':
      return {
        backgroundColor: 'var(--background-elevated)',
        borderColor: 'var(--border)',
        color: 'var(--foreground-soft)',
      };
  }
}
