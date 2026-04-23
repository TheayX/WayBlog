/**
 * 帖子阅读统计路由处理器。
 *
 * 该接口面向公开页/前台页面触发浏览事件，不要求登录；
 * 通过速率限制与按天去重的 UV 缓存控制单个访客的重复计数，避免管理后台与前台展示的阅读量被短时间刷新放大。
 */
import { NextRequest } from 'next/server';
import { notFound, ok, serverError, tooManyRequests } from '@/lib/response';
import { recordPostView, viewTargetPostExists } from '@/lib/posts/views-service';
import { getClientIp, viewsLimiter } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 记录一次帖子浏览。
 *
 * 先进行限流与帖子存在性检查，再在事务中同时更新 page_views 聚合表与帖子总浏览量。
 * 返回值只暴露最新 viewCount，便于前台页面在不重新拉取详情的情况下即时刷新展示。
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const ip = getClientIp(request);
    const limitKey = `views:${ip}:${postId}`;

    // 同一 IP 对同一帖子短时间内重复上报时直接拒绝，降低刷量与无意义写入压力。
    if (!viewsLimiter.check(limitKey)) {
      return tooManyRequests();
    }

    if (!(await viewTargetPostExists(postId))) {
      return notFound('Post not found');
    }

    const viewCount = await recordPostView(postId, ip);
    return ok({ viewCount });
  } catch (error) {
    return serverError('POST /api/posts/[id]/views', error);
  }
}
