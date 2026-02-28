import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { createCategorySchema } from '@/lib/validations';
import { PostStatus } from '@/generated/prisma';

// ─── GET /api/categories — 获取分类列表 ───
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

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      postCount: c._count.posts,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ─── POST /api/categories — 创建分类 ───
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // 检查 name/slug 重复
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }] },
    });
    if (existing) {
      return NextResponse.json({ error: '分类名称或 Slug 已存在' }, { status: 409 });
    }

    const category = await prisma.category.create({ data: parsed.data });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

