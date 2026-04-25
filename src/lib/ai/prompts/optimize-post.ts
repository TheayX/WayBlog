import type { AiOptimizeInput } from '@/lib/ai/types';
import { buildJsonOnlyPrompt, resolvePromptProfile } from '@/lib/ai/prompts/shared';

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
      'selectedCategory 仅在现有分类足够合适时返回，否则返回 null',
      'betterCategorySuggestion 仅在存在更贴切的新分类时返回，否则返回 null',
      'selectedTags 仅包含建议直接应用的现有标签',
      'newTagSuggestions 在没有合适现有标签时仍应尽量给出，不要直接留空',
      '标签数量按内容复杂度自然决定，不要预设固定个数',
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
