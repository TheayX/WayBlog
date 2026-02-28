import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { updateFriendLinkSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── PUT /api/friend-links/[id] — 更新友链 ───
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateFriendLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '友链不存在' }, { status: 404 });
    }

    const link = await prisma.friendLink.update({ where: { id }, data: parsed.data });

    return NextResponse.json({ data: link });
  } catch (error) {
    console.error('PUT /api/friend-links/[id] error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ─── DELETE /api/friend-links/[id] — 删除友链 ───
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;

    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '友链不存在' }, { status: 404 });
    }

    await prisma.friendLink.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/friend-links/[id] error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

