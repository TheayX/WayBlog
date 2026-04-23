import test from 'node:test';
import assert from 'node:assert/strict';

import { slugify, truncate } from '@/lib/utils';

test('slugify normalizes mixed Chinese and ascii text', () => {
  assert.equal(slugify('你好 WayBlog 2026'), 'ni-hao-wayblog-2026');
});

test('truncate keeps short text unchanged', () => {
  assert.equal(truncate('short', 10), 'short');
});

test('truncate trims long text and appends ellipsis', () => {
  assert.equal(truncate('hello world', 5), 'hello...');
});
