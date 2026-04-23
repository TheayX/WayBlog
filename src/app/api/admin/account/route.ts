/**
 * 管理员账号设置路由处理器。
 *
 * 当前项目是单管理员模型，因此这里仅允许已登录用户读取和修改自己的账号资料；
 * 密码修改会重新生成 bcrypt hash，不会保存或返回任何明文密码。
 */
import { compare, hash } from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { badRequest, conflict, notFound, ok, serverError } from '@/lib/response';
import {
  updateAccountPasswordSchema,
  updateAccountProfileSchema,
} from '@/lib/validations';
import {
  auditAccountPasswordUpdated,
  auditAccountProfileUpdated,
} from '@/lib/auth/audit';

/** 获取当前管理员账号资料。 */
export async function GET() {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id! },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return notFound('User not found');
    }

    return ok(user);
  } catch (error) {
    return serverError('GET /api/admin/account', error);
  }
}

/** 更新当前管理员账号资料。 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, updateAccountProfileSchema);
    if (!parsed.success) return parsed.response;

    const email = parsed.data.email.trim().toLowerCase();
    const name = parsed.data.name.trim();
    const avatar = parsed.data.avatar?.trim() || null;

    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: authResult.user.id! },
      },
      select: { id: true },
    });

    if (existing) {
      return conflict('Email already exists');
    }

    const user = await prisma.user.update({
      where: { id: authResult.user.id! },
      data: { email, name, avatar },
      select: { id: true, email: true, name: true, avatar: true, updatedAt: true },
    });

    auditAccountProfileUpdated({ userId: user.id, email: user.email });

    return ok(user);
  } catch (error) {
    return serverError('PUT /api/admin/account', error);
  }
}

/** 修改当前管理员密码。 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, updateAccountPasswordSchema);
    if (!parsed.success) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id! },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      return notFound('User not found');
    }

    const passwordValid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!passwordValid) {
      return badRequest(undefined, '当前密码不正确');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(parsed.data.newPassword, 12) },
      select: { id: true },
    });

    auditAccountPasswordUpdated({ userId: user.id, email: user.email });

    return ok({ updated: true });
  } catch (error) {
    return serverError('PATCH /api/admin/account', error);
  }
}
