import type { AiOptimizeInput } from '@/lib/ai/types';

/**
 * AI 提示词共享规则与构造工具。
 *
 * 这里集中维护系统提示词、字段级/全文级共用约束和 JSON 输出模板拼装函数。
 * 提示词先保持基础可用，后续只按真实失败案例逐步补充规则。
 */
const JSON_ONLY_RULE = '输出必须是合法 JSON，不要使用 Markdown 代码围栏';
const BRIEF_WARNING_RULE = 'warnings 仅用于输出简短提醒，没有则返回空数组';

const COMMON_PROMPT_RULES = [
  '不编造输入中没有依据的事实',
  JSON_ONLY_RULE,
  BRIEF_WARNING_RULE,
] as const;

const POST_RULES = [
  '正文 content 必须是纯 Markdown',
  'slug 只能包含小写字母、数字、连字符',
  '摘要用一到两句话概括',
  '分类和标签优先从候选项中选择',
] as const;

/** 不同字段的专属优化约束，供字段级提示词按目标字段动态拼装。 */
export const FIELD_RULES = {
  identity: ['标题与 slug 需要语义一致', 'slug 基于最终标题和正文核心含义生成', '不额外发明主题'],
  title: ['保留原意', '表达自然准确', '不夸张，不标题党'],
  slug: ['基于标题和正文核心含义生成', '只允许小写字母、数字、连字符'],
  content: ['输出纯 Markdown', '优先修正表达不清、重复和结构松散的问题', '不要新增事实'],
  excerpt: ['一到两句话', '概括主题和价值', '不写空泛评价'],
  category: ['优先从候选分类中选择', '只推荐一个'],
  tags: ['优先从候选标签中选择', '数量保持克制'],
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
 * 这里先只做保守关键词判断，后续再按真实失败案例扩展 profile。
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

输入：
${JSON.stringify(input, null, 2)}

要求：
${formatRuleList([...COMMON_PROMPT_RULES, ...rules])}

只返回 JSON：
${output}
  `.trim();
}
