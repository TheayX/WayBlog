/**
 * AI 提示词模块的统一导出入口。
 *
 * 供服务层按场景选择全文优化或字段优化提示词生成函数，
 * 这样上层无需感知各个子模块的具体文件位置。
 */
export { AI_SYSTEM_PROMPT } from '@/lib/ai/prompts/shared';
export { buildOptimizeFieldPrompt } from '@/lib/ai/prompts/optimize-field';
export { buildOptimizePostPrompt } from '@/lib/ai/prompts/optimize-post';
