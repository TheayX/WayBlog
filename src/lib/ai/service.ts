import type { AiFieldInput, AiFieldResult, AiOptimizeInput, AiOptimizeResult } from '@/lib/ai/types';
import { getAiConfig } from '@/lib/ai/config';
import { normalizeOptimizeFieldResult } from '@/lib/ai/normalizers/optimize-field';
import { normalizeOptimizePostResult } from '@/lib/ai/normalizers/optimize-post';
import { extractJsonObject } from '@/lib/ai/normalizers/shared';
import { buildOptimizeFieldPrompt } from '@/lib/ai/prompts/optimize-field';
import { buildOptimizePostPrompt } from '@/lib/ai/prompts/optimize-post';
import { AI_SYSTEM_PROMPT } from '@/lib/ai/prompts/shared';
import { createAiProviderRuntime } from '@/lib/ai/providers/registry';

async function callAi(userPrompt: string) {
  const runtime = createAiProviderRuntime(getAiConfig());
  const raw = await runtime.client.generate({
    systemPrompt: AI_SYSTEM_PROMPT,
    userPrompt,
    timeoutMs: runtime.timeoutMs,
  });

  return JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
}

export async function optimizePostWithAi(input: AiOptimizeInput): Promise<AiOptimizeResult> {
  const parsed = await callAi(buildOptimizePostPrompt(input));
  return normalizeOptimizePostResult(parsed, input);
}

export async function optimizeFieldWithAi(input: AiFieldInput): Promise<AiFieldResult> {
  const parsed = await callAi(buildOptimizeFieldPrompt(input));
  return normalizeOptimizeFieldResult(parsed, input);
}
