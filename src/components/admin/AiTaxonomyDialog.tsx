'use client';

import { adminSecondaryActionClassName } from '@/components/admin/AdminCrudLayout';
import { AiTaxonomyPanel } from '@/components/admin/AiTaxonomyPanel';
import type { AiOptimizeResult, AiSelectedTagSuggestion, AiSuggestedTagCandidate } from '@/lib/ai/types';

interface AiTaxonomyDialogProps {
  open: boolean;
  selectedCategory: AiOptimizeResult['selectedCategory'];
  betterCategorySuggestion: AiOptimizeResult['betterCategorySuggestion'];
  selectedTags: AiSelectedTagSuggestion[];
  newTagSuggestions: AiSuggestedTagCandidate[];
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
 * 只负责弹层容器与关闭操作，具体 taxonomy 选择体验统一交给共享面板。
 */
export function AiTaxonomyDialog(props: AiTaxonomyDialogProps) {
  const { open, onClose } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(22_21_20/0.32)] px-4 backdrop-blur-[6px]">
      <div className="page-frame w-full max-w-4xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background-elevated)_92%,white_8%),color-mix(in_srgb,var(--background-elevated)_98%,transparent))] px-5 py-5">
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

        <div className="mt-5">
          <AiTaxonomyPanel
            selectedCategory={props.selectedCategory}
            betterCategorySuggestion={props.betterCategorySuggestion}
            selectedTags={props.selectedTags}
            newTagSuggestions={props.newTagSuggestions}
            currentCategoryId={props.currentCategoryId}
            currentSelectedTagIds={props.currentSelectedTagIds}
            warnings={props.warnings}
            onApplyCategory={props.onApplyCategory}
            onCreateCategoryAndApply={props.onCreateCategoryAndApply}
            onToggleSelectedTag={props.onToggleSelectedTag}
            onCreateTagAndSelect={props.onCreateTagAndSelect}
            onCreateAllTagsAndSelect={props.onCreateAllTagsAndSelect}
            creatingCategory={props.creatingCategory}
            creatingTagNames={props.creatingTagNames}
            canQuickCreateCategory={props.canQuickCreateCategory}
            canQuickCreateTagNames={props.canQuickCreateTagNames}
          />
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
