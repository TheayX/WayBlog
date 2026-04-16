/**
 * 帖子阅读统计路由处理器。
 *
 * 该接口面向公开页/前台页面触发浏览事件，不要求登录；
 * 通过速率限制与按天去重的 UV 缓存控制单个访客的重复计数，避免管理后台与前台展示的阅读量被短时间刷新放大。
 */
import { NextRequest } from 'next/server';
import { notFound, ok, serverError, tooManyRequests } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { getClientIp, viewsLimiter } from '@/lib/rate-limit';

const uvCache = new Map<string, Set<string>>();
let lastCleanDate = new Date().toISOString().slice(0, 10);

/**
 * 仅保留当天的 UV 去重缓存。
 *
 * UV 语义是“按天的独立访客数”，跨天后必须清空内存态去重结果，
 * 否则第二天的访问会被错误复用为昨天的访客集合。
 */
function cleanUvCache() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastCleanDate) {
    uvCache.clear();
    lastCleanDate = today;
  }
}

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return notFound('Post not found');
    }

    cleanUvCache();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().slice(0, 10);
    const uvKey = `${postId}:${dateKey}`;

    let isNewUv = false;
    if (!uvCache.has(uvKey)) {
      uvCache.set(uvKey, new Set());
    }

    const ipSet = uvCache.get(uvKey)!;
    if (!ipSet.has(ip)) {
      ipSet.add(ip);
      isNewUv = true;
    }

    const [, updatedPost] = await prisma.$transaction([
      prisma.pageView.upsert({
        // `postId + date` 组合键保证同一帖子每天只维护一条聚合记录，避免 PV/UV 被拆散到多行数据里。
        where: { postId_date: { postId, date: today } },
        create: {
          postId,
          date: today,
          pvCount: 1,
          uvCount: isNewUv ? 1 : 0,
        },
        update: {
          pvCount: { increment: 1 },
          // UV 仅在“当天首次出现的 IP”时递增，重复访问只增加 PV。
          ...(isNewUv ? { uvCount: { increment: 1 } } : {}),
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      }),
    ]);

    return ok({ viewCount: updatedPost.viewCount });
  } catch (error) {
    return serverError('POST /api/posts/[id]/views', error);
  }
}
