import { prisma } from '@/lib/prisma';

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

/**
 * 判断当前访问是否应该计入新的 UV。
 *
 * 当前仍沿用进程内 Map 去重；后续如果引入 Redis，只需要替换这一层的实现，
 * route handler 和数据库写入逻辑不需要继续改动。
 */
function markDailyUniqueVisitor(postId: string, ip: string, date: Date) {
  cleanUvCache();

  const dateKey = date.toISOString().slice(0, 10);
  const uvKey = `${postId}:${dateKey}`;

  if (!uvCache.has(uvKey)) {
    uvCache.set(uvKey, new Set());
  }

  const ipSet = uvCache.get(uvKey)!;
  if (ipSet.has(ip)) {
    return false;
  }

  ipSet.add(ip);
  return true;
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
  const isNewUv = markDailyUniqueVisitor(postId, ip, today);

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
