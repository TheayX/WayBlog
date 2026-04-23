/**
 * 分类集合路由处理器。
 *
 * - GET 对公开页/前台页面与管理后台通用，返回分类基础信息及已发布文章数。
 * - POST 仅供管理后台创建分类，必须先完成鉴权、请求校验与名称/slug 唯一性检查。
 */
import { NextRequest } from 'next/server';
import { PostStatus } from '@/generated/prisma/client';
import { conflict, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { prisma } from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validations';

/**
 * 获取分类列表。
 *
 * 该接口没有请求体验证，因为输入为空，仅返回当前分类集合。
 * postCount 只统计已发布内容，保证公开页侧边栏、导航与管理后台概览看到的是一致的对外可见数量，
 * 不会把草稿误算进前台页面的内容规模。
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: { where: { status: PostStatus.PUBLISHED } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      postCount: category._count.posts,
      createdAt: category.createdAt,
    }));

    return ok(data);
  } catch (error) {
    return serverError('GET /api/categories', error);
  }
}

/**
 * 创建分类。
 *
 * 分类名称与 slug 都会进入公开页路由和管理后台筛选，因此在写库前显式拦截冲突，
 * 以返回明确的 409 语义，而不是依赖底层数据库异常。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, createCategorySchema);
    if (!parsed.success) return parsed.response;

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
      },
    });

    if (existing) {
      return conflict('Category name or slug already exists');
    }

    const category = await prisma.category.create({ data: parsed.data });
    return ok(category, { status: 201 });
  } catch (error) {
    return serverError('POST /api/categories', error);
  }
}
