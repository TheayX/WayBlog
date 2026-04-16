/**
 * 单个分类路由处理器。
 *
 * 该文件只承载管理后台操作：更新与删除都要求先完成鉴权，
 * 并在写入前明确处理“目标不存在”和“名称/slug 冲突”两类业务分支。
 */
import { NextRequest } from 'next/server';
import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updateCategorySchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 更新分类。
 *
 * 请求体允许部分字段更新，但只要名称或 slug 发生变化，就需要排除自身后再次检查唯一性，
 * 避免公开页/前台页面的分类路由与管理后台选择器出现重复候选项。
 * 更新成功时返回最新分类实体，便于管理后台直接用响应结果刷新表单或列表。
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Category not found');
    }

    if (parsed.data.slug || parsed.data.name) {
      const existingConflict = await prisma.category.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(parsed.data.name ? [{ name: parsed.data.name }] : []),
            ...(parsed.data.slug ? [{ slug: parsed.data.slug }] : []),
          ],
        },
      });

      if (existingConflict) {
        return conflict('Category name or slug already exists');
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return ok(category);
  } catch (error) {
    return serverError('PUT /api/categories/[id]', error);
  }
}

/**
 * 删除分类。
 *
 * 删除前先做存在性检查，保证管理后台可以拿到明确的 404 反馈，
 * 而不是把“不存在”和“删除成功但无返回体”混在一起。
 * 删除成功返回 204 空响应，调用方应据此移除本地列表项，而不是期待新的实体内容。
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Category not found');
    }

    await prisma.category.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/categories/[id]', error);
  }
}
