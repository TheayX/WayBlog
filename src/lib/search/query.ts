import type { SearchHighlightSegment } from '@/types';

const excerptRadius = 36;
const excerptMaxLength = 120;

/**
 * 将用户输入拆成可搜索词项。
 *
 * 搜索现在按关键词匹配标题、正文、分类和标签，因此这里统一只保留字母或数字，
 * 并去重空词项，避免把标点或连续空格带进查询条件。
 */
export function buildSearchTerms(q: string) {
  return Array.from(
    new Set(
      q
        .trim()
        .split(/\s+/)
        .map((term) => term.replace(/[^\p{L}\p{N}]/gu, ''))
        .filter(Boolean),
    ),
  );
}

/**
 * 转义 SQL LIKE 通配符。
 *
 * 搜索词会被包装成 `%term%` 做模糊匹配，因此必须先转义 `%`、`_` 和反斜杠，
 * 避免用户输入意外改变匹配语义。
 */
export function buildSearchLikePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}

/**
 * 生成搜索结果摘要高亮片段。
 *
 * 摘要完全在应用层生成：先截取包含首个命中位置的局部文本，
 * 再把该片段拆成普通文本和高亮文本，避免继续依赖数据库分词行为。
 */
export function buildSearchHighlightSegments(text: string, terms: string[]): SearchHighlightSegment[] {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return [];

  const excerpt = buildSearchExcerpt(normalizedText, terms);
  return splitExcerptByTerms(excerpt, terms);
}

function buildSearchExcerpt(text: string, terms: string[]) {
  const match = findFirstMatch(text, terms);
  if (!match) {
    return text.length > excerptMaxLength ? `${text.slice(0, excerptMaxLength).trimEnd()}...` : text;
  }

  const start = Math.max(0, match.index - excerptRadius);
  const end = Math.min(text.length, match.index + match.term.length + excerptRadius);

  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function splitExcerptByTerms(excerpt: string, terms: string[]) {
  const segments: SearchHighlightSegment[] = [];
  let cursor = 0;

  while (cursor < excerpt.length) {
    const match = findFirstMatch(excerpt.slice(cursor), terms);

    if (!match) {
      const text = excerpt.slice(cursor);
      if (text) segments.push({ text, highlighted: false });
      break;
    }

    const start = cursor + match.index;
    const before = excerpt.slice(cursor, start);
    if (before) segments.push({ text: before, highlighted: false });

    const highlightedText = excerpt.slice(start, start + match.term.length);
    if (highlightedText) segments.push({ text: highlightedText, highlighted: true });

    cursor = start + match.term.length;
  }

  return segments;
}

function findFirstMatch(text: string, terms: string[]) {
  const lowerText = text.toLocaleLowerCase();
  let bestMatch: { index: number; term: string } | null = null;

  for (const term of terms) {
    const lowerTerm = term.toLocaleLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) continue;
    if (!bestMatch || index < bestMatch.index || (index === bestMatch.index && term.length > bestMatch.term.length)) {
      bestMatch = { index, term };
    }
  }

  return bestMatch;
}
