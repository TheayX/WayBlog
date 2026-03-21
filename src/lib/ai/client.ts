import type {
  AiFieldInput,
  AiFieldResult,
  AiOptimizeInput,
  AiOptimizeResult,
  AiSuggestionCategory,
  AiSuggestionTag,
} from '@/lib/ai/types';
import { AI_SYSTEM_PROMPT, buildAiFieldPrompt, buildAiOptimizePrompt } from '@/lib/ai/prompts';
import { slugify } from '@/lib/utils';

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

function normalizeCategory(value: unknown): AiSuggestionCategory | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const name = getString(record.name);
  if (!name) return null;

  return {
    id: getString(record.id) || undefined,
    name,
    reason: getString(record.reason) || undefined,
  };
}

function normalizeTags(value: unknown): AiSuggestionTag[] {
  if (!Array.isArray(value)) return [];

  const normalized: AiSuggestionTag[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;
    const name = getString(record.name);
    if (!name) continue;

    normalized.push({
      id: getString(record.id) || undefined,
      name,
      reason: getString(record.reason) || undefined,
      isNew: Boolean(record.isNew),
    });
  }

  return normalized.slice(0, 5);
}

function normalizeWarnings(value: unknown, content: string) {
  const warnings = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (content.trim().length < 120) {
    warnings.unshift('正文较短，AI 建议可能不稳定。');
  }

  return Array.from(new Set(warnings.filter(Boolean))).slice(0, 5);
}

function normalizeOptimizeResult(
  parsed: Record<string, unknown>,
  input: AiOptimizeInput,
): AiOptimizeResult {
  const title = getString(parsed.title) || input.title.trim() || '未命名文章';
  const content = getString(parsed.content) || input.content.trim();
  const excerpt = getString(parsed.excerpt) || input.excerpt.trim();
  const rawSlug = getString(parsed.slug) || title;

  return {
    title,
    slug: slugify(rawSlug).slice(0, 255),
    excerpt: excerpt.slice(0, 500),
    content,
    categorySuggestion: normalizeCategory(parsed.categorySuggestion),
    tagSuggestions: normalizeTags(parsed.tagSuggestions),
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}

function normalizeFieldResult(parsed: Record<string, unknown>, input: AiFieldInput): AiFieldResult {
  const value = getString(parsed.value);
  const normalizedValue =
    input.field === 'slug' ? slugify(value || input.title || input.slug).slice(0, 255) : value;

  return {
    field: input.field,
    value: normalizedValue || undefined,
    categorySuggestion: normalizeCategory(parsed.categorySuggestion),
    tagSuggestions: normalizeTags(parsed.tagSuggestions),
    warnings: normalizeWarnings(parsed.warnings, input.content),
  };
}

async function callOllama(prompt: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
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

export async function optimizePostWithOllama(input: AiOptimizeInput): Promise<AiOptimizeResult> {
  const parsed = await callOllama(buildAiOptimizePrompt(input));
  return normalizeOptimizeResult(parsed, input);
}

export async function optimizeFieldWithOllama(input: AiFieldInput): Promise<AiFieldResult> {
  const parsed = await callOllama(buildAiFieldPrompt(input));
  return normalizeFieldResult(parsed, input);
}
