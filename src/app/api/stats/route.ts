import { ok, serverError } from '@/lib/response';
import { requireAdminAccess } from '@/lib/api/admin';
import { getDashboardStats } from '@/lib/stats/service';

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
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    return ok(await getDashboardStats());
  } catch (error) {
    return serverError('GET /api/stats', error);
  }
}

