import { prisma } from '@/lib/prisma';
import { buildRedisKey, getRedisClient } from '@/lib/redis';

/**
 * 判断当前访问是否应该计入新的 UV。
 *
 * UV 去重状态写入 Redis Set，并设置短期过期时间，保证多实例部署时同一天同一访客只计一次。
 */
async function markDailyUniqueVisitor(postId: string, ip: string, date: Date) {
  const dateKey = date.toISOString().slice(0, 10);
  const redis = getRedisClient();
  const uvKey = buildRedisKey('views', 'uv', postId, dateKey);
  const added = await redis.sadd(uvKey, ip);

  if (added === 1) {
    await redis.expire(uvKey, 60 * 60 * 48);
  }

  return added === 1;
}

/** 判断文章是否存在。 */
export async function viewTargetPostExists(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  return Boolean(post);
}

/**
 * 记录一次文章浏览并返回最新总浏览量。
 *
 * 同一事务内更新每日 PV/UV 聚合和文章总浏览量，避免两个计数出现部分成功。
 */
export async function recordPostView(postId: string, ip: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isNewUv = await markDailyUniqueVisitor(postId, ip, today);

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

  return updatedPost.viewCount;
}
