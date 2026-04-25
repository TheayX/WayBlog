import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeBetterCategorySuggestion,
  normalizeSelectedCategory,
  normalizeSelectedTags,
  normalizeSuggestionLevel,
  parseModelJsonObject,
} from '@/lib/ai/normalizers/shared';

const input = {
  title: '测试',
  slug: 'test',
  content: '正文',
  excerpt: '',
  categoryId: null,
  tagIds: [],
  categories: [
    { id: 'category-1', name: '技术' },
    { id: 'category-2', name: '生活' },
  ],
  tags: [
    { id: 'tag-1', name: 'Next.js' },
    { id: 'tag-2', name: 'Prisma' },
  ],
};

describe('parseModelJsonObject', () => {
  it('extracts a JSON object from provider text', () => {
    const parsed = parseModelJsonObject('说明文字 {"title":"测试"}');

    assert.equal(parsed.title, '测试');
  });

  it('rejects non-object JSON payloads', () => {
    assert.throws(() => parseModelJsonObject('[{"title":"测试"}]'));
  });
});

describe('normalizeSuggestionLevel', () => {
  it('keeps supported levels', () => {
    assert.equal(normalizeSuggestionLevel('strong'), 'strong');
    assert.equal(normalizeSuggestionLevel('medium'), 'medium');
    assert.equal(normalizeSuggestionLevel('weak'), 'weak');
  });

  it('falls back to medium for unsupported values', () => {
    assert.equal(normalizeSuggestionLevel('92'), 'medium');
    assert.equal(normalizeSuggestionLevel('high'), 'medium');
  });
});

describe('taxonomy normalization', () => {
  it('matches existing category by name', () => {
    const normalized = normalizeSelectedCategory(
      { name: '技术', level: 'strong', reason: '最接近主题' },
      input,
    );

    assert.deepEqual(normalized, {
      id: 'category-1',
      name: '技术',
      level: 'strong',
      reason: '最接近主题',
    });
  });

  it('normalizes better category suggestion as new candidate', () => {
    const normalized = normalizeBetterCategorySuggestion({
      name: '前端工程',
      level: 'medium',
      reason: '更贴近正文主题',
    });

    assert.deepEqual(normalized, {
      name: '前端工程',
      level: 'medium',
      reason: '更贴近正文主题',
      isNew: true,
    });
  });

  it('sorts selected tags by level and deduplicates by name', () => {
    const normalized = normalizeSelectedTags(
      [
        { name: 'prisma', level: 'medium', reason: '数据层' },
        { name: 'Next.js', level: 'strong', reason: '主框架' },
        { name: 'Prisma', level: 'weak', reason: '重复项' },
      ],
      input,
    );

    assert.deepEqual(normalized, [
      {
        id: 'tag-1',
        name: 'Next.js',
        level: 'strong',
        reason: '主框架',
      },
      {
        id: 'tag-2',
        name: 'Prisma',
        level: 'medium',
        reason: '数据层',
      },
    ]);
  });
});
