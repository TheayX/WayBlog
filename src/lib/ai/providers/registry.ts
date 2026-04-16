import type { AiRuntimeConfig } from '@/lib/ai/config';
import { createAliyunBailianProvider } from '@/lib/ai/providers/aliyun-bailian';
import { createOllamaProvider } from '@/lib/ai/providers/ollama';
import type { AiProviderRuntime } from '@/lib/ai/providers/types';

export function createAiProviderRuntime(config: AiRuntimeConfig): AiProviderRuntime {
  switch (config.provider) {
    case 'aliyun-bailian':
      return {
        client: createAliyunBailianProvider(config.aliyunBailian),
        timeoutMs: config.timeoutMs,
      };
    case 'ollama':
      return {
        client: createOllamaProvider(config.ollama),
        timeoutMs: config.timeoutMs,
      };
    default: {
      const exhaustiveCheck: never = config.provider;
      throw new Error(`Unsupported AI provider: ${exhaustiveCheck}`);
    }
  }
}
