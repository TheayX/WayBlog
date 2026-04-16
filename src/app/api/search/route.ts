import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchSchema } from '@/lib/validations';
import { searchLimiter, getClientIp } from '@/lib/rate-limit';

/**
 * 前台页面搜索路由处理器。
 *
 * 该接口面向公开页搜索场景，不要求登录，但必须在入口处做限流与参数校验：
 * - 限流用于抑制高频爬取和无意义的全文检索压力，保护数据库全文索引；
 * - 校验用于归一化分页与关键词参数，避免把脏输入继续传入 SQL；
 * - 返回结果只包含已发布文章，确保草稿和管理后台内容不会泄露到公开页。
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!searchLimiter.check(`search:${ip}`)) {
      return NextResponse.json({ error: '搜索请求过于频繁' }, { status: 429 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = searchSchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数错误', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { q, page, pageSize } = parsed.data;
    const offset = (page - 1) * pageSize;

    /**
     * 将用户输入归一化为 PostgreSQL tsquery 词项。
     *
     * 这里只保留字母、数字和中文，再以 & 拼接为“全部词项都命中”的查询条件，原因是：
     * - 避免把标点或特殊字符直接拼入 to_tsquery，降低语法报错和注入面的复杂度；
     * - 统一空白分词策略，让前台页面输入与数据库全文检索行为保持稳定；
     * - 空词项会被过滤，最终没有有效关键词时直接返回空结果，而不是执行一次全表搜索。
     */
    const sanitizedTerms = q
      .trim()
      .split(/\s+/)
      .map((term) => term.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, ''))
      .filter(Boolean);

    if (sanitizedTerms.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, pageSize });
    }

    // 使用 AND 语义拼接词项，优先保证搜索结果相关性，而不是放宽为任一词命中。
    const tsQuery = sanitizedTerms.join(' & ');

    /**
     * 搜索范围限定为已发布文章。
     *
     * 这里同时返回高亮摘要，便于前台页面直接展示命中上下文；摘要来自数据库全文检索函数，
     * 可减少应用层二次裁剪文本的重复成本。
     */
    const results: Array<{
      id: string;
      title: string;
      slug: string;
      highlight: string;
      publishedAt: Date | null;
    }> = await prisma.$queryRawUnsafe(
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

    // 获取总数
    const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count
       FROM "Post" p
       WHERE p.status = 'PUBLISHED'
         AND p."search_vector" @@ to_tsquery('simple', $1)`,
      tsQuery,
    );

    const total = Number(countResult[0]?.count || 0);

    /**
     * 搜索主查询只取列表必要字段，分类和标签补充查询留给 ORM 处理。
     *
     * 这样做的原因是全文检索 SQL 已经足够专注于排序和高亮，关系数据改由 Prisma 归一化组装，
     * 可读性更好，也能避免在原始 SQL 中继续堆叠多表 join。
     */
    const postIds = results.map((r) => r.id);
    const postsWithRelations = postIds.length > 0
      ? await prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            category: { select: { name: true, slug: true } },
            tags: { select: { name: true, slug: true } },
          },
        })
      : [];

    const relationsMap = new Map(postsWithRelations.map((p) => [p.id, p]));

    const data = results.map((r) => ({
      ...r,
      category: relationsMap.get(r.id)?.category || null,
      tags: relationsMap.get(r.id)?.tags || [],
    }));

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

