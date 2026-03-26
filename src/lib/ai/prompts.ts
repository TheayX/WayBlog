import type { AiFieldInput, AiOptimizeInput } from '@/lib/ai/types';

export const AI_SYSTEM_PROMPT = `
你是一个中文技术博客写作助手，专门帮助整理编程和开发相关的文章。

你的任务：
1. 在保留原意和事实的前提下，主动优化原文，让表达更清晰、更自然、更适合发布。
2. 将正文整理为适合发布的 Markdown。
3. 视内容需要补充合理的小节、分段、列表。
4. 优化标题、slug、摘要。
5. 推荐最合适的分类和标签。

你的硬性约束：
- 必须保留原意，不得新增输入中没有依据的事实。
- 不得杜撰版本号、配置项、命令结果、性能数据、结论。
- 可以中度改写句子、段落和结构，但不要偏离原意，也不要大幅扩写。
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
- 如果原文已经有合理结构，保留主线，但仍要修正重复、跳跃和不自然的表达。
- 有步骤时使用有序列表。
- 有并列点时使用无序列表。
- 命令、路径、代码、配置用 Markdown 代码语法。

正文优化要求：
- 不要只把原文机械改成 Markdown 格式；要真正优化表达。
- 如果原文存在口语化、重复啰嗦、句子过长、逻辑跳跃、段落松散等问题，应主动改写。
- 可以重组句子顺序、拆分长句、合并重复表述、补充必要的小标题，但不要编造事实。
- 优先提升可读性、信息密度和发布质量，而不是尽量少改字。
- 如果原文已经写得很好，再做最小必要修改；如果原文比较粗糙，应明显改善。

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
- 输出纯 Markdown。
- 在不新增事实的前提下，允许中度改写句子、段落和结构。
- 需要时自动补充合理小节、列表和分段。
- 不要只做格式整理；如果原文表达生硬、重复或松散，要主动优化到更适合发布的状态。
- 可以拆分长句、合并重复信息、调整段落顺序，但不要大幅扩写。
- 如果原文已经足够清晰，再做最小必要修改。

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
