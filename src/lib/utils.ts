import { clsx, type ClassValue } from 'clsx';

// ─── className 合并工具 ───
// 简化版：不引入 tailwind-merge，直接用 clsx
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Slug 生成 ───
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]+/g, '') // 保留中文、字母、数字、连字符
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── 日期格式化 ───
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ─── 截取摘要 ───
export function truncate(text: string, length: number = 200): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

