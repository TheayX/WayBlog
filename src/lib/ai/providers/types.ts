import type { AiProvider } from '@/lib/ai/config';

export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
}

export interface AiProviderClient {
  name: AiProvider;
  generate(request: AiProviderRequest): Promise<string>;
}

export interface AiProviderRuntime {
  client: AiProviderClient;
  timeoutMs: number;
}
