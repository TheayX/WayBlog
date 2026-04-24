import type { AiFieldInput } from '@/lib/ai/types';
import { buildJsonOnlyPrompt, FIELD_RULES } from '@/lib/ai/prompts/shared';

/**
 * 字段级优化输出样例。
 * 根据目标字段不同，约束模型返回的 JSON 结构，方便后续归一化逻辑稳定解析。
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
  "categorySuggestion": {
    "id": "候选分类 id，没有则省略",
    "name": "分类名称",
    "reason": "推荐原因，简短"
  },
  "warnings": ["可选提醒"]
}`,
  tags: `{
  "tagSuggestions": [
    {
      "id": "候选标签 id，新增标签可省略",
      "name": "标签名称",
      "reason": "推荐原因，简短",
      "isNew": false
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
  category: '请仅推荐一个最合适的分类。',
  tags: '请仅推荐标签。',
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
