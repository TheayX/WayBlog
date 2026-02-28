import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { PostStatus } from '@/generated/prisma';

// ─── GET /api/stats — 仪表盘统计 ───
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const [
      totalPosts,
      totalPublished,
      totalDrafts,
      totalCategories,
      totalTags,
      viewsAgg,
      recentViews,
      topPosts,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      // 最近 30 天每日 PV/UV
      prisma.pageView.findMany({
        where: {
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { date: 'asc' },
      }),
      // 浏览量 Top 5
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        select: { id: true, title: true, slug: true, viewCount: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
    ]);

    // 聚合每日 PV/UV
    const dailyMap = new Map<string, { pv: number; uv: number }>();
    for (const pv of recentViews) {
      const dateKey = pv.date.toISOString().slice(0, 10);
      const existing = dailyMap.get(dateKey) || { pv: 0, uv: 0 };
      existing.pv += pv.pvCount;
      existing.uv += pv.uvCount;
      dailyMap.set(dateKey, existing);
    }

    const recentViewsData = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      pv: stats.pv,
      uv: stats.uv,
    }));

    return NextResponse.json({
      data: {
        totalPosts,
        totalPublished,
        totalDrafts,
        totalCategories,
        totalTags,
        totalViews: viewsAgg._sum.viewCount || 0,
        recentViews: recentViewsData,
        topPosts,
      },
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

