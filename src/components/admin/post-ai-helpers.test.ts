import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAiFields,
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

test('applyAiFields reuses field applier and reports unmatched taxonomy fields', () => {
  let title = '';
  let slug = '';
  let content = '';
  let excerpt = '';
  let categoryId = '';
  let selectedTagIds: string[] = [];
  let slugManuallyEdited = false;

  const result = applyAiFields(
    ['title', 'slug', 'category', 'tags'],
    {
      title: '统一标题',
      slug: 'unified-title',
      content: '',
      excerpt: '',
      categorySuggestion: { name: '不存在的分类' },
      tagSuggestions: [{ name: '不存在的标签', isNew: true }],
    },
    categories,
    tags,
    {
      setTitle: (value) => {
        title = typeof value === 'function' ? value(title) : value;
        return title;
      },
      setSlug: (value) => {
        slug = typeof value === 'function' ? value(slug) : value;
        return slug;
      },
      setContent: (value) => {
        content = typeof value === 'function' ? value(content) : value;
        return content;
      },
      setExcerpt: (value) => {
        excerpt = typeof value === 'function' ? value(excerpt) : value;
        return excerpt;
      },
      setCategoryId: (value) => {
        categoryId = typeof value === 'function' ? value(categoryId) : value;
        return categoryId;
      },
      setSelectedTagIds: (value) => {
        selectedTagIds =
          typeof value === 'function' ? value(selectedTagIds) : value;
        return selectedTagIds;
      },
      setSlugManuallyEdited: (value) => {
        slugManuallyEdited =
          typeof value === 'function' ? value(slugManuallyEdited) : value;
        return slugManuallyEdited;
      },
    },
  );

  assert.deepEqual(result, {
    success: false,
    failures: ['category', 'tags'],
  });
  assert.equal(title, '统一标题');
  assert.equal(slug, 'unified-title');
  assert.equal(slugManuallyEdited, true);
  assert.equal(categoryId, '');
  assert.deepEqual(selectedTagIds, []);
});
