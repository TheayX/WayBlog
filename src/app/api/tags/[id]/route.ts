/**
 * 单个标签路由处理器。
 *
 * 该文件仅处理管理后台写操作：更新与删除都要求通过鉴权，
 * 并在进入数据库写入前校验请求体、确认目标存在以及排除名称/slug 冲突。
 * 删除分支会返回 204 空响应，更新分支则返回最新实体，便于调用方区分两类结果语义。
 */
import { NextRequest } from 'next/server';
import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updateTagSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 更新标签。
 *
 * 只在 name 或 slug 实际参与更新时做冲突查询，既保持语义清晰，
 * 也避免对无关字段更新产生额外数据库开销。
 * 更新成功返回最新标签实体，便于管理后台直接同步表格或表单状态。
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTagSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Tag not found');
    }

    if (parsed.data.slug || parsed.data.name) {
      const existingConflict = await prisma.tag.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(parsed.data.name ? [{ name: parsed.data.name }] : []),
            ...(parsed.data.slug ? [{ slug: parsed.data.slug }] : []),
          ],
        },
      });

      if (existingConflict) {
        return conflict('Tag name or slug already exists');
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: parsed.data,
    });

    return ok(tag);
  } catch (error) {
    return serverError('PUT /api/tags/[id]', error);
  }
}

/**
 * 删除标签。
 *
 * 先检查存在性再删除，可以让管理后台在并发编辑或重复点击删除时获得明确反馈。
 * 删除成功返回 204，调用方应把它视为“操作已完成”而不是“返回了新的标签数据”。
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.tag.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Tag not found');
    }

    await prisma.tag.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/tags/[id]', error);
  }
}
