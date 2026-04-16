import type { AiOptimizeInput, AiOptimizeResult } from '@/lib/ai/types';
import {
  clampExcerpt,
  getString,
  normalizeCategory,
  normalizeMarkdown,
  normalizeTags,
  normalizeWarnings,
} from '@/lib/ai/normalizers/shared';
import { slugify } from '@/lib/utils';

export function normalizeOptimizePostResult(
  parsed: Record<string, unknown>,
  input: AiOptimizeInput,
): AiOptimizeResult {
  const title = getString(parsed.title) || input.title.trim() || '未命名文章';
  const content = normalizeMarkdown(getString(parsed.content), input.content);
  const excerpt = clampExcerpt(getString(parsed.excerpt), input.excerpt || content);
  const rawSlug = getString(parsed.slug) || title;

  return {
    title,
    slug: slugify(rawSlug).slice(0, 255),
    excerpt: excerpt.slice(0, 500),
    content,
    categorySuggestion: normalizeCategory(parsed.categorySuggestion, input),
    tagSuggestions: normalizeTags(parsed.tagSuggestions, input),
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}
