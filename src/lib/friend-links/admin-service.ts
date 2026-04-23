import { prisma } from '@/lib/prisma';
import type { createFriendLinkSchema, updateFriendLinkSchema } from '@/lib/validations';
import type { z } from 'zod';

type CreateFriendLinkInput = z.infer<typeof createFriendLinkSchema>;
type UpdateFriendLinkInput = z.infer<typeof updateFriendLinkSchema>;

/** 获取后台友链列表。 */
export async function getAdminFriendLinks() {
  return prisma.friendLink.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

/** 创建友链。 */
export async function createFriendLink(input: CreateFriendLinkInput) {
  return prisma.friendLink.create({ data: input });
}

/** 更新友链。 */
export async function updateFriendLink(id: string, input: UpdateFriendLinkInput) {
  return prisma.friendLink.update({
    where: { id },
    data: input,
  });
}

/** 判断友链是否存在。 */
export async function friendLinkExists(id: string) {
  const existing = await prisma.friendLink.findUnique({
    where: { id },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 删除友链。 */
export async function deleteFriendLink(id: string) {
  return prisma.friendLink.delete({ where: { id } });
}
