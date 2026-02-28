import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { updateTagSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── PUT /api/tags/[id] — 更新标签 ───
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: '标签不存在' }, { status: 404 });
  }

  if (parsed.data.slug || parsed.data.name) {
    const conflict = await prisma.tag.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(parsed.data.name ? [{ name: parsed.data.name }] : []),
          ...(parsed.data.slug ? [{ slug: parsed.data.slug }] : []),
        ],
      },
    });
    if (conflict) {
      return NextResponse.json({ error: '标签名称或 Slug 已存在' }, { status: 409 });
    }
  }

  const tag = await prisma.tag.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ data: tag });
}

// ─── DELETE /api/tags/[id] — 删除标签 ───
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: '标签不存在' }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}

