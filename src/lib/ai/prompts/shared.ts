import type { AiOptimizeInput } from '@/lib/ai/types';

/**
 * AI 提示词共享规则与构造工具。
 * 第二版分类与标签建议在这里统一约束为档位制输出。
 */
const JSON_ONLY_RULE = '输出必须是合法 JSON，不要使用 Markdown 代码围栏';
const BRIEF_WARNING_RULE = 'warnings 仅用于输出简短提醒，没有则返回空数组';
const TAXONOMY_LEVEL_RULE =
  '分类和标签的推荐档位只能使用 strong、medium、weak；不要输出百分比、分数或其他档位名称';

const COMMON_PROMPT_RULES = [
  '不编造输入中没有依据的事实',
  JSON_ONLY_RULE,
  BRIEF_WARNING_RULE,
  TAXONOMY_LEVEL_RULE,
] as const;

const POST_RULES = [
  '正文 content 必须是纯 Markdown',
  'slug 只能包含小写字母、数字、连字符',
  '摘要用一到两句话概括',
  '分类和标签优先从候选项中选择',
] as const;

/** 不同字段的专属优化约束，供字段级提示词按目标字段动态拼装。 */
export const FIELD_RULES = {
  identity: ['标题与 slug 需要语义一致', 'slug 基于最终标题和正文核心含义生成', '不要额外发明主题'],
  title: ['保留原意', '表达自然准确', '不夸张，不标题党'],
  slug: ['基于标题和正文核心含义生成', '只允许小写字母、数字、连字符'],
  content: ['输出纯 Markdown', '优先修正表达不清、重复和结构松散的问题', '默认按轻整理处理，不大改原有结构', '不要新增事实'],
  excerpt: ['一到两句话', '优先基于正文提炼关键信息', '不要复述标题', '不写空泛评价'],
  category: [
    '分类只推荐一个主分类',
    '只有在现有分类足够合适时才放入 selectedCategory',
    '如果现有分类可用但不够贴切，可同时给出 betterCategorySuggestion',
    '如果没有合适现有分类，不要硬选，直接给新增分类建议',
  ],
  tags: [
    '标签可以推荐多个，但不要为了凑数量硬给',
    '优先复用现有标签，但没有合适标签时必须尽量给新增建议',
    '现有标签和新增标签建议可以同时存在',
    '不要因为文章简单就硬凑标签，也不要因为谨慎而完全不给建议',
  ],
} as const;

const PROMPT_PROFILES = {
  default: {
    label: '通用文章',
    rules: ['保持自然清晰的中文表达'],
  },
  technical: {
    label: '技术文章',
    rules: ['保留术语、代码标识和关键步骤', '优先让结构便于复盘和排查问题'],
  },
  essay: {
    label: '随笔复盘',
    rules: ['保留个人表达和情绪色彩', '不要改成营销文或教程腔'],
  },
} as const;

/**
 * 根据已有标题、正文、分类和标签选择轻量提示词模板。
 * 当前仍保持保守关键词判断，避免在 taxonomy v2 升级时同时放大 profile 复杂度。
 */
export function resolvePromptProfile(input: AiOptimizeInput) {
  const taxonomyText = [
    input.title,
    input.content,
    ...input.categories.map((item) => item.name),
    ...input.tags.map((item) => item.name),
  ]
    .join(' ')
    .toLowerCase();

  if (/(代码|编程|开发|架构|数据库|前端|后端|react|next|prisma|typescript)/i.test(taxonomyText)) {
    return PROMPT_PROFILES.technical;
  }

  if (/(随笔|生活|复盘|感想|记录|思考|日记)/i.test(taxonomyText)) {
    return PROMPT_PROFILES.essay;
  }

  return PROMPT_PROFILES.default;
}

export const AI_SYSTEM_PROMPT = `
你是中文技术博客写作助手。
目标：
- 在保留原意和事实的前提下优化表达
- 输出基础可用的 Markdown 内容与元信息建议

硬性要求：
${formatRuleList([...COMMON_PROMPT_RULES, ...POST_RULES])}
`.trim();

/** 将规则数组格式化为多行列表，便于直接嵌入提示词正文。 */
export function formatRuleList(rules: readonly string[]) {
  return rules.map((rule) => `- ${rule}`).join('\n');
}

/**
 * 构造“只返回 JSON”格式的最终提示词。
 * 统一把输入、规则与期望输出样例组合起来，降低各个具体提示词文件的重复代码。
 */
export function buildJsonOnlyPrompt(
  instruction: string,
  input: unknown,
  rules: readonly string[],
  output: string,
) {
  return `
${instruction}

输入：${JSON.stringify(input, null, 2)}

要求：
${formatRuleList([...COMMON_PROMPT_RULES, ...rules])}

只返回 JSON：${output}
  `.trim();
}
