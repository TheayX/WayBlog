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

/**
 * 归一化全文优化结果。
 * 把模型输出整理成后台编辑器可直接应用的稳定结构，并在 slug、摘要长度等位置补齐项目约束。
 */
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
