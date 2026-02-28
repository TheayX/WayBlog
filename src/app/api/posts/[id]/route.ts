import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { updatePostSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/posts/[id] — 获取单篇文章 ───
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ─── PUT /api/posts/[id] — 更新文章 ───
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const { tagIds, ...postData } = parsed.data;

    // slug 重复检查（排除自身）
    if (postData.slug) {
      const slugExists = await prisma.post.findFirst({
        where: { slug: postData.slug, id: { not: id } },
      });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug 已存在' }, { status: 409 });
      }
    }

    // 草稿 → 发布：自动设置 publishedAt
    const publishedAt =
      postData.status === 'PUBLISHED' && !existing.publishedAt
        ? new Date()
        : undefined;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(publishedAt && { publishedAt }),
        ...(tagIds !== undefined && {
          tags: { set: tagIds.map((tid) => ({ id: tid })) },
        }),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('PUT /api/posts/[id] error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ─── DELETE /api/posts/[id] — 删除文章 ───
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

