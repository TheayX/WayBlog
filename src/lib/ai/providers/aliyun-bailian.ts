import type { AiProviderClient, AiProviderRequest } from '@/lib/ai/providers/types';

/** 阿里云百炼 provider 的配置结构。 */
interface BailianProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface BailianChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function truncateText(value: string, maxLength = 300) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

/**
 * 创建阿里云百炼 provider。
 * 负责把统一的请求结构转换为百炼兼容接口所需的 chat completions 请求体。
 */
export function createAliyunBailianProvider(config: BailianProviderConfig): AiProviderClient {
  return {
    name: 'aliyun-bailian',
    async generate({ systemPrompt, userPrompt, timeoutMs }: AiProviderRequest) {
      // 百炼 provider 依赖服务端密钥，缺失时直接失败，避免发起无效请求。
      if (!config.apiKey) {
        throw new Error('Missing DASHSCOPE_API_KEY');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.2,
            enable_thinking: false,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = truncateText(await response.text());
          throw new Error(
            `Aliyun Bailian request failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`,
          );
        }

        const data = (await response.json()) as BailianChatCompletionResponse;
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
          throw new Error('Aliyun Bailian returned empty response');
        }

        return content;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
