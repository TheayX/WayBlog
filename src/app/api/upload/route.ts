import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * 上传路由允许的 MIME 类型白名单。
 *
 * 这里只接受博客正文常见图片格式，目的是降低管理后台误传二进制文件、脚本文件或体积异常资源的概率。
 */
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function getAllowedUploadTypes() {
  const configured = process.env.UPLOAD_ALLOWED_TYPES?.split(',')
    .map((type) => type.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_TYPES;
}

const ALLOWED_TYPES = getAllowedUploadTypes();

/**
 * 单文件大小上限。
 *
 * 上限优先读环境变量，默认 5MB，兼顾前台页面展示体验与服务端磁盘占用；
 * 过大的图片即使能上传，也会拉高管理后台编辑等待时间和公开页首屏负担。
 */
const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';
const PUBLIC_UPLOAD_PREFIX = UPLOAD_DIR.replace(/\\/g, '/')
  .replace(/^\/+|\/+$/g, '')
  .replace(/^public\//, '');

/**
 * 管理后台图片上传路由处理器。
 *
 * 该接口必须鉴权，避免匿名用户借公开端点写入服务器文件；同时仅处理 multipart/form-data 中的 file 字段。
 * 返回 201 代表文件已成功落盘，data.url 是后续写入编辑器或正文内容的公开访问路径，而非磁盘绝对路径。
 * 这里主要依赖鉴权、类型白名单和体积限制控制风险，而不是额外叠加限流；上传频率问题可在更外层网关继续约束。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    // 上传入口尽早校验类型，避免无效文件继续占用内存与磁盘写入流程。
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件格式，仅支持 jpg/png/gif/webp' },
        { status: 400 },
      );
    }

    // 以服务端统一上限拦截超大文件，保持错误语义稳定，不依赖前端自行限制。
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `文件过大，最大允许 ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 413 },
      );
    }

    /**
     * 文件按月份分目录存放，并使用 UUID 生成文件名。
     *
     * 这样可以降低同名覆盖概率，控制单目录文件数量，也方便后续按时间维度清理历史上传资源。
     */
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;

    const uploadDir = join(process.cwd(), UPLOAD_DIR, yearMonth);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/${PUBLIC_UPLOAD_PREFIX}/${yearMonth}/${filename}`;

    return NextResponse.json(
      { data: { url, filename, size: file.size } },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

