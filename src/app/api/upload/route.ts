import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10); // 5MB

// ─── POST /api/upload — 上传图片 ───
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    // 校验文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件格式，仅支持 jpg/png/gif/webp' },
        { status: 400 },
      );
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `文件过大，最大允许 ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 413 },
      );
    }

    // 生成文件名：/uploads/{yyyy-MM}/{uuid}.{ext}
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', yearMonth);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${yearMonth}/${filename}`;

    return NextResponse.json(
      { data: { url, filename, size: file.size } },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

