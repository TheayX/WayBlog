import type { AiOptimizeInput } from '@/lib/ai/types';
import { buildJsonOnlyPrompt } from '@/lib/ai/prompts/shared';

export function buildOptimizePostPrompt(input: AiOptimizeInput) {
  return buildJsonOnlyPrompt(
    '请基于下面的输入，生成完整的文章优化结果。',
    input,
    [
      '优化标题、slug、摘要、正文',
      '正文可以中度改写，但不得偏离原意',
      '可以补充必要的小节、列表和分段',
      '优先提升可读性、信息密度和发布质量',
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
