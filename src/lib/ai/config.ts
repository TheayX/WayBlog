/**
 * AI 运行时配置入口。
 *
 * 负责从环境变量解析 provider、超时和不同模型供应商的连接信息，
 * 避免路由处理器或服务层直接散落读取 `process.env`。
 */
export type AiProvider = 'aliyun-bailian' | 'ollama';

const DEFAULT_AI_PROVIDER: AiProvider = 'aliyun-bailian';

/** 读取字符串配置并在缺失时回退到给定默认值。 */
function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

/** 读取正数配置，主要用于超时等数值型环境变量。 */
function getNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * 解析 AI provider。
 * 未显式配置时回退到默认 provider；出现未知值时直接抛错，避免服务在不明确的供应商配置下运行。
 */
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
  /** 当前启用的 provider。 */
  provider: AiProvider;
  /** 单次模型调用允许的最长耗时。 */
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

/**
 * 组装 AI 运行时配置。
 * 该函数只负责解析配置，不校验 provider 是否真的可连通；连通性问题留给具体 provider 调用阶段处理。
 */
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

/** 将 provider 内部标识转换为适合管理后台展示的可读名称。 */
export function getAiProviderLabel(provider: AiProvider): string {
  return provider === 'aliyun-bailian' ? '阿里百炼' : 'Ollama';
}
