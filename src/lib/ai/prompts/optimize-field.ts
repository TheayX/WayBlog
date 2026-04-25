import type { AiFieldInput } from '@/lib/ai/types';
import { buildJsonOnlyPrompt, FIELD_RULES } from '@/lib/ai/prompts/shared';

/**
 * 字段级优化输出样例。
 * taxonomy suggestion v2 也在字段级接口中使用同一套结构。
 */
const FIELD_OUTPUTS = {
  identity: `{
  "title": "优化后的标题",
  "slug": "optimized-slug",
  "warnings": ["可选提醒"]
}`,
  title: `{
  "value": "优化后的标题",
  "warnings": ["可选提醒"]
}`,
  slug: `{
  "value": "optimized-slug",
  "warnings": ["可选提醒"]
}`,
  content: `{
  "value": "优化后的纯 Markdown 正文",
  "warnings": ["可选提醒"]
}`,
  excerpt: `{
  "value": "优化后的摘要",
  "warnings": ["可选提醒"]
}`,
  category: `{
  "selectedCategory": {
    "id": "候选分类 id，没有则省略",
    "name": "现有分类名称",
    "level": "strong",
    "reason": "推荐原因，简短"
  },
  "betterCategorySuggestion": {
    "name": "更合适的新分类名称",
    "level": "medium",
    "reason": "为什么更贴切，简短",
    "isNew": true
  },
  "warnings": ["可选提醒"]
}`,
  tags: `{
  "selectedTags": [
    {
      "id": "候选标签 id，没有则省略",
      "name": "现有标签名称",
      "level": "strong",
      "reason": "推荐原因，简短"
    }
  ],
  "newTagSuggestions": [
    {
      "name": "建议新增标签",
      "level": "medium",
      "reason": "为什么应该新增，简短",
      "isNew": true
    }
  ],
  "warnings": ["可选提醒"]
}`,
} as const;

/** 字段级优化的人类指令文本。 */
const FIELD_INSTRUCTIONS = {
  identity: '请统一优化文章标题与 slug，保证两者表达一致。',
  title: '请仅优化文章标题。',
  slug: '请仅生成更合适的 slug。',
  content: '请仅优化正文内容。',
  excerpt: '请仅生成或优化文章摘要。',
  category: '请仅给出 taxonomy suggestion v2 分类建议。',
  tags: '请仅给出 taxonomy suggestion v2 标签建议。',
} as const;

/**
 * 生成字段级优化提示词。
 * 会根据目标字段选择对应的规则、说明文本与 JSON 输出模板。
 */
export function buildOptimizeFieldPrompt(input: AiFieldInput) {
  return buildJsonOnlyPrompt(
    FIELD_INSTRUCTIONS[input.field],
    input,
    FIELD_RULES[input.field],
    FIELD_OUTPUTS[input.field],
  );
}
