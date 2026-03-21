import type { AiFieldInput, AiOptimizeInput } from '@/lib/ai/types';

export const AI_SYSTEM_PROMPT = `
你是一个中文技术博客写作助手，专门帮助整理编程和开发相关的文章。

你的任务：
1. 轻度润色原文，让表达更清晰、更自然。
2. 将正文整理为适合发布的 Markdown。
3. 视内容需要补充合理的小节、分段、列表。
4. 优化标题、slug、摘要。
5. 推荐最合适的分类和标签。

你的硬性约束：
- 必须保留原意，不得新增输入中没有依据的事实。
- 不得杜撰版本号、配置项、命令结果、性能数据、结论。
- 只做轻度润色，不做大幅扩写。
- 正文 content 必须是纯 Markdown，不要输出解释文字。
- 输出必须是合法 JSON，不要使用 Markdown 代码围栏。
- slug 只能包含小写字母、数字、连字符。
- 摘要控制在 60 到 140 个中文字符之间。
- 分类优先从候选分类中选一个。
- 标签优先从候选标签中选 2 到 5 个；如果确实没有合适标签，最多新增 2 个建议标签。

你的写作风格：
- 专业
- 简洁
- 实战导向
- 少空话
- 面向技术读者
`.trim();

export function buildAiOptimizePrompt(input: AiOptimizeInput) {
  return `
请基于下面的输入，生成整套文章优化建议。

输入：
${JSON.stringify(input, null, 2)}

正文结构规则：
- 如果内容像教程，优先整理为“简介 / 步骤 / 注意点 / 总结”。
- 如果内容像踩坑记录，优先整理为“问题 / 原因 / 解决 / 补充”。
- 如果原文已经有合理结构，尽量保留，仅做轻度整理。
- 有步骤时使用有序列表。
- 有并列点时使用无序列表。
- 命令、路径、代码、配置用 Markdown 代码语法。

请严格返回以下 JSON 结构，不要多输出任何说明文字：
{
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
}
  `.trim();
}

export function buildAiFieldPrompt(input: AiFieldInput) {
  const baseInput = JSON.stringify(input, null, 2);

  switch (input.field) {
    case 'title':
      return `
请仅优化文章标题。

输入：
${baseInput}

要求：
- 保留原意。
- 标题更自然、更准确，适合技术博客。
- 不夸张，不标题党。

只返回 JSON：
{
  "value": "优化后的标题",
  "warnings": ["可选提醒"]
}
      `.trim();

    case 'slug':
      return `
请仅生成更合适的 slug。

输入：
${baseInput}

要求：
- 基于标题和正文核心含义生成。
- 只允许小写字母、数字、连字符。
- 尽量短且清晰。

只返回 JSON：
{
  "value": "optimized-slug",
  "warnings": ["可选提醒"]
}
      `.trim();

    case 'content':
      return `
请仅优化正文内容。

输入：
${baseInput}

要求：
- 只做轻度润色。
- 输出纯 Markdown。
- 需要时自动补充合理小节、列表和分段。
- 不新增事实，不大幅扩写。

只返回 JSON：
{
  "value": "优化后的纯 Markdown 正文",
  "warnings": ["可选提醒"]
}
      `.trim();

    case 'excerpt':
      return `
请仅生成或优化文章摘要。

输入：
${baseInput}

要求：
- 一到两句话。
- 概括主题和价值。
- 长度控制在 60 到 140 个中文字符。
- 不写空泛评价。

只返回 JSON：
{
  "value": "优化后的摘要",
  "warnings": ["可选提醒"]
}
      `.trim();

    case 'category':
      return `
请仅推荐一个最合适的分类。

输入：
${baseInput}

要求：
- 优先从候选分类中选择。
- 只推荐一个。
- 原因简短明确。

只返回 JSON：
{
  "categorySuggestion": {
    "id": "候选分类 id，没有则省略",
    "name": "分类名称",
    "reason": "推荐原因，简短"
  },
  "warnings": ["可选提醒"]
}
      `.trim();

    case 'tags':
      return `
请仅推荐标签。

输入：
${baseInput}

要求：
- 优先从候选标签中选择 2 到 5 个。
- 如果确实没有合适标签，最多新增 2 个建议标签。
- 原因简短明确。

只返回 JSON：
{
  "tagSuggestions": [
    {
      "id": "候选标签 id，新增标签可省略",
      "name": "标签名称",
      "reason": "推荐原因，简短",
      "isNew": false
    }
  ],
  "warnings": ["可选提醒"]
}
      `.trim();
  }
}
