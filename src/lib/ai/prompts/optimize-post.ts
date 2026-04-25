import type { AiOptimizeInput } from '@/lib/ai/types';
import {
  buildJsonOnlyPrompt,
  FIELD_RULES,
  resolvePromptProfile,
} from '@/lib/ai/prompts/shared';

/**
 * 生成文章整体优化提示词。
 * 第二版分类与标签建议改为档位制输出，并显式区分“可直接应用”和“新增建议”。
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
      '分类使用 selectedCategory 和 betterCategorySuggestion；标签使用 selectedTags 和 newTagSuggestions',
      ...FIELD_RULES.category,
      ...FIELD_RULES.tags,
      ...profile.rules,
    ],
    `{
  "title": "优化后的标题",
  "slug": "optimized-slug",
  "excerpt": "优化后的摘要",
  "content": "优化后的纯 Markdown 正文",
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
  );
}
