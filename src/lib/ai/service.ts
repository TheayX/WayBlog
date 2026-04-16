import type { AiFieldInput, AiFieldResult, AiOptimizeInput, AiOptimizeResult } from '@/lib/ai/types';
import { getAiConfig } from '@/lib/ai/config';
import { normalizeOptimizeFieldResult } from '@/lib/ai/normalizers/optimize-field';
import { normalizeOptimizePostResult } from '@/lib/ai/normalizers/optimize-post';
import { extractJsonObject } from '@/lib/ai/normalizers/shared';
import { buildOptimizeFieldPrompt } from '@/lib/ai/prompts/optimize-field';
import { buildOptimizePostPrompt } from '@/lib/ai/prompts/optimize-post';
import { AI_SYSTEM_PROMPT } from '@/lib/ai/prompts/shared';
import { createAiProviderRuntime } from '@/lib/ai/providers/registry';

/**
 * 统一执行一次 AI 调用。
 * 服务层负责串联配置解析、provider 选择、系统提示词注入与 JSON 结果提取，
 * 上层无需关心具体模型供应商差异。
 */
async function callAi(userPrompt: string) {
  const runtime = createAiProviderRuntime(getAiConfig());
  const raw = await runtime.client.generate({
    systemPrompt: AI_SYSTEM_PROMPT,
    userPrompt,
    timeoutMs: runtime.timeoutMs,
  });

  return JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
}

/**
 * 对文章多个字段执行一次性优化。
 * 适合管理后台的整体预览场景，返回结构会先经过归一化，避免 UI 直接消费原始模型输出。
 */
export async function optimizePostWithAi(input: AiOptimizeInput): Promise<AiOptimizeResult> {
  const parsed = await callAi(buildOptimizePostPrompt(input));
  return normalizeOptimizePostResult(parsed, input);
}

/**
 * 对指定字段执行局部优化。
 * 适合标题、Slug、摘要等快速改写场景，返回值会按字段类型做对应的归一化处理。
 */
export async function optimizeFieldWithAi(input: AiFieldInput): Promise<AiFieldResult> {
  const parsed = await callAi(buildOptimizeFieldPrompt(input));
  return normalizeOptimizeFieldResult(parsed, input);
}
