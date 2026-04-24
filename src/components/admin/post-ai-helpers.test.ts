import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMatchedCategoryId,
  getMatchedTagIds,
  normalizeFieldResult,
} from '@/components/admin/post-ai-helpers';

const categories = [
  { id: 'category-a', name: '技术' },
  { id: 'category-b', name: 'Life' },
];

const tags = [
  { id: 'tag-a', name: 'Next.js' },
  { id: 'tag-b', name: 'Prisma' },
];

test('getMatchedCategoryId prefers explicit category id', () => {
  assert.equal(
    getMatchedCategoryId(categories, {
      categorySuggestion: { id: 'category-explicit', name: '未知' },
    }),
    'category-explicit',
  );
});

test('getMatchedCategoryId falls back to case-insensitive name matching', () => {
  assert.equal(
    getMatchedCategoryId(categories, {
      categorySuggestion: { name: 'life' },
    }),
    'category-b',
  );
});

test('getMatchedTagIds ignores new tags and deduplicates existing ids', () => {
  assert.deepEqual(
    getMatchedTagIds(tags, {
      tagSuggestions: [
        { id: 'tag-a', name: 'Next.js' },
        { name: 'prisma' },
        { name: '新标签', isNew: true },
        { id: 'tag-a', name: 'Next.js' },
      ],
    }),
    ['tag-a', 'tag-b'],
  );
});

test('normalizeFieldResult maps single field values into full apply payload shape', () => {
  assert.deepEqual(normalizeFieldResult({ field: 'title', value: '新标题', warnings: [] }), {
    title: '新标题',
    slug: '',
    content: '',
    excerpt: '',
    categorySuggestion: null,
    tagSuggestions: [],
  });
});

test('normalizeFieldResult maps identity result into combined title and slug payload', () => {
  assert.deepEqual(
    normalizeFieldResult({
      field: 'identity',
      title: '新的标题',
      slug: 'new-title',
      warnings: [],
    }),
    {
      title: '新的标题',
      slug: 'new-title',
      content: '',
      excerpt: '',
      categorySuggestion: null,
      tagSuggestions: [],
    },
  );
});
