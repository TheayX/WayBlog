import { AI_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { getAiConfig } from '@/lib/ai/config';

interface BailianChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function extractJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object');
  }

  return raw.slice(start, end + 1);
}

// 百炼兼容 OpenAI Chat Completions，这里只保留项目当前需要的最小字段。
export async function callAliyunBailian(prompt: string): Promise<Record<string, unknown>> {
  const config = getAiConfig();

  if (!config.aliyunBailian.apiKey) {
    throw new Error('Missing DASHSCOPE_API_KEY');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.aliyunBailian.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aliyunBailian.apiKey}`,
      },
      body: JSON.stringify({
        model: config.aliyunBailian.model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: AI_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Aliyun Bailian request failed with status ${response.status}`);
    }

    const data = (await response.json()) as BailianChatCompletionResponse;
    const raw = getString(data.choices?.[0]?.message?.content);

    if (!raw) {
      throw new Error('Aliyun Bailian returned empty response');
    }

    return JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}
