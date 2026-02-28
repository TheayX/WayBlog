import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchSchema } from '@/lib/validations';
import { searchLimiter, getClientIp } from '@/lib/rate-limit';

// ─── GET /api/search — 搜索文章 ───
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

    // 将搜索词转为 tsquery 格式
    // 只保留字母、数字、中文，用 & 连接每个词
    const sanitizedTerms = q
      .trim()
      .split(/\s+/)
      .map((term) => term.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, ''))
      .filter(Boolean);

    if (sanitizedTerms.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, pageSize });
    }

    // 使用 & 连接词项作为 tsquery 输入
    const tsQuery = sanitizedTerms.join(' & ');

    // 搜索已发布文章
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

    // 获取关联的分类和标签
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

