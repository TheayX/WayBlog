import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { createTagSchema } from '@/lib/validations';
import { PostStatus } from '@/generated/prisma';

// ─── GET /api/tags — 获取标签列表 ───
export async function GET() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { status: PostStatus.PUBLISHED } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const data = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    postCount: t._count.posts,
    createdAt: t.createdAt,
  }));

  return NextResponse.json({ data });
}

// ─── POST /api/tags — 创建标签 ───
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.tag.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }] },
  });
  if (existing) {
    return NextResponse.json({ error: '标签名称或 Slug 已存在' }, { status: 409 });
  }

  const tag = await prisma.tag.create({ data: parsed.data });

  return NextResponse.json({ data: tag }, { status: 201 });
}

