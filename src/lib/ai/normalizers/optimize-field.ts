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
