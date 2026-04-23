import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeSiteUrl } from './site';

test('normalizeSiteUrl removes trailing slashes', () => {
  assert.equal(normalizeSiteUrl('https://wayblog-demo.example.com///'), 'https://wayblog-demo.example.com');
});

test('normalizeSiteUrl keeps rootless local url unchanged', () => {
  assert.equal(normalizeSiteUrl('http://localhost:3610'), 'http://localhost:3610');
});
