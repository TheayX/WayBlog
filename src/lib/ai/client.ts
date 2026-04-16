import type {
  AiFieldInput,
  AiFieldResult,
  AiOptimizeInput,
  AiOptimizeResult,
  AiSuggestionCategory,
  AiSuggestionTag,
} from '@/lib/ai/types';
import { slugify } from '@/lib/utils';

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function stripOuterCodeFence(text: string) {
  return text
    .replace(/^```(?:markdown|md|json|text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function normalizeMarkdown(value: string, fallback: string) {
  const normalized = stripOuterCodeFence(value).replace(/\r\n/g, '\n').trim();
  return normalized || fallback.trim();
}

function clampExcerpt(value: string, fallback: string) {
  const source = stripOuterCodeFence(value || fallback)
    .replace(/\s+/g, ' ')
    .trim();

  if (!source) return '';
  if (source.length <= 140) return source;

  const sentence = source.match(/^.{60,140}?[。！？.!?]/)?.[0]?.trim();
  if (sentence && sentence.length >= 50) return sentence;

  return `${source.slice(0, 137).trim()}...`;
}

function normalizeCategory(
  value: unknown,
  input: AiOptimizeInput | AiFieldInput,
): AiSuggestionCategory | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const name = getString(record.name);
  if (!name) return null;

  const matched = input.categories.find((item) => item.name.toLowerCase() === name.toLowerCase());

  return {
    id: getString(record.id) || matched?.id || undefined,
    name: matched?.name || name,
    reason: getString(record.reason) || undefined,
  };
}

function normalizeTags(
  value: unknown,
  input: AiOptimizeInput | AiFieldInput,
): AiSuggestionTag[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const normalized: AiSuggestionTag[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;
    const rawName = getString(record.name);
    if (!rawName) continue;

    const matched = input.tags.find((tag) => tag.name.toLowerCase() === rawName.toLowerCase());
    const name = matched?.name || rawName;
    const key = name.toLowerCase();

    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      id: getString(record.id) || matched?.id || undefined,
      name,
      reason: getString(record.reason) || undefined,
      isNew: matched ? false : Boolean(record.isNew),
    });
  }

  return normalized.slice(0, 5);
}

function normalizeWarnings(value: unknown, content: string) {
  const warnings = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (content.trim().length < 120) {
    warnings.unshift('正文较短，AI 建议可能不稳定。');
  }

  return Array.from(new Set(warnings.filter(Boolean))).slice(0, 5);
}

// provider 返回的结构不完全可信，这里统一收口成前端稳定消费的数据格式。
export function normalizeOptimizeResult(
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

// 单字段优化和整篇优化共用同一套清洗规则，避免不同 provider 产生行为漂移。
export function normalizeFieldResult(
  parsed: Record<string, unknown>,
  input: AiFieldInput,
): AiFieldResult {
  const rawValue = getString(parsed.value);

  let value = rawValue;
  if (input.field === 'slug') {
    value = slugify(rawValue || input.title || input.slug).slice(0, 255);
  }
  if (input.field === 'content') {
    value = normalizeMarkdown(rawValue, input.content);
  }
  if (input.field === 'excerpt') {
    value = clampExcerpt(rawValue, input.excerpt || input.content);
  }

  return {
    field: input.field,
    value: value || undefined,
    categorySuggestion: normalizeCategory(parsed.categorySuggestion, input),
    tagSuggestions: normalizeTags(parsed.tagSuggestions, input),
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}
