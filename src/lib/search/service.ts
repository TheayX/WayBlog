import { prisma } from '@/lib/prisma';
import { buildSearchHighlightSegments, buildSearchLikePattern, buildSearchTerms } from '@/lib/search/query';
import type { SearchResult } from '@/types';

interface SearchPostsParams {
  q: string;
  page: number;
  pageSize: number;
}

interface RawSearchResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: Date | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: Array<{ name: string; slug: string }>;
  score: number;
}

/**
 * 搜索已发布文章。
 *
 * 搜索范围统一覆盖标题、正文、分类和标签，并要求每个关键词至少命中其中一个字段。
 * 排序按字段权重累计分数后再以发布时间兜底，保证搜索结果既可解释也稳定。
 */
export async function searchPublishedPosts({ q, page, pageSize }: SearchPostsParams) {
  const terms = buildSearchTerms(q);

  if (terms.length === 0) {
    return {
      data: [] as SearchResult[],
      total: 0,
    };
  }

  const patterns = terms.map(buildSearchLikePattern);
  const offset = (page - 1) * pageSize;
  const { whereClause, scoreClause } = buildSearchSql(patterns);

  const results: RawSearchResult[] = await prisma.$queryRawUnsafe(
    `SELECT p.id,
            p.title,
            p.slug,
            p.content,
            p."publishedAt",
            c.name AS "categoryName",
            c.slug AS "categorySlug",
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('name', t.name, 'slug', t.slug))
              FILTER (WHERE t.id IS NOT NULL),
              '[]'::json
            ) AS tags,
            ${scoreClause} AS score
     FROM "Post" p
     LEFT JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "_PostToTag" pt ON pt."A" = p.id
     LEFT JOIN "Tag" t ON t.id = pt."B"
     WHERE ${whereClause}
     GROUP BY p.id, c.id
     ORDER BY score DESC, p."publishedAt" DESC NULLS LAST
     LIMIT $${patterns.length + 1} OFFSET $${patterns.length + 2}`,
    ...patterns,
    pageSize,
    offset,
  );

  const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int as count
     FROM "Post" p
     LEFT JOIN "Category" c ON c.id = p."categoryId"
     WHERE ${whereClause}`,
    ...patterns,
  );

  const data = results.map((result) => {
    const previewText = buildSearchPreviewText(result, terms);

    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      publishedAt: result.publishedAt,
      highlightSegments: buildSearchHighlightSegments(previewText, terms),
      category:
        result.categoryName && result.categorySlug
          ? { name: result.categoryName, slug: result.categorySlug }
          : null,
      tags: result.tags || [],
    };
  });

  return {
    data,
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * 生成搜索 SQL 片段。
 *
 * 每个关键词都必须在标题、正文、分类或任一标签中命中至少一次；
 * 同时按命中字段累加权重，保证标题和分类命中排在纯正文命中之前。
 */
function buildSearchSql(patterns: string[]) {
  const whereClauses = [`p.status = 'PUBLISHED'`];
  const scoreParts: string[] = [];

  for (const [index] of patterns.entries()) {
    const placeholder = `$${index + 1}`;
    const tagExistsClause = buildTagExistsClause(placeholder);

    whereClauses.push(
      `(p.title ILIKE ${placeholder} ESCAPE '\\' OR p.content ILIKE ${placeholder} ESCAPE '\\' OR c.name ILIKE ${placeholder} ESCAPE '\\' OR ${tagExistsClause})`,
    );
    scoreParts.push(`CASE WHEN p.title ILIKE ${placeholder} ESCAPE '\\' THEN 40 ELSE 0 END`);
    scoreParts.push(`CASE WHEN p.content ILIKE ${placeholder} ESCAPE '\\' THEN 18 ELSE 0 END`);
    scoreParts.push(`CASE WHEN c.name ILIKE ${placeholder} ESCAPE '\\' THEN 24 ELSE 0 END`);
    scoreParts.push(`CASE WHEN ${tagExistsClause} THEN 24 ELSE 0 END`);
  }

  return {
    whereClause: whereClauses.join('\n       AND '),
    scoreClause: scoreParts.join(' + '),
  };
}

/**
 * 构造标签命中子查询。
 *
 * 标签属于多对多关系，单独使用 `EXISTS` 可以避免把筛选逻辑绑死在主查询的聚合结果上。
 */
function buildTagExistsClause(placeholder: string) {
  return `EXISTS (
        SELECT 1
        FROM "_PostToTag" pt2
        INNER JOIN "Tag" t2 ON t2.id = pt2."B"
        WHERE pt2."A" = p.id
          AND t2.name ILIKE ${placeholder} ESCAPE '\\'
      )`;
}

/**
 * 选择最适合生成摘要的文本来源。
 *
 * 如果正文本身命中，就优先展示正文上下文；
 * 否则退回到“标题 / 分类 / 标签”摘要，确保标签和分类命中时也能给出可解释的预览。
 */
function buildSearchPreviewText(result: RawSearchResult, terms: string[]) {
  const normalizedContent = result.content.replace(/\s+/g, ' ').trim();
  const tagNames = result.tags.map((tag) => tag.name);
  const summary = [
    `标题：${result.title}`,
    result.categoryName ? `分类：${result.categoryName}` : null,
    tagNames.length > 0 ? `标签：${tagNames.join('、')}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return containsAnyTerm(normalizedContent, terms) ? normalizedContent : summary;
}

function containsAnyTerm(text: string, terms: string[]) {
  const lowerText = text.toLocaleLowerCase();
  return terms.some((term) => lowerText.includes(term.toLocaleLowerCase()));
}
