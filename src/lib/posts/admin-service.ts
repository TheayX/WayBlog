import type { Prisma } from '@generated/prisma/client';
import { PostStatus } from '@generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { createPostSchema, updatePostSchema } from '@/lib/validations';
import type { z } from 'zod';

type CreatePostInput = z.infer<typeof createPostSchema>;
type UpdatePostInput = z.infer<typeof updatePostSchema>;

interface AdminPostListParams {
  page: number;
  pageSize: number;
  status?: PostStatus;
  categoryId?: string;
  tagId?: string;
  pinned?: boolean;
  isAdmin: boolean;
}

const adminPostListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  pinned: true,
  publishedAt: true,
  viewCount: true,
  createdAt: true,
  author: { select: { id: true, name: true, avatar: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostSelect;

const adminPostDetailInclude = {
  author: { select: { id: true, name: true, avatar: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostInclude;

/**
 * 构建文章列表查询条件。
 *
 * 管理员可以按状态筛选草稿和已发布文章；匿名访问始终强制限定为已发布内容，
 * 避免公开调用方通过构造查询参数读取后台草稿。
 */
function buildPostListWhere({
  status,
  categoryId,
  tagId,
  pinned,
  isAdmin,
}: Omit<AdminPostListParams, 'page' | 'pageSize'>) {
  const where: Prisma.PostWhereInput = {};

  if (status && isAdmin) {
    where.status = status;
  } else if (!isAdmin) {
    where.status = PostStatus.PUBLISHED;
  }

  if (categoryId) where.categoryId = categoryId;
  if (tagId) where.tags = { some: { id: tagId } };
  if (pinned !== undefined) where.pinned = pinned;

  return where;
}

/**
 * 获取后台/接口复用的文章分页列表。
 *
 * 这里保留原接口语义：同一 GET 入口可被公开侧和后台侧复用，
 * 但是否允许读取草稿由调用时传入的 isAdmin 决定。
 */
export async function getAdminPostList(params: AdminPostListParams) {
  const { page, pageSize } = params;
  const where = buildPostListWhere(params);

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: adminPostListSelect,
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

/**
 * 检查文章 slug 是否已经被其他文章占用。
 *
 * `excludeId` 用于更新场景排除当前文章自身，保持创建和更新复用同一条冲突规则。
 */
export async function postSlugExists(slug: string, excludeId?: string) {
  const existing = await prisma.post.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
}

/**
 * 创建文章。
 *
 * 已发布文章在创建时立即写入 publishedAt，保证公开页排序和发布时间语义一致。
 */
export async function createPost(input: CreatePostInput, authorId: string) {
  const { tagIds, ...postData } = input;
  const publishedAt = postData.status === 'PUBLISHED' ? new Date() : undefined;

  return prisma.post.create({
    data: {
      ...postData,
      publishedAt,
      authorId,
      tags: tagIds.length > 0 ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: adminPostDetailInclude,
  });
}

/**
 * 更新文章。
 *
 * tagIds 传入时使用 set 语义整体替换；未传入时保持现有关联不变，
 * 避免后台局部更新误清空标签。
 */
export async function updatePost(id: string, input: UpdatePostInput, existingPublishedAt: Date | null) {
  const { tagIds, ...postData } = input;
  const publishedAt =
    postData.status === 'PUBLISHED' && !existingPublishedAt ? new Date() : undefined;

  return prisma.post.update({
    where: { id },
    data: {
      ...postData,
      ...(publishedAt ? { publishedAt } : {}),
      ...(tagIds !== undefined ? { tags: { set: tagIds.map((tagId) => ({ id: tagId })) } } : {}),
    },
    include: adminPostDetailInclude,
  });
}

/** 获取文章存在性和发布时间，用于更新前的业务判断。 */
export async function getPostUpdateTarget(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: { id: true, publishedAt: true },
  });
}

/** 删除文章前确认目标是否存在。 */
export async function postExists(id: string) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 删除文章。 */
export async function deletePost(id: string) {
  return prisma.post.delete({ where: { id } });
}
