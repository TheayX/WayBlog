export type AiProvider = 'ollama' | 'aliyun-bailian';

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function getNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// 统一读取 AI 配置，避免路由和 provider 实现直接依赖零散环境变量。
export function getAiConfig() {
  const provider = getString(process.env.AI_PROVIDER, 'ollama') as AiProvider;

  return {
    provider: provider === 'aliyun-bailian' ? provider : 'ollama',
    timeoutMs: getNumber(process.env.AI_TIMEOUT_MS, 120000),
    ollama: {
      baseUrl: getString(process.env.OLLAMA_BASE_URL, 'http://127.0.0.1:11434'),
      model: getString(process.env.OLLAMA_MODEL, 'qwen2.5:1.5b'),
    },
    aliyunBailian: {
      apiKey: getString(process.env.DASHSCOPE_API_KEY),
      baseUrl: getString(
        process.env.DASHSCOPE_BASE_URL,
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
      ),
      model: getString(process.env.DASHSCOPE_MODEL, 'qwen3.6-plus'),
    },
  };
}

export function getAiProviderLabel(provider: AiProvider) {
  return provider === 'aliyun-bailian' ? '阿里百炼' : 'Ollama';
}
