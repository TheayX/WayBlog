import { prisma } from '@/lib/prisma';
import {
  buildSearchHighlightSegments,
  buildSearchTsQuery,
  SEARCH_HIT_END,
  SEARCH_HIT_START,
} from '@/lib/search/query';
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
  highlight: string;
  publishedAt: Date | null;
}

/**
 * 搜索已发布文章。
 *
 * 这里保留原有全文检索 SQL 语义：simple 字典、AND 词项、高亮正文片段、按 rank 排序。
 * 当相关度相同时再按发布时间倒序，避免同一关键词的结果顺序在不同查询间漂移。
 * 分类和标签仍由 ORM 补充，避免把关系 join 继续塞进原始 SQL。
 */
export async function searchPublishedPosts({ q, page, pageSize }: SearchPostsParams) {
  const tsQuery = buildSearchTsQuery(q);

  if (!tsQuery) {
    return {
      data: [] as SearchResult[],
      total: 0,
    };
  }

  const offset = (page - 1) * pageSize;

  const results: RawSearchResult[] = await prisma.$queryRawUnsafe(
    `SELECT p.id, p.title, p.slug,
            ts_headline('simple', p.content, to_tsquery('simple', $1),
              'StartSel=${SEARCH_HIT_START}, StopSel=${SEARCH_HIT_END}, MaxFragments=2, MaxWords=30, MinWords=10') AS highlight,
            p."publishedAt",
            ts_rank(p."search_vector", to_tsquery('simple', $1)) AS rank
     FROM "Post" p
     WHERE p.status = 'PUBLISHED'
       AND p."search_vector" @@ to_tsquery('simple', $1)
     ORDER BY rank DESC, p."publishedAt" DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    tsQuery,
    pageSize,
    offset,
  );

  const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int as count
     FROM "Post" p
     WHERE p.status = 'PUBLISHED'
       AND p."search_vector" @@ to_tsquery('simple', $1)`,
    tsQuery,
  );

  const postIds = results.map((result) => result.id);
  const postsWithRelations =
    postIds.length > 0
      ? await prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            category: { select: { name: true, slug: true } },
            tags: { select: { name: true, slug: true } },
          },
        })
      : [];

  const relationsMap = new Map(postsWithRelations.map((post) => [post.id, post]));
  const data = results.map((result) => {
    const { highlight, ...post } = result;

    return {
      ...post,
      highlightSegments: buildSearchHighlightSegments(highlight),
      category: relationsMap.get(result.id)?.category || null,
      tags: relationsMap.get(result.id)?.tags || [],
    };
  });

  return {
    data,
    total: Number(countResult[0]?.count || 0),
  };
}
