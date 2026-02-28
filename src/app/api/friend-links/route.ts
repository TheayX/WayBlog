import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { createFriendLinkSchema } from '@/lib/validations';

// ─── GET /api/friend-links — 获取友链列表 ───
export async function GET() {
  try {
    const data = await prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/friend-links error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ─── POST /api/friend-links — 创建友链 ───
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createFriendLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const link = await prisma.friendLink.create({ data: parsed.data });

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    console.error('POST /api/friend-links error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

