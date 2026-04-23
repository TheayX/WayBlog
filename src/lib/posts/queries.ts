import { PostStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 后台文章编辑表单所需的数据结构。
 *
 * 这里只保留管理后台真正需要回填的字段，避免把作者、统计等无关信息混入表单载荷，
 * 也让服务端页面与路由处理器可以稳定复用同一份映射结果。
 */
export interface AdminPostEditorData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  pinned: boolean;
  categoryId: string;
  tagIds: string[];
}

/**
 * 将帖子实体收敛为后台编辑页使用的最小数据结构。
 *
 * 这样做可以把 Prisma 查询结果和前端表单载荷解耦，后续即便详情查询增加了关联字段，
 * 也不会让管理后台表单被动跟着承接额外数据。
 */
function toAdminPostEditorData(post: {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: PostStatus;
  pinned: boolean;
  categoryId: string | null;
  tags: Array<{ id: string }>;
}): AdminPostEditorData {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt || '',
    coverImage: post.coverImage || '',
    status: post.status,
    pinned: post.pinned,
    categoryId: post.categoryId || '',
    tagIds: post.tags.map((tag) => tag.id),
  };
}

/**
 * 获取后台编辑页使用的文章数据。
 *
 * 此查询不承担鉴权职责，只负责读取并映射后台编辑场景所需字段；
 * 调用方必须明确处于受保护的管理后台或已经完成鉴权的接口中。
 */
export async function getAdminPostEditorData(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      status: true,
      pinned: true,
      categoryId: true,
      tags: { select: { id: true } },
    },
  });

  return post ? toAdminPostEditorData(post) : null;
}
