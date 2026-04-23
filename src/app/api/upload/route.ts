import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { badRequest, ok, payloadTooLarge, serverError } from '@/lib/response';
import { writeFile, mkdir } from 'fs/promises';
import { isAbsolute, join, relative, resolve } from 'path';
import { randomUUID } from 'crypto';

/**
 * 上传路由允许的 MIME 类型白名单。
 *
 * 这里只接受博客正文常见图片格式，目的是降低管理后台误传二进制文件、脚本文件或体积异常资源的概率。
 */
const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
} as const;

type AllowedUploadType = keyof typeof MIME_EXTENSION_MAP;

const DEFAULT_ALLOWED_TYPES = Object.keys(MIME_EXTENSION_MAP) as AllowedUploadType[];
const DEFAULT_UPLOAD_DIR = 'public/uploads';

export function getAllowedUploadTypes() {
  const configured = process.env.UPLOAD_ALLOWED_TYPES?.split(',')
    .map((type) => type.trim())
    .filter((type): type is AllowedUploadType => type in MIME_EXTENSION_MAP);

  return configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_TYPES;
}

/**
 * 单文件大小上限。
 *
 * 上限优先读环境变量，默认 5MB，兼顾前台页面展示体验与服务端磁盘占用；
 * 过大的图片即使能上传，也会拉高管理后台编辑等待时间和公开页首屏负担。
 */
export function getUploadMaxSize(value = process.env.UPLOAD_MAX_SIZE) {
  const parsed = Number.parseInt(value || '5242880', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5242880;
}

/**
 * 解析上传目录。
 *
 * 本地上传当前依赖 Next.js 公开目录，因此配置必须落在 public 下；
 * 这样既能支持当前单机部署，也能避免配置错误把文件写入项目外部或不可访问目录。
 */
export function resolveUploadDirectory(configured = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR) {
  const projectRoot = process.cwd();
  const publicRoot = resolve(projectRoot, 'public');
  const uploadRoot = resolve(projectRoot, configured);
  const publicRelativePath = relative(publicRoot, uploadRoot);

  if (
    publicRelativePath.startsWith('..') ||
    isAbsolute(publicRelativePath)
  ) {
    throw new Error('UPLOAD_DIR must be inside public directory');
  }

  return {
    uploadRoot,
    publicPrefix: publicRelativePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''),
  };
}

export function getExtensionForMime(type: string) {
  return MIME_EXTENSION_MAP[type as AllowedUploadType];
}

/**
 * 校验图片文件头。
 *
 * 浏览器上报的 MIME 只能作为第一层提示，真正落盘前仍需核对常见图片签名，
 * 避免脚本或任意二进制文件伪装成图片进入公开目录。
 */
export function hasValidImageSignature(type: string, buffer: Buffer) {
  if (type === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (type === 'image/png') {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((byte, index) => buffer[index] === byte);
  }

  if (type === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }

  if (type === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

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
      return badRequest(undefined, '请选择要上传的文件');
    }

    const allowedTypes = getAllowedUploadTypes();

    // 上传入口尽早校验类型，避免无效文件继续占用内存与磁盘写入流程。
    if (!allowedTypes.includes(file.type as AllowedUploadType)) {
      return badRequest(undefined, '不支持的文件格式，仅支持 jpg/png/gif/webp');
    }

    const maxSize = getUploadMaxSize();

    // 以服务端统一上限拦截超大文件，保持错误语义稳定，不依赖前端自行限制。
    if (file.size > maxSize) {
      return payloadTooLarge(`文件过大，最大允许 ${maxSize / 1024 / 1024}MB`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(file.type, buffer)) {
      return badRequest(undefined, '图片文件内容与格式不匹配');
    }

    /**
     * 文件按月份分目录存放，并使用 UUID 生成文件名。
     *
     * 这样可以降低同名覆盖概率，控制单目录文件数量，也方便后续按时间维度清理历史上传资源。
     */
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = getExtensionForMime(file.type);
    const filename = `${randomUUID()}.${ext}`;
    const uploadConfig = resolveUploadDirectory();

    const uploadDir = join(uploadConfig.uploadRoot, yearMonth);
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/${[uploadConfig.publicPrefix, yearMonth, filename].filter(Boolean).join('/')}`;

    return ok({ url, filename, size: file.size }, { status: 201 });
  } catch (error) {
    return serverError('POST /api/upload', error);
  }
}

