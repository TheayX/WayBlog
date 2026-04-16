import { getString } from '@/lib/ai/normalizers/shared';
import type { AiProviderClient, AiProviderRequest } from '@/lib/ai/providers/types';

interface OllamaProviderConfig {
  baseUrl: string;
  model: string;
}

interface OllamaGenerateResponse {
  response?: string;
}

function truncateText(value: string, maxLength = 300) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

export function createOllamaProvider(config: OllamaProviderConfig): AiProviderClient {
  return {
    name: 'ollama',
    async generate({ systemPrompt, userPrompt, timeoutMs }: AiProviderRequest) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${config.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            stream: false,
            system: systemPrompt,
            prompt: userPrompt,
            options: {
              temperature: 0.2,
            },
          }),
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = truncateText(await response.text());
          throw new Error(
            `Ollama request failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`,
          );
        }

        const data = (await response.json()) as OllamaGenerateResponse;
        const content = getString(data.response);

        if (!content) {
          throw new Error('Ollama returned empty response');
        }

        return content;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
