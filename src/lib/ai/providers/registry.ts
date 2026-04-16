import type { AiRuntimeConfig } from '@/lib/ai/config';
import { createAliyunBailianProvider } from '@/lib/ai/providers/aliyun-bailian';
import { createOllamaProvider } from '@/lib/ai/providers/ollama';
import type { AiProviderRuntime } from '@/lib/ai/providers/types';

/**
 * 根据运行时配置创建实际 provider。
 * 服务层只依赖这个注册表，不直接判断不同供应商的实现细节。
 */
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
