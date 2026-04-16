/**
 * AI 提示词共享规则与构造工具。
 *
 * 这里集中维护系统提示词、字段级/全文级共用约束和 JSON 输出模板拼装函数，
 * 避免不同提示词文件之间出现要求漂移。
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
  '摘要控制在 60 到 140 个中文字符之间',
  '分类优先从候选分类中选择一个',
  '标签优先从候选标签中选择 2 到 5 个；确实没有合适标签时最多新增 2 个',
] as const;

/** 不同字段的专属优化约束，供字段级提示词按目标字段动态拼装。 */
export const FIELD_RULES = {
  title: ['保留原意', '标题更自然、更准确，适合技术博客', '不夸张，不标题党'],
  slug: ['基于标题和正文核心含义生成', '只允许小写字母、数字、连字符', '尽量短且清晰'],
  content: [
    '输出纯 Markdown',
    '在不新增事实的前提下，允许中度改写句子、段落和结构',
    '需要时自动补充合理小节、列表和分段',
    '不要只做格式整理；如果原文表达生硬、重复或松散，要主动优化到更适合发布的状态',
    '可以拆分长句、合并重复信息、调整段落顺序，但不要大幅扩写',
    '如果原文已经足够清晰，再做最小必要修改',
  ],
  excerpt: ['一到两句话', '概括主题和价值', '长度控制在 60 到 140 个中文字符', '不写空泛评价'],
  category: ['优先从候选分类中选择', '只推荐一个', '原因简短明确'],
  tags: [
    '优先从候选标签中选择 2 到 5 个',
    '如果确实没有合适标签，最多新增 2 个建议标签',
    '原因简短明确',
  ],
} as const;

export const AI_SYSTEM_PROMPT = `
你是中文技术博客写作助手。

目标：
- 在保留原意和事实的前提下优化表达
- 输出适合发布的 Markdown 内容与元信息建议

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
