import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAiFields,
  getMatchedCategoryId,
  getMatchedTagIds,
  getTaxonomyLevelLabel,
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

test('getTaxonomyLevelLabel maps v2 levels to readable text', () => {
  assert.equal(getTaxonomyLevelLabel('strong'), '十分推荐');
  assert.equal(getTaxonomyLevelLabel('medium'), '推荐');
  assert.equal(getTaxonomyLevelLabel('weak'), '一般推荐');
});

test('getMatchedCategoryId prefers explicit category id', () => {
  assert.equal(
    getMatchedCategoryId(categories, {
      selectedCategory: { id: 'category-explicit', name: '未知', level: 'strong' },
    }),
    'category-explicit',
  );
});

test('getMatchedCategoryId falls back to case-insensitive name matching', () => {
  assert.equal(
    getMatchedCategoryId(categories, {
      selectedCategory: { name: 'life', level: 'medium' },
    }),
    'category-b',
  );
});

test('getMatchedTagIds deduplicates selected existing ids', () => {
  assert.deepEqual(
    getMatchedTagIds(tags, {
      selectedTags: [
        { id: 'tag-a', name: 'Next.js', level: 'strong' },
        { name: 'prisma', level: 'medium' },
        { id: 'tag-a', name: 'Next.js', level: 'strong' },
      ],
    }),
    ['tag-a', 'tag-b'],
  );
});

test('normalizeFieldResult maps title field into v2 payload shape', () => {
  assert.deepEqual(normalizeFieldResult({ field: 'title', value: '新标题', warnings: [] }), {
    title: '新标题',
    slug: '',
    content: '',
    excerpt: '',
    selectedCategory: null,
    betterCategorySuggestion: null,
    selectedTags: [],
    newTagSuggestions: [],
  });
});

test('normalizeFieldResult maps category field into v2 taxonomy payload', () => {
  assert.deepEqual(
    normalizeFieldResult({
      field: 'category',
      selectedCategory: { id: 'category-a', name: '技术', level: 'strong' },
      betterCategorySuggestion: {
        name: '前端工程',
        level: 'medium',
        isNew: true,
      },
      warnings: [],
    }),
    {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      selectedCategory: { id: 'category-a', name: '技术', level: 'strong' },
      betterCategorySuggestion: {
        name: '前端工程',
        level: 'medium',
        isNew: true,
      },
      selectedTags: [],
      newTagSuggestions: [],
    },
  );
});

test('applyAiFields reports unmatched taxonomy fields when only new suggestions exist', () => {
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
      betterCategorySuggestion: { name: '前端工程', level: 'medium', isNew: true },
      newTagSuggestions: [{ name: '组件设计', level: 'medium', isNew: true }],
      selectedCategory: null,
      selectedTags: [],
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
        selectedTagIds = typeof value === 'function' ? value(selectedTagIds) : value;
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
