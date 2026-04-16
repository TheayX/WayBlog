import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { PostStatus } from '@/generated/prisma/client';

/**
 * 管理后台仪表盘统计路由处理器。
 *
 * 该接口只服务于管理后台，因此必须先完成鉴权，避免把文章总量、草稿量、浏览趋势等运营信息暴露给公开页。
 * 返回值聚合了多个卡片与图表需要的数据，目的是让前端在一次请求里拿到完整统计快照，减少后台首页的瀑布流请求。
 * 这里没有单独叠加限流：一方面接口只对已登录后台开放，另一方面统计读取比公开搜索更偏向低频管理操作。
 * 成功响应中的 data 会同时包含文章/分类/标签总量、总浏览量、近 30 天 PV/UV 趋势以及已发布文章的热门榜单，
 * 这样管理后台无需再发起额外请求拼装首页卡片和图表。
 */
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
      // 最近 30 天每日 PV/UV，供后台趋势图使用。
      prisma.pageView.findMany({
        where: {
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { date: 'asc' },
      }),
      // Top 5 仅统计已发布文章，避免草稿进入管理后台“热门内容”语义。
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        select: { id: true, title: true, slug: true, viewCount: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
    ]);

    /**
     * pageView 表按日期粒度累计原始记录，这里再次按天归一化，输出前端图表直接可消费的结构。
     *
     * 这样可以把 PV/UV 聚合规则固定在路由层，避免前台页面或管理后台页面各自重复实现日期分组逻辑。
     */
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

