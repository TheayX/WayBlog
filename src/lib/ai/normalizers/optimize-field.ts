import type { AiFieldInput, AiFieldResult } from '@/lib/ai/types';
import {
  clampExcerpt,
  getString,
  normalizeCategory,
  normalizeMarkdown,
  normalizeTags,
  normalizeWarnings,
} from '@/lib/ai/normalizers/shared';
import { slugify } from '@/lib/utils';

/**
 * 归一化字段级 AI 优化结果。
 * 会根据字段类型决定是直接返回文本，还是先执行 slug、Markdown、摘要等特定清洗逻辑。
 */
export function normalizeOptimizeFieldResult(
  parsed: Record<string, unknown>,
  input: AiFieldInput,
): AiFieldResult {
  const normalizedValue = normalizeFieldValue(parsed, input);

  return {
    field: input.field,
    value: normalizedValue || undefined,
    categorySuggestion: normalizeCategory(parsed.categorySuggestion, input),
    tagSuggestions: normalizeTags(parsed.tagSuggestions, input),
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
