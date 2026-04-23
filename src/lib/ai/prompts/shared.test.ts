import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePromptProfile } from '@/lib/ai/prompts/shared';
import type { AiOptimizeInput } from '@/lib/ai/types';

function createInput(input: Partial<AiOptimizeInput>): AiOptimizeInput {
  return {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tagIds: [],
    categories: [],
    tags: [],
    ...input,
  };
}

describe('resolvePromptProfile', () => {
  it('detects technical writing from title and tags', () => {
    const profile = resolvePromptProfile(
      createInput({
        title: 'Next.js 缓存策略整理',
        tags: [{ id: 'tag-1', name: 'React' }],
      }),
    );

    assert.equal(profile.label, '技术文章');
  });

  it('detects essay writing from reflective keywords', () => {
    const profile = resolvePromptProfile(
      createInput({
        title: '最近的一点生活复盘',
      }),
    );

    assert.equal(profile.label, '随笔复盘');
  });
});
