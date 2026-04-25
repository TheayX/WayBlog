import type { AiFieldInput, AiFieldResult } from '@/lib/ai/types';
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
 * 归一化字段级 AI 优化结果。
 * 第二版字段结果直接使用新的分类与标签结构。
 */
export function normalizeOptimizeFieldResult(
  parsed: Record<string, unknown>,
  input: AiFieldInput,
): AiFieldResult {
  const normalizedIdentity = normalizeIdentityFields(parsed, input);
  const normalizedValue = normalizeFieldValue(parsed, input);

  const selectedCategory = normalizeSelectedCategory(parsed.selectedCategory, input);
  const betterCategorySuggestion = normalizeBetterCategorySuggestion(parsed.betterCategorySuggestion);
  const selectedTags = normalizeSelectedTags(parsed.selectedTags, input);
  const newTagSuggestions = normalizeNewTagSuggestions(parsed.newTagSuggestions);

  return {
    field: input.field,
    title: normalizedIdentity.title,
    slug: normalizedIdentity.slug,
    value: normalizedValue || undefined,
    selectedCategory,
    betterCategorySuggestion,
    selectedTags,
    newTagSuggestions,
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}

/** 根据目标字段类型执行对应的值清洗策略。 */
function normalizeFieldValue(parsed: Record<string, unknown>, input: AiFieldInput) {
  const rawValue = getString(parsed.value);

  switch (input.field) {
    case 'slug':
      return slugify(rawValue || input.title || input.slug).slice(0, 255);
    case 'content':
      return normalizeMarkdown(rawValue, input.content);
    case 'excerpt':
      return clampExcerpt(rawValue, input.excerpt || input.content);
    default:
      return rawValue;
  }
}

/**
 * 标题与 slug 合并按钮需要一次返回同一轮语义判断下的两个字段，
 * 这里统一做兜底归一化，避免前端再把两个字段请求拼在一起。
 */
function normalizeIdentityFields(parsed: Record<string, unknown>, input: AiFieldInput) {
  if (input.field !== 'identity') {
    return { title: undefined, slug: undefined };
  }

  const title = getString(parsed.title) || input.title.trim() || '未命名文章';
  const rawSlug = getString(parsed.slug) || title || input.slug;

  return {
    title,
    slug: slugify(rawSlug).slice(0, 255),
  };
}
