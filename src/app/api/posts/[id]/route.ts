/**
 * 单篇帖子路由处理器。
 *
 * - GET 仅返回管理后台编辑回填所需的最小字段，并要求先通过鉴权。
 * - PUT / DELETE 仅允许管理后台操作，且在真正写入前完成鉴权、请求校验、存在性判断与唯一性约束检查。
 */
import { NextRequest } from 'next/server';
import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { getAdminPostEditorData } from '@/lib/posts/queries';
import { prisma } from '@/lib/prisma';
import { updatePostSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取单篇帖子详情。
 *
 * 该入口只面向管理后台编辑页，因此必须先完成鉴权，再返回表单回填所需的最小字段。
 * 公开页详情不应复用这个接口，而应通过受控的公开查询链路按 slug 读取已发布文章。
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const post = await getAdminPostEditorData(id);

    if (!post) {
      return notFound('Post not found');
    }

    return ok(post);
  } catch (error) {
    return serverError('GET /api/posts/[id]', error);
  }
}

/**
 * 更新帖子。
 *
 * 该入口面向管理后台：校验通过后允许部分字段更新，并支持一次性重置标签集合。
 * 如果草稿首次切换为已发布，会补写 publishedAt，保证已发布内容在前台页面中的时间排序稳定。
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Post not found');
    }

    const { tagIds, ...postData } = parsed.data;

    if (postData.slug) {
      const slugExists = await prisma.post.findFirst({
        where: { id: { not: id }, slug: postData.slug },
      });

      // slug 在帖子体系中必须全局唯一，否则公开页路由与后台编辑入口都会出现歧义。
      if (slugExists) {
        return conflict('Post slug already exists');
      }
    }

    const publishedAt =
      postData.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : undefined;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(publishedAt ? { publishedAt } : {}),
        // tagIds 传入时使用 set 语义整体替换；未传入则保持现有关联不变，避免管理后台局部更新误清空标签。
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((tagId) => ({ id: tagId })) } } : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    return ok(post);
  } catch (error) {
    return serverError('PUT /api/posts/[id]', error);
  }
}

/**
 * 删除帖子。
 *
 * 仅管理后台允许执行，并在删除前显式检查存在性，确保调用方能区分“无权限”和“目标不存在”。
 * 删除成功返回 204 空响应，调用方应直接移除本地记录，而不是期待接口返回新的帖子实体。
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.post.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Post not found');
    }

    await prisma.post.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/posts/[id]', error);
  }
}
