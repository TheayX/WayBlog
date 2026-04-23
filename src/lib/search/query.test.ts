import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSearchHighlightSegments, buildSearchTsQuery } from '@/lib/search/query';

test('buildSearchTsQuery joins normalized terms with AND semantics', () => {
  assert.equal(buildSearchTsQuery('next.js  Prisma 中文'), 'nextjs & Prisma & 中文');
});

test('buildSearchTsQuery drops punctuation-only input', () => {
  assert.equal(buildSearchTsQuery('  !!! ---  '), '');
});

test('buildSearchTsQuery keeps digits, ascii letters and Chinese characters', () => {
  assert.equal(buildSearchTsQuery('React19 PostgreSQL16 全文搜索'), 'React19 & PostgreSQL16 & 全文搜索');
});

test('buildSearchHighlightSegments converts database markers to plain segments', () => {
  assert.deepEqual(
    buildSearchHighlightSegments('使用 __WAYBLOG_HIT_START__Prisma__WAYBLOG_HIT_END__ 构建博客'),
    [
      { text: '使用 ', highlighted: false },
      { text: 'Prisma', highlighted: true },
      { text: ' 构建博客', highlighted: false },
    ],
  );
});

test('buildSearchHighlightSegments handles unmatched end marker as highlighted tail', () => {
  assert.deepEqual(buildSearchHighlightSegments('命中 __WAYBLOG_HIT_START__Next.js'), [
    { text: '命中 ', highlighted: false },
    { text: 'Next.js', highlighted: true },
  ]);
});
