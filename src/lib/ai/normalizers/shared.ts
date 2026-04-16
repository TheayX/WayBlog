import type {
  AiFieldInput,
  AiOptimizeInput,
  AiSuggestionCategory,
  AiSuggestionTag,
} from '@/lib/ai/types';

/**
 * 归一化模块的共享工具集合。
 * 负责把模型返回的宽松 JSON 数据清洗成前端与路由处理器都能稳定消费的结构。
 */

/** 安全读取字符串字段，并在缺失时回退到默认值。 */
export function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

/**
 * 从模型原始文本中提取首个 JSON 对象。
 * 用来兼容 provider 偶发附带说明文字的情况，确保后续 `JSON.parse` 可以稳定执行。
 */
export function extractJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object');
  }

  return raw.slice(start, end + 1);
}

/** 去掉模型偶尔包裹在外层的 Markdown 代码围栏。 */
export function stripOuterCodeFence(text: string) {
  return text
    .replace(/^```(?:markdown|md|json|text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * 归一化 Markdown 正文。
 * 主要处理换行格式、代码围栏包裹和空字符串回退逻辑。
 */
export function normalizeMarkdown(value: string, fallback: string) {
  const normalized = stripOuterCodeFence(value).replace(/\r\n/g, '\n').trim();
  return normalized || fallback.trim();
}

/**
 * 将摘要收敛到适合博客列表展示的长度范围。
 * 模型输出过长时优先尝试按句号截断，否则回退到固定长度裁剪。
 */
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

/**
 * 归一化分类推荐结果。
 * 如果模型返回的名称能命中现有候选分类，则优先回填已有 id，避免前端把已有分类误判为新分类。
 */
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

/**
 * 归一化标签推荐列表。
 * 会优先复用现有候选标签的 id，并按名称去重，同时把数量限制在后台可直接消费的范围内。
 */
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

    // 用名称去重，避免模型给出大小写不同但语义相同的重复标签。
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

/**
 * 归一化模型 warnings 列表，并按正文长度补充必要提醒。
 * 这样即便模型没有显式指出风险，前端仍能在内容过短时提示结果可能不稳定。
 */
export function normalizeWarnings(value: unknown, content: string) {
  const warnings = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (content.trim().length < 120) {
    warnings.unshift('正文较短，AI 建议可能不稳定。');
  }

  return Array.from(new Set(warnings.filter(Boolean))).slice(0, 5);
}
