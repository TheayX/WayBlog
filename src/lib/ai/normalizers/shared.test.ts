import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeLegacyCategorySuggestionV1,
  normalizeLegacyTagSuggestionsV1,
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
  it('keeps supported v2 levels', () => {
    assert.equal(normalizeSuggestionLevel('strong'), 'strong');
    assert.equal(normalizeSuggestionLevel('medium'), 'medium');
    assert.equal(normalizeSuggestionLevel('weak'), 'weak');
  });

  it('falls back to medium for unsupported values', () => {
    assert.equal(normalizeSuggestionLevel('92'), 'medium');
    assert.equal(normalizeSuggestionLevel('high'), 'medium');
  });
});

describe('legacy v1 compatibility', () => {
  it('maps legacy categorySuggestion with existing id into selectedCategory', () => {
    const normalized = normalizeLegacyCategorySuggestionV1(
      { name: '技术', reason: '最接近主题' },
      input,
    );

    assert.deepEqual(normalized, {
      selectedCategory: {
        id: 'category-1',
        name: '技术',
        level: 'medium',
        reason: '最接近主题',
      },
      betterCategorySuggestion: null,
    });
  });

  it('maps legacy new tag suggestions into newTagSuggestions', () => {
    const normalized = normalizeLegacyTagSuggestionsV1(
      [
        { name: 'next.js', reason: '已有标签' },
        { name: '组件设计', reason: '新增标签', isNew: true },
      ],
      input,
    );

    assert.deepEqual(normalized, {
      selectedTags: [
        {
          id: 'tag-1',
          name: 'Next.js',
          level: 'medium',
          reason: '已有标签',
        },
      ],
      newTagSuggestions: [
        {
          name: '组件设计',
          level: 'medium',
          reason: '新增标签',
          isNew: true,
        },
      ],
    });
  });
});
