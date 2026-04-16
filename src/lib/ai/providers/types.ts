import type { AiProvider } from '@/lib/ai/config';

/** provider 层统一请求载荷。 */
export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
}

/**
 * 单个 provider 需要实现的最小能力。
 * 不论底层是百炼还是 Ollama，对服务层都统一暴露 `generate` 方法。
 */
export interface AiProviderClient {
  name: AiProvider;
  generate(request: AiProviderRequest): Promise<string>;
}

/** provider 运行时对象，额外携带当前生效的超时设置。 */
export interface AiProviderRuntime {
  client: AiProviderClient;
  timeoutMs: number;
}
