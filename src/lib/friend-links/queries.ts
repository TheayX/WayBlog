import { prisma } from '@/lib/prisma';

/**
 * 获取公开友链列表。
 *
 * 友链页与后台列表保持同一排序规则：先按 sortOrder，再按创建时间倒序，
 * 确保公开展示顺序稳定且与后台维护结果一致。
 */
export async function getPublicFriendLinks() {
  return prisma.friendLink.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}
