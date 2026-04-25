'use client';

import type { ReactNode } from 'react';
import {
  adminCompactSecondaryActionClassName,
  adminPrimarySubmitClassName,
  adminSecondaryActionClassName,
} from '@/components/admin/AdminCrudLayout';
import { AiTaxonomyPanel } from '@/components/admin/AiTaxonomyPanel';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import type { AiField, AiOptimizeResult } from '@/lib/ai/types';

interface AiSuggestionDrawerProps {
  open: boolean;
  result: AiOptimizeResult | null;
  currentCategoryId: string;
  currentSelectedTagIds: string[];
  onClose: () => void;
  onApplyField: (field: AiField) => void;
  onApplyAll: () => void;
  onCreateCategoryAndApply: (suggestionName: string) => void;
  onCreateTagAndSelect: (tagName: string) => void;
  onCreateAllTagsAndSelect: (tagNames: string[]) => void;
  onToggleSelectedTag: (tagId: string) => void;
  creatingCategoryNames: string[];
  creatingTagNames: string[];
}

export function AiSuggestionDrawer({
  open,
  result,
  currentCategoryId,
  currentSelectedTagIds,
  onClose,
  onApplyField,
  onApplyAll,
  onCreateCategoryAndApply,
  onCreateTagAndSelect,
  onCreateAllTagsAndSelect,
  onToggleSelectedTag,
  creatingCategoryNames,
  creatingTagNames,
}: AiSuggestionDrawerProps) {
  if (!open || !result) return null;

  const categorySuggestionName = result.betterCategorySuggestion?.name || '';
  const quickCreateTagNames = result.newTagSuggestions
    .filter((tag) => tag.level !== 'weak')
    .map((tag) => tag.name);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgb(22_21_20/0.32)] backdrop-blur-[6px]">
      <div className="flex h-full w-full max-w-[54rem] flex-col overflow-hidden border-l border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background-elevated)_94%,white_6%),color-mix(in_srgb,var(--background)_96%,transparent))] shadow-[0_24px_80px_-40px_rgba(37,31,24,0.4)]">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">AI Review</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">AI 优化建议</h2>
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
            title="分类与标签"
            actionLabel="应用分类和标签"
            onApply={() => {
              onApplyField('category');
              onApplyField('tags');
            }}
          >
            <AiTaxonomyPanel
              selectedCategory={result.selectedCategory}
              betterCategorySuggestion={result.betterCategorySuggestion}
              selectedTags={result.selectedTags}
              newTagSuggestions={result.newTagSuggestions}
              currentCategoryId={currentCategoryId}
              currentSelectedTagIds={currentSelectedTagIds}
              warnings={result.warnings}
              onApplyCategory={() => onApplyField('category')}
              onCreateCategoryAndApply={() => {
                if (!categorySuggestionName) return;
                onCreateCategoryAndApply(categorySuggestionName);
              }}
              onToggleSelectedTag={onToggleSelectedTag}
              onCreateTagAndSelect={onCreateTagAndSelect}
              onCreateAllTagsAndSelect={() => onCreateAllTagsAndSelect(quickCreateTagNames)}
              creatingCategory={Boolean(
                categorySuggestionName && creatingCategoryNames.includes(categorySuggestionName),
              )}
              creatingTagNames={creatingTagNames}
              canQuickCreateCategory={Boolean(
                result.betterCategorySuggestion && result.betterCategorySuggestion.level !== 'weak',
              )}
              canQuickCreateTagNames={quickCreateTagNames}
            />
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
  children: ReactNode;
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
