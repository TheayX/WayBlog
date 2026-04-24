import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSearchHighlightSegments,
  buildSearchLikePattern,
  buildSearchTerms,
} from '@/lib/search/query';

test('buildSearchTerms keeps distinct normalized terms', () => {
  assert.deepEqual(buildSearchTerms('next.js  Prisma 中文 Prisma'), ['nextjs', 'Prisma', '中文']);
});

test('buildSearchTerms drops punctuation-only input', () => {
  assert.deepEqual(buildSearchTerms('  !!! ---  '), []);
});

test('buildSearchTerms keeps digits, ascii letters and Chinese characters', () => {
  assert.deepEqual(buildSearchTerms('React19 PostgreSQL16 站内检索'), [
    'React19',
    'PostgreSQL16',
    '站内检索',
  ]);
});

test('buildSearchLikePattern escapes SQL wildcard characters', () => {
  assert.equal(buildSearchLikePattern('100%_done\\ok'), '%100\\%\\_done\\\\ok%');
});

test('buildSearchHighlightSegments highlights matched keywords inside excerpt', () => {
  assert.deepEqual(
    buildSearchHighlightSegments('使用 Prisma 构建博客搜索。', ['Prisma']),
    [
      { text: '使用 ', highlighted: false },
      { text: 'Prisma', highlighted: true },
      { text: ' 构建博客搜索。', highlighted: false },
    ],
  );
});

test('buildSearchHighlightSegments extracts excerpt around Chinese keyword', () => {
  const segments = buildSearchHighlightSegments(
    '在进入主题之前，前面先铺垫一些无关内容，用来确保欢迎这个关键词不会出现在摘要开头，而是出现在中间位置，最终验证截断逻辑。',
    ['欢迎'],
  );

  assert.deepEqual(segments, [
    { text: '在进入主题之前，前面先铺垫一些无关内容，用来确保', highlighted: false },
    { text: '欢迎', highlighted: true },
    { text: '这个关键词不会出现在摘要开头，而是出现在中间位置，最终验证截断逻辑。', highlighted: false },
  ]);
});
