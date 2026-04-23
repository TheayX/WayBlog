import { PostStatus } from '@generated/prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 获取管理后台仪表盘统计快照。
 *
 * 该 service 只负责聚合统计数据，不承担鉴权；
 * route handler 必须先确认当前请求来自已登录后台用户。
 */
export async function getDashboardStats() {
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
    prisma.pageView.findMany({
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      select: { id: true, title: true, slug: true, viewCount: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
    }),
  ]);

  // pageView 表按日期粒度累计原始记录，这里再次按天归一化，输出前端图表直接可消费的结构。
  const dailyMap = new Map<string, { pv: number; uv: number }>();
  for (const view of recentViews) {
    const dateKey = view.date.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateKey) || { pv: 0, uv: 0 };
    existing.pv += view.pvCount;
    existing.uv += view.uvCount;
    dailyMap.set(dateKey, existing);
  }

  const recentViewsData = Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    pv: stats.pv,
    uv: stats.uv,
  }));

  return {
    totalPosts,
    totalPublished,
    totalDrafts,
    totalCategories,
    totalTags,
    totalViews: viewsAgg._sum.viewCount || 0,
    recentViews: recentViewsData,
    topPosts,
  };
}
