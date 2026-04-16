import type {
  AiFieldInput,
  AiOptimizeInput,
  AiSuggestionCategory,
  AiSuggestionTag,
} from '@/lib/ai/types';

export function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function extractJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object');
  }

  return raw.slice(start, end + 1);
}

export function stripOuterCodeFence(text: string) {
  return text
    .replace(/^```(?:markdown|md|json|text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

export function normalizeMarkdown(value: string, fallback: string) {
  const normalized = stripOuterCodeFence(value).replace(/\r\n/g, '\n').trim();
  return normalized || fallback.trim();
}

export function clampExcerpt(value: string, fallback: string) {
  const source = stripOuterCodeFence(value || fallback)
    .replace(/\s+/g, ' ')
    .trim();

  if (!source) return '';
  if (source.length <= 140) return source;

  const sentence = source.match(/^.{60,140}?[。！？.!?]/)?.[0]?.trim();
  if (sentence && sentence.length >= 50) return sentence;

  return `${source.slice(0, 137).trim()}...`;
}

export function normalizeCategory(
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

export function normalizeTags(value: unknown, input: AiOptimizeInput | AiFieldInput): AiSuggestionTag[] {
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

export function normalizeWarnings(value: unknown, content: string) {
  const warnings = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (content.trim().length < 120) {
    warnings.unshift('正文较短，AI 建议可能不稳定。');
  }

  return Array.from(new Set(warnings.filter(Boolean))).slice(0, 5);
}
