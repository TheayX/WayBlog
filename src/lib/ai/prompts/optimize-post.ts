import type { AiOptimizeInput } from '@/lib/ai/types';
import { buildJsonOnlyPrompt, resolvePromptProfile } from '@/lib/ai/prompts/shared';

/**
 * 生成文章整体优化提示词。
 * 该模块只负责组织输入、规则与输出样例，不直接触发模型调用。
 */
export function buildOptimizePostPrompt(input: AiOptimizeInput) {
  const profile = resolvePromptProfile(input);

  return buildJsonOnlyPrompt(
    `请基于下面的输入，生成完整的文章优化结果。文章类型：${profile.label}。`,
    input,
    [
      '优化标题、slug、摘要、正文',
      '正文只做必要整理和表达优化',
      '保持原有信息边界，不扩写新事实',
      '分类和标签以稳定归纳为主，不为凑覆盖面强行推荐',
      ...profile.rules,
    ],
    `{
  "title": "优化后的标题",
  "slug": "optimized-slug",
  "excerpt": "优化后的摘要",
  "content": "优化后的纯 Markdown 正文",
  "categorySuggestion": {
    "id": "候选分类 id，没有则省略",
    "name": "分类名称",
    "reason": "推荐原因，简短"
  },
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
  );
}
