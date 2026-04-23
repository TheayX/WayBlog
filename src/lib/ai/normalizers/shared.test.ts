import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseModelJsonObject } from '@/lib/ai/normalizers/shared';

describe('parseModelJsonObject', () => {
  it('extracts a JSON object from provider text', () => {
    const parsed = parseModelJsonObject('说明文字 {"title":"测试"}');

    assert.equal(parsed.title, '测试');
  });

  it('rejects non-object JSON payloads', () => {
    assert.throws(() => parseModelJsonObject('[{"title":"测试"}]'));
  });
});
