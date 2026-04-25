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

const MAX_WARNING_COUNT = 5;
const MAX_TAG_SUGGESTION_COUNT = 8;

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

/** 将模型输出的推荐档位收敛到第二版允许的三档。 */
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

/** 归一化分类的直接应用结果。 */
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

/** 归一化更贴切的新分类建议。 */
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

/** 归一化现有标签列表，并限制异常过多的模型输出。 */
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

  return sortByLevel(normalized).slice(0, MAX_TAG_SUGGESTION_COUNT);
}

/** 归一化新增标签建议，并限制异常过多的模型输出。 */
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

  return sortByLevel(normalized).slice(0, MAX_TAG_SUGGESTION_COUNT);
}

/** 归一化模型 warnings 列表，并按正文长度补充必要提醒。 */
export function normalizeWarnings(value: unknown, content: string) {
  const warnings = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (content.trim().length < 120) {
    warnings.unshift('正文较短，AI 建议可能不稳定。');
  }

  return Array.from(new Set(warnings.filter(Boolean))).slice(0, MAX_WARNING_COUNT);
}
