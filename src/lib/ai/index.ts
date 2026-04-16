import type { AiFieldInput, AiFieldResult, AiOptimizeInput, AiOptimizeResult } from '@/lib/ai/types';
import { buildAiFieldPrompt, buildAiOptimizePrompt } from '@/lib/ai/prompts';
import { getAiConfig } from '@/lib/ai/config';
import { callAliyunBailian } from '@/lib/ai/providers/aliyun-bailian';
import { callOllama } from '@/lib/ai/providers/ollama';
import {
  normalizeFieldResult,
  normalizeOptimizeResult,
} from '@/lib/ai/client';

async function callAiProvider(prompt: string) {
  const { provider } = getAiConfig();

  // 统一在这里切换 provider，业务层不再直接感知具体模型来源。
  if (provider === 'aliyun-bailian') {
    return callAliyunBailian(prompt);
  }

  return callOllama(prompt);
}

export async function optimizePostWithAi(input: AiOptimizeInput): Promise<AiOptimizeResult> {
  const parsed = await callAiProvider(buildAiOptimizePrompt(input));
  return normalizeOptimizeResult(parsed, input);
}

export async function optimizeFieldWithAi(input: AiFieldInput): Promise<AiFieldResult> {
  const parsed = await callAiProvider(buildAiFieldPrompt(input));
  return normalizeFieldResult(parsed, input);
}
