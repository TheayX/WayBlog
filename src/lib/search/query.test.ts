import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSearchTsQuery } from '@/lib/search/query';

test('buildSearchTsQuery joins normalized terms with AND semantics', () => {
  assert.equal(buildSearchTsQuery('next.js  Prisma 中文'), 'nextjs & Prisma & 中文');
});

test('buildSearchTsQuery drops punctuation-only input', () => {
  assert.equal(buildSearchTsQuery('  !!! ---  '), '');
});

test('buildSearchTsQuery keeps digits, ascii letters and Chinese characters', () => {
  assert.equal(buildSearchTsQuery('React19 PostgreSQL16 全文搜索'), 'React19 & PostgreSQL16 & 全文搜索');
});
