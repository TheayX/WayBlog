import type { AiOptimizeInput, AiOptimizeResult } from '@/lib/ai/types';
import {
  clampExcerpt,
  getString,
  normalizeBetterCategorySuggestion,
  normalizeMarkdown,
  normalizeNewTagSuggestions,
  normalizeSelectedCategory,
  normalizeSelectedTags,
  normalizeWarnings,
} from '@/lib/ai/normalizers/shared';
import { slugify } from '@/lib/utils';

/**
 * 归一化全文优化结果。
 * 第二版结构直接以 selectedCategory / selectedTags 等字段为准，不再保留旧格式兼容。
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

  return {
    title,
    slug: slugify(rawSlug).slice(0, 255),
    excerpt: excerpt.slice(0, 500),
    content,
    selectedCategory,
    betterCategorySuggestion,
    selectedTags,
    newTagSuggestions,
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}
