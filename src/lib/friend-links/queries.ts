import { unstable_cache } from 'next/cache';
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

/**
 * 获取公开友链列表。
 *
 * 友链页与后台列表保持同一排序规则：先按 sortOrder，再按创建时间倒序，
 * 确保公开展示顺序稳定且与后台维护结果一致。
 */
export const getPublicFriendLinks = unstable_cache(
  async () => {
    return prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  },
  ['public-friend-links'],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ['public-friend-links'] },
);
