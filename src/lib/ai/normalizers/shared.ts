import { z } from 'zod';
import type {
  AiFieldInput,
  AiOptimizeInput,
  AiSelectedCategorySuggestion,
  AiSelectedTagSuggestion,
  AiSuggestedCategoryCandidate,
  AiSuggestedTagCandidate,
  AiTaxonomySuggestionLevel,
} from '@/lib/ai/types';

/**
 * 归一化模块的共享工具集合。
 * 负责把模型返回的宽松 JSON 清洗成前端与路由处理器都能稳定消费的结构。
 */

const modelJsonObjectSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => !Array.isArray(value), 'Model JSON must be an object');

const TAXONOMY_LEVEL_PRIORITY: Record<AiTaxonomySuggestionLevel, number> = {
  strong: 0,
  medium: 1,
  weak: 2,
};

/** 安全读取字符串字段，并在缺失时回退到默认值。 */
export function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

/** 从模型原始文本中提取首个 JSON 对象。 */
export function extractJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object');
  }

  return raw.slice(start, end + 1);
}

/** 解析并校验模型返回的 JSON 对象。 */
export function parseModelJsonObject(raw: string) {
  if (raw.trimStart().startsWith('[')) {
    throw new Error('Model JSON must be an object');
  }

  const parsed = JSON.parse(extractJsonObject(raw));
  return modelJsonObjectSchema.parse(parsed);
}

/** 去掉模型偶尔包裹在外层的 Markdown 代码围栏。 */
export function stripOuterCodeFence(text: string) {
  return text
    .replace(/^```(?:markdown|md|json|text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/** 归一化 Markdown 正文。 */
export function normalizeMarkdown(value: string, fallback: string) {
  const normalized = stripOuterCodeFence(value).replace(/\r\n/g, '\n').trim();
  return normalized || fallback.trim();
}

/** 将摘要收敛到适合博客列表展示的长度范围。 */
export function clampExcerpt(value: string, fallback: string) {
  const source = stripOuterCodeFence(value || fallback)
    .replace(/\s+/g, ' ')
    .trim();

  if (!source) return '';
  if (source.length <= 140) return source;

  const sentence = source.match(/^.{60,140}?[。！？?!]/)?.[0]?.trim();
  if (sentence && sentence.length >= 50) return sentence;

  return `${source.slice(0, 137).trim()}...`;
}

/** taxonomy suggestion v2 档位归一化。 */
export function normalizeSuggestionLevel(value: unknown): AiTaxonomySuggestionLevel {
  const normalized = getString(value).toLowerCase();

  switch (normalized) {
    case 'strong':
    case 'medium':
    case 'weak':
      return normalized;
    default:
      return 'medium';
  }
}

function sortByLevel<T extends { level: AiTaxonomySuggestionLevel; name: string }>(items: T[]) {
  return items.sort(
    (a, b) =>
      TAXONOMY_LEVEL_PRIORITY[a.level] - TAXONOMY_LEVEL_PRIORITY[b.level] ||
      a.name.localeCompare(b.name, 'zh-CN'),
  );
}

/**
 * taxonomy suggestion v1 -> v2 兼容映射。
 * 保留这些函数是为了在代码层显式记录分类/标签建议的演进历史。
 */
export function normalizeLegacyCategorySuggestionV1(
  value: unknown,
  input: AiOptimizeInput | AiFieldInput,
) {
  if (!value || typeof value !== 'object') {
    return { selectedCategory: null, betterCategorySuggestion: null };
  }

  const record = value as Record<string, unknown>;
  const suggestion = normalizeLegacyCategoryRecord(record, input);
  if (!suggestion) {
    return { selectedCategory: null, betterCategorySuggestion: null };
  }

  if (suggestion.id) {
    return {
      selectedCategory: suggestion,
      betterCategorySuggestion: null,
    };
  }

  return {
    selectedCategory: null,
    betterCategorySuggestion: {
      name: suggestion.name,
      level: suggestion.level,
      reason: suggestion.reason,
      isNew: true,
    },
  };
}

function normalizeLegacyCategoryRecord(
  record: Record<string, unknown>,
  input: AiOptimizeInput | AiFieldInput,
): AiSelectedCategorySuggestion | null {
  const name = getString(record.name);
  if (!name) return null;

  const matched = input.categories.find((item) => item.name.toLowerCase() === name.toLowerCase());

  return {
    id: getString(record.id) || matched?.id || undefined,
    name: matched?.name || name,
    level: normalizeSuggestionLevel(record.level),
    reason: getString(record.reason) || undefined,
  };
}

/** taxonomy suggestion v1 -> v2 标签兼容映射。 */
export function normalizeLegacyTagSuggestionsV1(
  value: unknown,
  input: AiOptimizeInput | AiFieldInput,
) {
  if (!Array.isArray(value)) {
    return { selectedTags: [], newTagSuggestions: [] };
  }

  const selectedTags: AiSelectedTagSuggestion[] = [];
  const newTagSuggestions: AiSuggestedTagCandidate[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;
    const normalized = normalizeLegacyTagRecord(record, input);
    if (!normalized) continue;

    const key = normalized.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (normalized.isNew) {
      newTagSuggestions.push({
        name: normalized.name,
        level: normalized.level,
        reason: normalized.reason,
        isNew: true,
      });
      continue;
    }

    selectedTags.push({
      id: normalized.id,
      name: normalized.name,
      level: normalized.level,
      reason: normalized.reason,
    });
  }

  return {
    selectedTags: sortByLevel(selectedTags).slice(0, 5),
    newTagSuggestions: sortByLevel(newTagSuggestions).slice(0, 5),
  };
}

function normalizeLegacyTagRecord(
  record: Record<string, unknown>,
  input: AiOptimizeInput | AiFieldInput,
) {
  const rawName = getString(record.name);
  if (!rawName) return null;

  const matched = input.tags.find((tag) => tag.name.toLowerCase() === rawName.toLowerCase());

  return {
    id: getString(record.id) || matched?.id || undefined,
    name: matched?.name || rawName,
    level: normalizeSuggestionLevel(record.level),
    reason: getString(record.reason) || undefined,
    isNew: matched ? false : Boolean(record.isNew),
  };
}

/** 归一化 taxonomy suggestion v2 分类直接应用结果。 */
export function normalizeSelectedCategory(
  value: unknown,
  input: AiOptimizeInput | AiFieldInput,
): AiSelectedCategorySuggestion | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const name = getString(record.name);
  if (!name) return null;

  const matched = input.categories.find((item) => item.name.toLowerCase() === name.toLowerCase());

  return {
    id: getString(record.id) || matched?.id || undefined,
    name: matched?.name || name,
    level: normalizeSuggestionLevel(record.level),
    reason: getString(record.reason) || undefined,
  };
}

/** 归一化 taxonomy suggestion v2 更佳分类建议。 */
export function normalizeBetterCategorySuggestion(value: unknown): AiSuggestedCategoryCandidate | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const name = getString(record.name);
  if (!name) return null;

  return {
    name,
    level: normalizeSuggestionLevel(record.level),
    reason: getString(record.reason) || undefined,
    isNew: true,
  };
}

/** 归一化 taxonomy suggestion v2 现有标签列表。 */
export function normalizeSelectedTags(
  value: unknown,
  input: AiOptimizeInput | AiFieldInput,
): AiSelectedTagSuggestion[] {
  if (!Array.isArray(value)) return [];

  const normalized: AiSelectedTagSuggestion[] = [];
  const seen = new Set<string>();

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
      level: normalizeSuggestionLevel(record.level),
      reason: getString(record.reason) || undefined,
    });
  }

  return sortByLevel(normalized).slice(0, 5);
}

/** 归一化 taxonomy suggestion v2 新增标签建议。 */
export function normalizeNewTagSuggestions(value: unknown): AiSuggestedTagCandidate[] {
  if (!Array.isArray(value)) return [];

  const normalized: AiSuggestedTagCandidate[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;
    const name = getString(record.name);
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      name,
      level: normalizeSuggestionLevel(record.level),
      reason: getString(record.reason) || undefined,
      isNew: true,
    });
  }

  return sortByLevel(normalized).slice(0, 5);
}

/** 归一化模型 warnings 列表，并按正文长度补充必要提醒。 */
export function normalizeWarnings(value: unknown, content: string) {
  const warnings = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (content.trim().length < 120) {
    warnings.unshift('正文较短，AI 建议可能不稳定。');
  }

  return Array.from(new Set(warnings.filter(Boolean))).slice(0, 5);
}
