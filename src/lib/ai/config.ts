export type AiProvider = 'aliyun-bailian' | 'ollama';

const DEFAULT_AI_PROVIDER: AiProvider = 'aliyun-bailian';

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function getNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseAiProvider(value: unknown): AiProvider {
  const provider = getString(value);

  if (!provider) {
    return DEFAULT_AI_PROVIDER;
  }

  if (provider === 'aliyun-bailian' || provider === 'ollama') {
    return provider;
  }

  throw new Error(
    `Invalid AI_PROVIDER value "${provider}". Expected one of: aliyun-bailian, ollama.`,
  );
}

export interface AiRuntimeConfig {
  provider: AiProvider;
  timeoutMs: number;
  aliyunBailian: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
  };
}

export function getAiConfig(): AiRuntimeConfig {
  const provider = parseAiProvider(process.env.AI_PROVIDER);

  return {
    provider,
    timeoutMs: getNumber(process.env.AI_TIMEOUT_MS, 120000),
    aliyunBailian: {
      apiKey: getString(process.env.DASHSCOPE_API_KEY),
      baseUrl: getString(
        process.env.DASHSCOPE_BASE_URL,
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
      ),
      model: getString(process.env.DASHSCOPE_MODEL, 'qwen3.6-plus'),
    },
    ollama: {
      baseUrl: getString(process.env.OLLAMA_BASE_URL, 'http://127.0.0.1:11434'),
      model: getString(process.env.OLLAMA_MODEL, 'qwen2.5:1.5b'),
    },
  };
}

export function getAiProviderLabel(provider: AiProvider): string {
  return provider === 'aliyun-bailian' ? '阿里百炼' : 'Ollama';
}
