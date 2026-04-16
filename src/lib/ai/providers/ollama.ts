import { AI_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { getAiConfig } from '@/lib/ai/config';

interface OllamaGenerateResponse {
  response?: string;
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

// Ollama 返回的是纯文本，先从响应中裁出 JSON 再交给统一归一化流程处理。
export async function callOllama(prompt: string): Promise<Record<string, unknown>> {
  const config = getAiConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.model,
        stream: false,
        system: AI_SYSTEM_PROMPT,
        prompt,
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    const raw = getString(data.response);

    if (!raw) {
      throw new Error('Ollama returned empty response');
    }

    return JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}
