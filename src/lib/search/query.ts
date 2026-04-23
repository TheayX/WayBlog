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
