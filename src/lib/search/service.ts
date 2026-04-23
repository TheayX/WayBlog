import { prisma } from '@/lib/prisma';
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
 * 将用户输入归一化为 PostgreSQL tsquery 词项。
 *
 * 这里只保留字母、数字和中文，再以 `&` 拼接为“全部词项都命中”的查询条件，
 * 避免把标点或特殊字符直接拼入 to_tsquery。
 */
function buildTsQuery(q: string) {
  const sanitizedTerms = q
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, ''))
    .filter(Boolean);

  return sanitizedTerms.length > 0 ? sanitizedTerms.join(' & ') : '';
}

/**
 * 搜索已发布文章。
 *
 * 这里保留原有全文检索 SQL 语义：simple 字典、AND 词项、高亮正文片段、按 rank 排序。
 * 分类和标签仍由 ORM 补充，避免把关系 join 继续塞进原始 SQL。
 */
export async function searchPublishedPosts({ q, page, pageSize }: SearchPostsParams) {
  const tsQuery = buildTsQuery(q);

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
              'MaxFragments=2, MaxWords=30, MinWords=10') AS highlight,
            p."publishedAt"
     FROM "Post" p
     WHERE p.status = 'PUBLISHED'
       AND p."search_vector" @@ to_tsquery('simple', $1)
     ORDER BY ts_rank(p."search_vector", to_tsquery('simple', $1)) DESC
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
  const data = results.map((result) => ({
    ...result,
    category: relationsMap.get(result.id)?.category || null,
    tags: relationsMap.get(result.id)?.tags || [],
  }));

  return {
    data,
    total: Number(countResult[0]?.count || 0),
  };
}
