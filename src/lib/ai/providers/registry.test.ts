import test from 'node:test';
import assert from 'node:assert/strict';

import { createAiProviderRuntime } from './registry';
import type { AiRuntimeConfig } from '../config';

/** 构造最小可用的测试配置，避免依赖真实环境变量。 */
function createConfig(provider: AiRuntimeConfig['provider']): AiRuntimeConfig {
  return {
    provider,
    timeoutMs: 45000,
    aliyunBailian: {
      apiKey: 'test-key',
      baseUrl: 'https://example.aliyun.test',
      model: 'qwen-test',
    },
    ollama: {
      baseUrl: 'http://127.0.0.1:11434',
      model: 'qwen-local',
    },
  };
}

/**
 * 验证显式选择百炼 provider 时，不会回退到其他实现，且请求结构符合预期。
 */
test('createAiProviderRuntime configures explicit aliyun provider without fallback', async () => {
  const runtime = createAiProviderRuntime(createConfig('aliyun-bailian'));

  assert.equal(runtime.timeoutMs, 45000);
  assert.equal(runtime.client.name, 'aliyun-bailian');

  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init });
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: 'ok' } }],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }) as typeof fetch;

  try {
    const result = await runtime.client.generate({
      systemPrompt: 'system',
      userPrompt: 'user',
      timeoutMs: runtime.timeoutMs,
    });

    assert.equal(result, 'ok');
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0]?.url, 'https://example.aliyun.test/chat/completions');
    assert.deepEqual(fetchCalls[0]?.init?.headers, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-key',
    });
    assert.match(String(fetchCalls[0]?.init?.body), /"model":"qwen-test"/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/**
 * 验证显式选择 Ollama provider 时，请求会发往本地生成接口且不发生 fallback。
 */
test('createAiProviderRuntime configures explicit ollama provider without fallback', async () => {
  const runtime = createAiProviderRuntime(createConfig('ollama'));

  assert.equal(runtime.timeoutMs, 45000);
  assert.equal(runtime.client.name, 'ollama');

  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init });
    return new Response(JSON.stringify({ response: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const result = await runtime.client.generate({
      systemPrompt: 'system',
      userPrompt: 'user',
      timeoutMs: runtime.timeoutMs,
    });

    assert.equal(result, 'ok');
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0]?.url, 'http://127.0.0.1:11434/api/generate');
    assert.match(String(fetchCalls[0]?.init?.body), /"model":"qwen-local"/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
