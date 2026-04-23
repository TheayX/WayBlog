import type { SearchHighlightSegment } from '@/types';

export const SEARCH_HIT_START = '__WAYBLOG_HIT_START__';
export const SEARCH_HIT_END = '__WAYBLOG_HIT_END__';

/**
 * 将用户搜索输入归一化为 PostgreSQL tsquery 词项。
 *
 * 只保留字母、数字和中文，再以 `&` 拼接为“全部词项都命中”的查询条件；
 * 空结果返回空字符串，由调用方决定是否短路为空搜索结果。
 */
export function buildSearchTsQuery(q: string) {
  const sanitizedTerms = q
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, ''))
    .filter(Boolean);

  return sanitizedTerms.length > 0 ? sanitizedTerms.join(' & ') : '';
}

/**
 * 将数据库高亮摘要解析成结构化片段。
 *
 * PostgreSQL 负责根据全文搜索结果截取摘要，但命中位置只用内部标记表达；
 * 前端收到的是纯文本片段数组，不再需要注入 HTML。
 */
export function buildSearchHighlightSegments(highlight: string): SearchHighlightSegment[] {
  const segments: SearchHighlightSegment[] = [];
  let cursor = 0;

  while (cursor < highlight.length) {
    const start = highlight.indexOf(SEARCH_HIT_START, cursor);

    if (start === -1) {
      const text = highlight.slice(cursor);
      if (text) segments.push({ text, highlighted: false });
      break;
    }

    const before = highlight.slice(cursor, start);
    if (before) segments.push({ text: before, highlighted: false });

    const textStart = start + SEARCH_HIT_START.length;
    const end = highlight.indexOf(SEARCH_HIT_END, textStart);

    if (end === -1) {
      const text = highlight.slice(textStart);
      if (text) segments.push({ text, highlighted: true });
      break;
    }

    const text = highlight.slice(textStart, end);
    if (text) segments.push({ text, highlighted: true });
    cursor = end + SEARCH_HIT_END.length;
  }

  return segments;
}
