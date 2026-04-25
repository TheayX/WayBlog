import type { AiOptimizeInput, AiOptimizeResult } from '@/lib/ai/types';
import {
  clampExcerpt,
  getString,
  normalizeBetterCategorySuggestion,
  normalizeLegacyCategorySuggestionV1,
  normalizeLegacyTagSuggestionsV1,
  normalizeMarkdown,
  normalizeNewTagSuggestions,
  normalizeSelectedCategory,
  normalizeSelectedTags,
  normalizeWarnings,
} from '@/lib/ai/normalizers/shared';
import { slugify } from '@/lib/utils';

/**
 * 归一化全文优化结果。
 * taxonomy suggestion v2 优先读取 selectedCategory / selectedTags 等新结构，
 * 同时保留对 v1 categorySuggestion / tagSuggestions 的兼容映射。
 */
export function normalizeOptimizePostResult(
  parsed: Record<string, unknown>,
  input: AiOptimizeInput,
): AiOptimizeResult {
  const title = getString(parsed.title) || input.title.trim() || '未命名文章';
  const content = normalizeMarkdown(getString(parsed.content), input.content);
  const excerpt = clampExcerpt(getString(parsed.excerpt), input.excerpt || content);
  const rawSlug = getString(parsed.slug) || title;

  const selectedCategory = normalizeSelectedCategory(parsed.selectedCategory, input);
  const betterCategorySuggestion = normalizeBetterCategorySuggestion(parsed.betterCategorySuggestion);
  const selectedTags = normalizeSelectedTags(parsed.selectedTags, input);
  const newTagSuggestions = normalizeNewTagSuggestions(parsed.newTagSuggestions);

  const legacyCategory = normalizeLegacyCategorySuggestionV1(parsed.categorySuggestion, input);
  const legacyTags = normalizeLegacyTagSuggestionsV1(parsed.tagSuggestions, input);

  return {
    title,
    slug: slugify(rawSlug).slice(0, 255),
    excerpt: excerpt.slice(0, 500),
    content,
    selectedCategory: selectedCategory || legacyCategory.selectedCategory,
    betterCategorySuggestion: betterCategorySuggestion || legacyCategory.betterCategorySuggestion,
    selectedTags: selectedTags.length > 0 ? selectedTags : legacyTags.selectedTags,
    newTagSuggestions: newTagSuggestions.length > 0 ? newTagSuggestions : legacyTags.newTagSuggestions,
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}
